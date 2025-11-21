import { 
  Upload, 
  Select, 
  Message,
  Alert,
  Modal,
  Table,
  Spin,
  Tag,
  Button,
  Checkbox,
  Input,
} from '@arco-design/web-react'
import { 
  IconUpload,
  IconApps,
  IconSettings,
  IconFile,
} from '@arco-design/web-react/icon'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/store/profileStore'

interface ScanItem {
  index: number
  text: string
  style: string
  styleId?: string
  suggested_key: string
}

export function PageHome() {
  const navigate = useNavigate()
  const {
    profiles,
    selectedProfileId,
    selectProfile,
  } = useProfileStore()

  // 页面状态
  const [view, setView] = useState<'home' | 'settings'>('home')
  
  // 核心状态
  const [isScanning, setIsScanning] = useState(false)
  const [scanReport, setScanReport] = useState<ScanItem[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [textReplacements, setTextReplacements] = useState<Record<string, string>>({})
  const [isScanModalOpen, setScanModalOpen] = useState(false)
  const [currentFilePath, setCurrentFilePath] = useState<string>('')
  const [excludedStyles, setExcludedStyles] = useState<string[]>([])
  const [excludedTargets, setExcludedTargets] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState<string>('')

  // 智能扫描疑似标题
  const handleScan = async (file: File | undefined) => {
    if (!file) return
    
    const filePath = (file as any).path || ''
    if (!filePath) {
      Message.error('无法获取文件路径，请确保在Electron环境中运行')
      return
    }

    setCurrentFilePath(filePath)
    setIsScanning(true)
    
    try {
      const report = await window.electronAPI.scanHeadings(filePath, 16)
      if (report.success && report.structure && report.structure.length > 0) {
        // 兼容Python返回的suggestedStyle字段
        const initialMappings: Record<string, string> = {}
        const scanItems = report.structure.map((item: any) => ({
          ...item,
          suggested_key: item.suggestedStyle // 统一前端字段名
        }))
        scanItems.forEach((item: any) => {
          initialMappings[String(item.index)] = item.suggested_key
        })
        setScanReport(scanItems)
        setMappings(initialMappings)
        // 默认排除正文类样式
        const commonBodyStyles = ['Normal', '正文', 'List Paragraph', '列出段落', '列出段落 1', '列出段落1']
        const defaultExcluded = scanItems
          .map((item: any) => item.style)
          .filter((style: string) => commonBodyStyles.includes(style))
        setExcludedStyles(Array.from(new Set(defaultExcluded)))
        setScanModalOpen(true)
      } else {
        Message.info('文档结构良好，无需纠偏，直接开始格式化')
        handleConfirmFormat({})
      }
    } catch (error: any) {
      Message.error('扫描失败: ' + (error.message || '未知错误'))
    } finally {
      setIsScanning(false)
    }
  }

  // 确认纠偏并最终格式化
  const handleConfirmFormat = async (finalMappings = mappings) => {
    setScanModalOpen(false)
    
    if (!currentFilePath || !selectedProfileId) {
      Message.error('请先选择文件和格式规范')
      return
    }

    const profile = profiles.find((p) => p.id === selectedProfileId)
    if (!profile) {
      Message.error('未找到选中的格式规范')
      return
    }

    Message.loading({ content: '正在格式化文档...', duration: 0, id: 'format-loading' })
    
    try {
      const payload = {
        profile,
        mappings: finalMappings,
        text_replacements: textReplacements
      }
      
      // 调试日志：输出 mappings 内容
      console.log('[PageHome] Sending mappings:', finalMappings)
      console.log('[PageHome] Sending text_replacements:', textReplacements)
      console.log('[PageHome] Sending payload:', JSON.stringify(payload, null, 2))
      
      const result = await window.electronAPI.formatDocument(currentFilePath, payload)
      
      Message.clear()
      if (result.success) {
        Message.success(result.message)
        if (result.outputPath) {
          window.electronAPI?.showInFolder(result.outputPath)
        }
      } else {
        Message.error(result.message)
      }
    } catch (error: any) {
      Message.clear()
      Message.error(error.message || '处理失败')
    }
  }

  // 获取所有唯一样式用于排除选择器
  const uniqueStyles = Array.from(new Set(scanReport.map(item => item.style).filter(Boolean)))
  
  // 目标规范标签映射
  const targetLabels: Record<string, string> = {
    documentTitle: '文档标题',
    heading1: '一级标题',
    heading2: '二级标题',
    heading3: '三级标题',
    heading4: '四级标题',
    body: '正文'
  }
  
  // 过滤后的扫描结果（排除指定原样式 + 排除指定目标规范 + 搜索关键字）
  const filteredScanReport = scanReport.filter(item => {
    // 排除原样式
    if (excludedStyles.includes(item.style)) return false
    
    // 排除目标规范
    const targetKey = mappings[String(item.index)] || item.suggested_key
    if (excludedTargets.includes(targetKey)) return false
    
    // 搜索关键字过滤
    if (searchKeyword && !item.text.toLowerCase().includes(searchKeyword.toLowerCase())) return false
    
    return true
  })
  
  // 批量纠偏函数
  const handleBatchCorrect = (targetKey: string) => {
    const newMappings = { ...mappings }
    filteredScanReport.forEach(item => {
      newMappings[String(item.index)] = targetKey
    })
    setMappings(newMappings)
    Message.success(`已将 ${filteredScanReport.length} 个段落批量设置为「${targetLabels[targetKey]}」`)
  }

  // 表格列定义：即时预览（按代码标准）
  const columns = [
    {
      title: '预览 (即时效果)',
      dataIndex: 'text',
      width: '45%',
      render: (text: string, record: ScanItem) => {
        // 1. 实时获取当前选中的样式 Key (优先取用户修改的 mappings，否则取默认猜测)
        const currentStyleKey = mappings[String(record.index)] || record.suggested_key

        // 3. 从选中规范读取真实字体与字号
        const profile = profiles.find(p => p.id === selectedProfileId)
        const styleConfig = profile?.styles?.[currentStyleKey as keyof typeof profile.styles]
        const fontFamily = styleConfig?.fontFamily || 'inherit'
        const fontSize = styleConfig?.fontSize ? `${styleConfig.fontSize}pt` : 'inherit'

        // 4. 获取当前显示文本 (优先取 textReplacements)
        const displayText = textReplacements[String(record.index)] !== undefined 
          ? textReplacements[String(record.index)] 
          : text

        // 5. 应用样式（内联字体覆盖Tailwind默认）
        // 使用 Input 组件允许用户编辑
        return (
          <div className="relative">
            <Input
              style={{ 
                fontFamily, 
                fontSize, 
                height: 'auto', 
                padding: '8px 12px',
                width: '100%',
                backgroundColor: '#f7f8fa',
                border: '1px solid #e5e6eb',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
              }}
              value={displayText}
              onChange={(val) => {
                setTextReplacements(prev => ({
                  ...prev,
                  [String(record.index)]: val
                }))
              }}
              placeholder="点击此处编辑文本..."
              onFocus={(e) => {
                e.target.style.backgroundColor = '#ffffff'
                e.target.style.borderColor = '#165DFF'
                e.target.style.boxShadow = '0 0 0 2px rgba(22,93,255,0.1)'
              }}
              onBlur={(e) => {
                e.target.style.backgroundColor = '#f7f8fa'
                e.target.style.borderColor = '#e5e6eb'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        )
      },
    },
    {
      title: '字数',
      dataIndex: 'text',
      width: '8%',
      render: (text: string) => (
        <span className="text-sm text-gray-600">{text.length}</span>
      )
    },
    {
      title: '原 Word 样式',
      dataIndex: 'style',
      width: '15%',
      render: (_: string, record: ScanItem) => {
        const styleName = typeof record.style === 'string' ? record.style : ''
        const display = styleName && styleName.trim() ? styleName : '-'
        let color: 'arcoblue' | 'green' | 'orange' | 'purple' | 'red' = 'arcoblue'
        if (display === 'Normal' || display === '正文') color = 'red'
        if (display.includes('Heading') || display.includes('标题')) color = 'green'
        if (display.includes('Title') || display === '标题') color = 'purple'
        return <Tag color={color} bordered>{display}</Tag>
      }
    },
    {
      title: '目标规范 (纠偏)',
      dataIndex: 'operation',
      width: '32%',
      render: (_: any, record: ScanItem) => (
        <Select
          style={{ width: '100%' }}
          value={mappings[String(record.index)] || record.suggested_key}
          onChange={(val) => {
            // 更新 mappings 状态，这将触发第一列 render 函数的重新渲染
            setMappings(prev => ({ ...prev, [String(record.index)]: val }))
          }}
        >
          <Select.Option value="documentTitle">文档标题 (Word: Title)</Select.Option>
          <Select.Option value="heading1">一级标题 (Word: Heading 1)</Select.Option>
          <Select.Option value="heading2">二级标题 (Word: Heading 2)</Select.Option>
          <Select.Option value="heading3">三级标题 (Word: Heading 3)</Select.Option>
          <Select.Option value="heading4">四级标题 (Word: Heading 4)</Select.Option>
          <Select.Option value="body">[设为正文]</Select.Option>
        </Select>
      )
    }
  ]

  // 渲染上传状态 - 优化左右分栏布局
  const renderUploadState = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* 左侧：配置区 (占 4/12) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-full hover:shadow-md transition-shadow relative overflow-hidden group">
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <IconSettings style={{ fontSize: 120, color: '#165DFF' }} />
          </div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <span className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-md">1</span>
            <span className="font-bold text-gray-800 text-lg">选择目标规范</span>
          </div>
          
          <p className="text-sm text-gray-500 mb-8 leading-relaxed relative z-10">
            请选择适用于本文档的格式标准。系统将自动应用该规范中定义的字体、字号及版式布局。
          </p>
          
          <div className="relative z-10">
            <Select 
              placeholder="请选择要应用的格式规范" 
              value={selectedProfileId || undefined} 
              onChange={(value) => selectProfile(value)} 
              size="large" 
              style={{ width: '100%' }}
            >
              {profiles.map((profile) => (
                <Select.Option key={profile.id} value={profile.id}>
                  {profile.name} {profile.isDefault && '(默认)'}
                </Select.Option>
              ))}
            </Select>
          </div>
          
          {/* 底部入口已移除，避免与右上角标签切换重复 */}
        </div>
      </div>

      {/* 右侧：上传区 (占 8/12) */}
      <div className="lg:col-span-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-200">2</span>
            <span className="font-bold text-gray-800 text-lg">上传文档</span>
          </div>
          
          <Upload
            drag
            multiple={false}
            autoUpload={false}
            showUploadList={false}
            onChange={(_fileList, currentFile) => {
              if (currentFile && currentFile.originFile) {
                handleScan(currentFile.originFile)
              }
            }}
            accept=".docx"
          >
            <div className="h-80 w-full bg-blue-50/30 border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-500 transition-all cursor-pointer group">
              <div className="bg-white p-6 rounded-full shadow-sm mb-6 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                <IconUpload style={{ fontSize: 40, color: '#165DFF' }} />
              </div>
              <p className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">点击或拖拽文件到此处</p>
              <p className="text-gray-500 mt-2 text-sm">支持 .docx 格式，最大 50MB</p>
            </div>
          </Upload>
        </div>
      </div>
    </div>
  )

  // 渲染顶部导航栏
  const renderNavbar = () => (
    <nav className="sticky top-0 left-0 right-0 z-50 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="h-full px-8 flex items-center justify-between">
        {/* 左侧 Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-500 p-1.5 rounded-lg shadow-sm shadow-blue-200/50">
            <IconFile style={{ fontSize: 20, color: 'white' }} />
          </div>
          <span className="text-lg font-bold text-gray-800 tracking-tight">公文格式化助手</span>
        </div>
        
        {/* 右侧导航按钮 - 胶囊切换器 */}
        <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/50">
          <button 
            onClick={() => setView('home')} 
            className={`flex items-center px-5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              view === 'home' 
                ? 'bg-white text-blue-600 shadow-sm font-bold' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <IconApps className="mr-2" /> 工作台
          </button>
          <button 
            onClick={() => navigate('/profiles')} 
            className={`flex items-center px-5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              view === 'settings' 
                ? 'bg-white text-blue-600 shadow-sm font-bold' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <IconSettings className="mr-2" /> 规范管理
          </button>
        </div>
      </div>
    </nav>
  )

  // 渲染扫描加载状态
  const renderScanningState = () => (
    <div className="w-full bg-white rounded-2xl shadow-xl h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-blue-50/30 animate-pulse"></div>
      <Spin dot size={50} />
      <h3 className="text-2xl font-bold text-gray-800 mt-8 relative z-10">AI 智能扫描中...</h3>
      <p className="text-gray-500 mt-2 relative z-10">正在分析文档结构与样式特征</p>
    </div>
  )

  return (
    // 根容器：全屏背景
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* 顶部导航栏 */}
      {renderNavbar()}
      
      {/* 主内容区：添加顶部间距避免被导航栏遮挡 */}
      <div className="pt-24 pb-10 px-6 flex flex-col items-center">
        
        {/* 欢迎语 */}
        <div className="mb-10 text-center w-full max-w-6xl">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">开始新的格式化任务</h2>
          <p className="text-gray-500 mt-3 text-base">AI 智能识别文档结构，一键应用标准公文格式</p>
        </div>

        {/* 主工作区 */}
        <div className="w-full max-w-6xl">
          {isScanning ? renderScanningState() : renderUploadState()}
        </div>

      </div>

      {/* 模态框组件 */}
      <Modal
        title={<div className="text-lg font-bold">🔍 结构纠偏确认</div>}
        visible={isScanModalOpen}
        onCancel={() => setScanModalOpen(false)}
        onOk={() => handleConfirmFormat()}
        okText="确认并开始格式化"
        cancelText="取消"
        style={{ width: 1000 }}
        autoFocus={false}
        focusLock={true}
      >
        <div className="mb-4 space-y-4">
          <Alert 
            type="info" 
            showIcon
            content={`共扫描到 ${scanReport.length} 个段落，当前显示 ${filteredScanReport.length} 个（已过滤 ${scanReport.length - filteredScanReport.length} 个）。可调整筛选条件或批量修改目标规范。`} 
          />
          
          {/* 整合的搜索/筛选区域 */}
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-5 rounded-xl border border-blue-100">
            {/* 搜索框 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-700">🔍 搜索关键字</span>
                {searchKeyword && (
                  <Button size="mini" type="text" onClick={() => setSearchKeyword('')}>
                    清空
                  </Button>
                )}
              </div>
              <Input
                placeholder="输入关键字筛选表格内容..."
                value={searchKeyword}
                onChange={setSearchKeyword}
                allowClear
                style={{ width: '100%' }}
              />
            </div>
            
            {/* 排除原样式 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-700">📌 排除原样式</span>
                {excludedStyles.length > 0 && (
                  <Button size="mini" type="text" onClick={() => setExcludedStyles([])}>
                    清除排除
                  </Button>
                )}
              </div>
              <Checkbox.Group 
                value={excludedStyles} 
                onChange={(values) => setExcludedStyles(values as string[])}
                style={{ width: '100%' }}
              >
                <div className="flex flex-wrap gap-2">
                  {uniqueStyles.map(style => {
                    const count = scanReport.filter(item => item.style === style).length
                    return (
                      <Checkbox key={style} value={style}>
                        <span className="text-xs whitespace-nowrap">{style} <span className="text-gray-400">({count})</span></span>
                      </Checkbox>
                    )
                  })}
                </div>
              </Checkbox.Group>
            </div>
            
            {/* 排除目标规范 */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-700">🎯 排除目标规范</span>
                {excludedTargets.length > 0 && (
                  <Button size="mini" type="text" onClick={() => setExcludedTargets([])}>
                    清除排除
                  </Button>
                )}
              </div>
              <Checkbox.Group 
                value={excludedTargets} 
                onChange={(values) => setExcludedTargets(values as string[])}
                style={{ width: '100%' }}
              >
                <div className="flex flex-wrap gap-2">
                  {Object.entries(targetLabels).map(([key, label]) => {
                    const count = scanReport.filter(item => {
                      const target = mappings[String(item.index)] || item.suggested_key
                      return target === key
                    }).length
                    return (
                      <Checkbox key={key} value={key}>
                        <span className="text-xs whitespace-nowrap">{label} <span className="text-gray-400">({count})</span></span>
                      </Checkbox>
                    )
                  })}
                </div>
              </Checkbox.Group>
            </div>
            
            {/* 批量纠偏按钮 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-700">⚡ 批量纠偏</span>
                <span className="text-xs text-gray-500">将当前筛选结果的 {filteredScanReport.length} 个段落批量设置为：</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(targetLabels).map(([key, label]) => (
                  <Button 
                    key={key} 
                    size="small"
                    type="outline"
                    onClick={() => handleBatchCorrect(key)}
                    disabled={filteredScanReport.length === 0}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <Table 
          columns={columns} 
          data={filteredScanReport} 
          pagination={false} 
          scroll={{ y: 350 }} 
          rowKey="index"
          stripe
          border
          key={JSON.stringify(mappings) + JSON.stringify(excludedStyles) + JSON.stringify(excludedTargets) + searchKeyword}
        />
      </Modal>
    </div>
  )
}
