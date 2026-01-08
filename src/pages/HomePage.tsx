import { useState } from 'react'
import {
  Upload, Select, Message, Alert, Modal, Table, Spin, Tag, Button, Checkbox, Input, Switch
} from '@arco-design/web-react'
import {
  IconUpload, IconApps, IconSettings, IconFile, IconCheckCircle, IconExclamationCircle
} from '@arco-design/web-react/icon'
import { useProfileStore } from '@/store/profileStore'
import { useNavigate } from 'react-router-dom'

// --- 类型定义 ---
interface ManualNumbering {
  type: 'arabic' | 'chinese' | 'parenthesis';
  match: string;
  clean_text: string;
}

interface ScanItem {
  index: number;
  text: string;
  style: string;
  suggested_key: string;
  manual_numbering?: ManualNumbering;
}

// InfoPill 组件已移除（未使用）

export default function HomePage() {
  const { profiles, selectedProfileId, selectProfile } = useProfileStore()
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const [scanReport, setScanReport] = useState<ScanItem[]>([])
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [isScanModalOpen, setScanModalOpen] = useState(false)
  const [currentFilePath, setCurrentFilePath] = useState<string>('')
  const [excludedStyles, setExcludedStyles] = useState<string[]>([])
  const [textReplacements, setTextReplacements] = useState<Record<string, string>>({})
  const [enableAutoNumbering, setEnableAutoNumbering] = useState<boolean>(true)
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [isBatchModalOpen, setBatchModalOpen] = useState(false)
  const [batchTargetStyle, setBatchTargetStyle] = useState<string>('heading2')
  // 批量纠偏：被排除的段落索引集合（不参与本次批量应用）
  const [batchExcludedIndices, setBatchExcludedIndices] = useState<Set<number>>(new Set())
  // 目标规范筛选：排除已设置为特定目标规范的段落
  const [excludedTargetStyles, setExcludedTargetStyles] = useState<string[]>([])

  // 版本更新相关状态
  const [updateInfo, setUpdateInfo] = useState<{ version: string, downloaded: boolean } | null>(null)

  // 监听版本更新
  useState(() => {
    const api = (window as any).electronAPI
    if (api) {
      api.onUpdateAvailable((info: any) => {
        setUpdateInfo({ version: info.version, downloaded: false })
      })
      api.onUpdateDownloaded((info: any) => {
        setUpdateInfo({ version: info.version, downloaded: true })
      })
    }
  })

  // 手动编号清洗相关状态
  const [isCleanDrawerOpen, setCleanDrawerOpen] = useState(false)
  const [cleaningSelections, setCleaningSelections] = useState<Record<number, boolean>>({})
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  // 保持原有滚动行为（不锁定 body，不动态计算表格高度）
  // 计算检测到的手动编号数量（动态：仅统计cleaningSelections中存在的项）
  const detectedNumberingCount = scanReport.filter(item =>
    item.manual_numbering && cleaningSelections[item.index] !== undefined
  ).length

  // 打开手动编号清洗抽屉
  const handleOpenCleanDrawer = () => {
    setCleanDrawerOpen(true)
    setCollapsedGroups({})  // 重置折叠状态
  }

  // 确认清洗：将被勾选的项应用到 textReplacements，并从 cleaningSelections 中移除
  const handleConfirmCleaning = () => {
    const newReplacements: Record<string, string> = { ...textReplacements }
    const newSelections: Record<number, boolean> = { ...cleaningSelections }
    let cleanedCount = 0
    Object.entries(cleaningSelections).forEach(([indexStr, shouldClean]) => {
      if (shouldClean) {
        const item = scanReport.find(i => i.index === Number(indexStr))
        if (item && item.manual_numbering) {
          newReplacements[indexStr] = item.manual_numbering.clean_text
          delete newSelections[Number(indexStr)]  // 移除已清洗项
          cleanedCount++
        }
      }
    })
    setTextReplacements(newReplacements)
    setCleaningSelections(newSelections)
    setCleanDrawerOpen(false)
    Message.success(`已清洗 ${cleanedCount} 个手动编号`)
  }

  // 切换单个项的清洗状态
  const toggleCleaningSelection = (index: number) => {
    setCleaningSelections(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }

  // --- 逻辑：智能扫描 ---
  const handleScan = async (file: File | undefined) => {
    if (!file) return
    const filePath = (file as any).path || ''
    if (!filePath) { Message.error('无法获取文件路径'); return }

    setCurrentFilePath(filePath)

    // --- 核心修复：重置所有与上一个文件相关的状态 ---
    setScanReport([])
    setMappings({})
    setTextReplacements({})
    setCleaningSelections({})
    setExcludedStyles([])
    setExcludedTargetStyles([])
    setSearchKeyword('')
    setBatchExcludedIndices(new Set())

    setIsScanning(true)

    try {
      const api = (window as any).electronAPI
      if (!api) throw new Error('API 未注入')

      // 模拟进度条体感
      await new Promise(r => setTimeout(r, 800))
      const report = await api.scanHeadings(filePath, 16)

      if (report && report.success && report.structure && report.structure.length > 0) {
        const initialMappings: Record<string, string> = {}
        const normalizeSuggested = (rawKey: string | undefined, rawStyle: string | undefined): string => {
          const allowed = new Set(['title', 'heading1', 'heading2', 'heading3', 'heading4', 'normal'])
          let key = rawKey || ''
          if (key === 'documentTitle') key = 'title'
          if (key === 'body') key = 'normal'
          if (allowed.has(key)) return key
          const style = String(rawStyle || '')
          if (isTitleStyle(style)) return 'title'
          const lvl = getHeadingLevel(style)
          if (lvl >= 1 && lvl <= 4) return `heading${lvl}`
          return 'normal'
        }

        report.structure.forEach((item: ScanItem) => {
          const frontendStyleKey = normalizeSuggested((item as any).suggested_key, item.style)
          initialMappings[String(item.index)] = frontendStyleKey
        })
        setScanReport(report.structure)
        setMappings(initialMappings)

        // 初始化手动编号清洗状态（默认全选）
        const initialCleanSelections: Record<number, boolean> = {}
        report.structure.forEach((item: ScanItem) => {
          if (item.manual_numbering) {
            initialCleanSelections[item.index] = true  // 默认勾选（将被清洗）
          }
        })
        setCleaningSelections(initialCleanSelections)

        // 清空筛选条件，默认显示所有段落
        setExcludedStyles([])
        setExcludedTargetStyles([])
        setIsScanning(false)
        setScanModalOpen(true)
      } else {
        setIsScanning(false)
        Message.success({ content: '文档结构良好，直接开始格式化...', icon: <IconCheckCircle /> })
        handleConfirmFormat({})
      }
    } catch (error: any) {
      setIsScanning(false)
      Message.error('扫描失败: ' + error.message)
    }
  }

  // --- 逻辑：确认格式化 ---
  const handleConfirmFormat = async (finalMappings = mappings) => {
    setScanModalOpen(false)
    const profile = profiles.find((p) => p.id === selectedProfileId)
    if (!profile) { Message.error('请先选择格式规范'); return }

    const hideLoading = Message.loading({ content: '正在排版...', duration: 0 })
    try {
      const api = (window as any).electronAPI
      // 规范化映射键：将 UI 中的 'title'/'normal' 转为 后端使用的 'documentTitle'/'body'
      const normalizedMappings = Object.fromEntries(
        Object.entries(finalMappings || {}).map(([k, v]) => [k, v === 'title' ? 'documentTitle' : (v === 'normal' ? 'body' : v)])
      )
      const payload = { profile, mappings: normalizedMappings, text_replacements: textReplacements, enable_auto_numbering: enableAutoNumbering }
      const result = await api.formatDocument(currentFilePath, payload)
      if (typeof hideLoading === 'function') { try { hideLoading() } catch { } } else { Message.clear() }
      if (result.success) {
        Message.success('格式化成功！')
        if (result.outputPath) api.showInFolder(result.outputPath)
      } else { Message.error(result.message) }
    } catch (error: any) {
      if (typeof hideLoading === 'function') { try { hideLoading() } catch { } } else { Message.clear() }
      Message.error(error.message)
    }
  }

  // --- 视图 A: 工作台 ---
  const renderWorkbench = () => (
    <div className="w-full max-w-5xl animate-fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">开始新的格式化任务</h2>
        <p className="text-gray-500">AI 智能识别文档结构，一键应用标准公文格式</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 左侧配置 */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xs">1</span>
              <span className="font-bold text-gray-700">选择目标规范</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">选择适用于本文档的格式标准，将自动应用字体、行距及版式。</p>
            <Select placeholder="请选择..." value={selectedProfileId || undefined} onChange={selectProfile} size="large" className="w-full">
              {profiles.map(p => <Select.Option key={p.id} value={p.id}>{p.name} {p.isDefault && '(默认)'}</Select.Option>)}
            </Select>
            {/* 已移除“管理我的规范库”入口，避免与右上角标签重复 */}
          </div>
        </div>
        {/* 右侧上传 */}
        <div className="lg:col-span-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">2</span>
              <span className="font-bold text-gray-700">上传文档</span>
            </div>
            <Upload drag multiple={false} autoUpload={false} showUploadList={false} onChange={(_, file) => handleScan(file.originFile)} accept=".docx">
              <div className="h-64 w-full bg-gray-50 border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-400 transition-all cursor-pointer group">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                  <IconUpload style={{ fontSize: 32, color: '#165DFF' }} />
                </div>
                <p className="text-lg font-medium text-gray-800">点击或拖拽文件到此处</p>
                <p className="text-gray-400 mt-1 text-sm">支持 .docx 格式</p>
              </div>
            </Upload>
          </div>
        </div>
      </div>
    </div>
  )

  // 计算：唯一样式与过滤结果
  const uniqueStyles = Array.from(new Set(scanReport.map(s => s.style).filter(Boolean)))

  // 新规则：仅识别标题/文档标题，其余全部归为正文
  const isTitleStyle = (raw: string = ''): boolean => {
    const s = String(raw || '').trim()
    const lower = s.toLowerCase()
    return lower === 'title' || lower === 'document title' || s === '标题'
  }
  const getHeadingLevel = (raw: string = ''): number => {
    const s = String(raw || '').trim()
    const lower = s.toLowerCase()
    const m1 = lower.match(/heading\s*(\d+)/)
    if (m1) return parseInt(m1[1], 10)
    const m2 = s.match(/标题\s*(\d+)/)
    if (m2) return parseInt(m2[1], 10)
    return 0
  }
  const isHeadingStyle = (raw: string = ''): boolean => getHeadingLevel(raw) > 0
  const isBodyStyle = (raw: string = ''): boolean => !(isTitleStyle(raw) || isHeadingStyle(raw))
  const normalizeOriginStyle = (raw: string = ''): string => (isBodyStyle(raw) ? '正文' : raw)

  // 优化过滤逻辑：
  // 排除样式基于原始Word样式名称进行精确匹配
  // 这样可以独立过滤 Normal、List Paragraph、Body Text 等不同的正文类样式
  const filteredScanReport = scanReport.filter(item => {
    // 判断是否被原样式排除：
    // 直接检查该段落的原始样式名称是否在排除列表中
    const isExcludedByOriginStyle = excludedStyles.includes(item.style)

    // 判断是否被目标规范排除：
    // 检查该段落当前映射的目标样式是否在目标规范排除列表中
    const currentTargetStyle = mappings[String(item.index)] || item.suggested_key
    const isExcludedByTargetStyle = excludedTargetStyles.includes(currentTargetStyle)

    // 关键字搜索过滤
    const matchesSearch = !searchKeyword || item.text.toLowerCase().includes(searchKeyword.toLowerCase())

    return !isExcludedByOriginStyle && !isExcludedByTargetStyle && matchesSearch
  })

  // --- 主渲染 ---
  return (
    <div className="min-h-screen bg-[#f7f8fa] font-sans pb-10">
      {/* 顶部导航 */}
      <div className="fixed top-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm"><IconFile style={{ color: 'white', fontSize: 20 }} /></div>
          <span className="text-lg font-bold text-gray-800">公文格式化助手</span>
        </div>
        <div className="flex items-center gap-4">
          {updateInfo && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all animate-pulse ${updateInfo.downloaded ? 'bg-green-50 border-green-200 text-green-700 cursor-pointer hover:bg-green-100' : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
              onClick={() => {
                if (updateInfo.downloaded) {
                  (window as any).electronAPI.quitAndInstall()
                }
              }}
              title={updateInfo.downloaded ? `新版本 ${updateInfo.version} 已准备就绪，点击重启安装` : `正在下载新版本 ${updateInfo.version}...`}
            >
              <div className={`w-2 h-2 rounded-full ${updateInfo.downloaded ? 'bg-green-500' : 'bg-blue-500'}`}></div>
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Update {updateInfo.downloaded ? 'Ready' : 'Available'}
              </span>
            </div>
          )}

          <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/50">
            <button className="flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-white text-blue-600 shadow-sm font-bold">
              <IconApps className="mr-2" /> 工作台
            </button>
            <button onClick={() => navigate('/profiles')} className="flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all text-gray-500 hover:text-gray-700">
              <IconSettings className="mr-2" /> 规范管理
            </button>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="pt-24 px-6 flex flex-col items-center">
        {isScanning ? (
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-50/30 animate-pulse"></div>
            <Spin dot size={50} />
            <h3 className="text-2xl font-bold text-gray-800 mt-8 relative z-10">AI 智能扫描中...</h3>
          </div>
        ) : renderWorkbench()}
      </div>

      {/* 纠偏模态框 (Table Render 必须强制样式) */}
      <Modal
        title={<div className="flex items-center gap-2 font-bold text-gray-800"><IconExclamationCircle style={{ color: '#165DFF' }} /> 结构纠偏确认</div>}
        visible={isScanModalOpen}
        onCancel={() => { setScanModalOpen(false); setIsScanning(false) }}
        onOk={() => handleConfirmFormat()}
        okText="确认并开始格式化"
        cancelText="取消"
        style={{ width: 1200 }}
        maskClosable={false}
      >
        {/* 左右布局容器 */}
        <div className="flex gap-4" style={{ height: '68vh' }}>
          {/* 左侧边栏：搜索/筛选/自动编号 */}
          <div className="flex-shrink-0 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50/30 p-3 rounded-lg" style={{ width: 300, scrollbarWidth: 'thin' }}>
            <div className="space-y-3">
              {/* 搜索框 */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-700">搜索</span>
                  {searchKeyword && (
                    <Button size="mini" type="text" onClick={() => setSearchKeyword('')}>
                      清空
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="输入关键字筛选..."
                  value={searchKeyword}
                  onChange={setSearchKeyword}
                  allowClear
                  size="small"
                />
              </div>

              {/* 批量纠偏按钮 */}
              <Button
                type="primary"
                long
                disabled={filteredScanReport.length === 0}
                onClick={() => { setBatchExcludedIndices(new Set()); setBatchModalOpen(true) }}
              >
                批量纠偏
              </Button>

              {/* 排除原样式 */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-700">排除原样式</span>
                  {excludedStyles.length > 0 && (
                    <Button size="mini" type="text" onClick={() => setExcludedStyles([])}>
                      清除排除
                    </Button>
                  )}
                </div>
                {/* 独立的“正文”组合复选框：不放入 Checkbox.Group，避免被 Group 覆盖 checked 逻辑 */}
                {(() => {
                  const allBodyStyles = uniqueStyles.filter(s => isBodyStyle(s))
                  const bodyCount = scanReport.filter(i => isBodyStyle(i.style)).length
                  const isBodyExcludedAny = allBodyStyles.some(s => excludedStyles.includes(s))
                  const isBodyExcludedAll = allBodyStyles.length > 0 && allBodyStyles.every(s => excludedStyles.includes(s))
                  const isBodyPartial = isBodyExcludedAny && !isBodyExcludedAll
                  const toggleBody = (checked: boolean) => {
                    if (checked) {
                      // 排除全部正文类样式
                      const merged = Array.from(new Set([...excludedStyles, ...allBodyStyles]))
                      setExcludedStyles(merged)
                    } else {
                      // 恢复：移除所有正文类样式
                      setExcludedStyles(excludedStyles.filter(s => !isBodyStyle(s)))
                    }
                  }
                  return (
                    <div className="mb-1">
                      <Checkbox checked={isBodyExcludedAny} indeterminate={isBodyPartial} onChange={toggleBody}>
                        <span className="text-xs whitespace-nowrap">正文 <span className="text-gray-400">({bodyCount})</span></span>
                      </Checkbox>
                    </div>
                  )
                })()}
                {(() => {
                  const nonBodyStyles = uniqueStyles.filter(style => !isBodyStyle(style))
                  if (nonBodyStyles.length === 0) return null
                  return (
                    <Checkbox.Group
                      value={excludedStyles.filter(s => !isBodyStyle(s))}
                      onChange={(values) => {
                        const nonBody = values as string[]
                        const bodyPart = excludedStyles.filter(s => isBodyStyle(s))
                        setExcludedStyles([...new Set([...bodyPart, ...nonBody])])
                      }}
                      style={{ width: '100%' }}
                    >
                      <div className="flex flex-wrap gap-2">
                        {nonBodyStyles.map(style => {
                          const count = scanReport.filter(i => i.style === style).length
                          return (
                            <Checkbox key={style} value={style}>
                              <span className="text-xs whitespace-nowrap">{normalizeOriginStyle(style)} <span className="text-gray-400">({count})</span></span>
                            </Checkbox>
                          )
                        })}
                      </div>
                    </Checkbox.Group>
                  )
                })()}
              </div>

              {/* 排除目标规范 */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-700">排除目标规范</span>
                  {excludedTargetStyles.length > 0 && (
                    <Button size="mini" type="text" onClick={() => setExcludedTargetStyles([])}>
                      清除排除
                    </Button>
                  )}
                </div>
                <Checkbox.Group
                  value={excludedTargetStyles}
                  onChange={(values) => setExcludedTargetStyles(values as string[])}
                  style={{ width: '100%' }}
                >
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const targetStyleCounts: Record<string, number> = {}
                      scanReport.forEach(item => {
                        const target = mappings[String(item.index)] || item.suggested_key
                        targetStyleCounts[target] = (targetStyleCounts[target] || 0) + 1
                      })
                      const targetStyleOptions = [
                        { key: 'title', label: '文档标题' },
                        { key: 'heading1', label: '一级标题' },
                        { key: 'heading2', label: '二级标题' },
                        { key: 'heading3', label: '三级标题' },
                        { key: 'heading4', label: '四级标题' },
                        { key: 'normal', label: '正文' }
                      ]
                      return targetStyleOptions
                        .filter(opt => targetStyleCounts[opt.key] > 0)
                        .map(opt => (
                          <Checkbox key={opt.key} value={opt.key}>
                            <span className="text-xs whitespace-nowrap">{opt.label} <span className="text-gray-400">({targetStyleCounts[opt.key]})</span></span>
                          </Checkbox>
                        ))
                    })()}
                  </div>
                </Checkbox.Group>
              </div>

              {/* 自动编号开关 */}
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-700">自动编号</span>
                  <Switch
                    size="small"
                    checked={enableAutoNumbering}
                    onChange={setEnableAutoNumbering}
                  />
                </div>
                {/* Alert 提示 */}
                {enableAutoNumbering && detectedNumberingCount > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-2.5 mt-2">
                    <div className="flex items-start gap-2">
                      <svg className="w-3.5 h-3.5 text-orange-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-orange-800 leading-relaxed mb-2">
                          检测到 <strong>{detectedNumberingCount}</strong> 个手动编号，建议清除。
                        </p>
                        <Button
                          size="mini"
                          onClick={handleOpenCleanDrawer}
                          long
                          style={{
                            backgroundColor: 'white',
                            borderColor: '#fed7aa',
                            color: '#c2410c',
                            fontSize: 11,
                            height: 26
                          }}
                        >
                          清洗编号
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧表格区域 */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white p-3 rounded-lg border border-gray-100">
            {/* 顶部信息栏 */}
            <Alert
              type="info"
              showIcon
              content={`共扫描到 ${scanReport.length} 个段落，当前显示 ${filteredScanReport.length} 个（已过滤 ${scanReport.length - filteredScanReport.length} 个）。`}
              className="mb-3"
            />

            {/* 表格 */}
            <div className="flex-1 overflow-hidden">
              <Table
                columns={[
                  {
                    title: '预览 (即时效果)',
                    dataIndex: 'text',
                    key: 'preview',
                    width: 360,
                    render: (text, record) => {
                      const k = mappings[String(record.index)] || record.suggested_key
                      const s: any = { transition: 'all 0.3s' }
                      if (k === 'title') { s.fontSize = '24px'; s.fontWeight = 800; s.color = '#000'; s.textAlign = 'center'; }
                      else if (k === 'heading1') { s.fontSize = '20px'; s.fontWeight = 700; s.color = '#1f2937'; }
                      else if (k === 'heading2') { s.fontSize = '18px'; s.fontWeight = 700; s.color = '#374151'; }
                      else if (k === 'heading3') { s.fontSize = '16px'; s.fontWeight = 700; s.color = '#4b5563'; }
                      else if (k === 'heading4') { s.fontSize = '14px'; s.fontWeight = 600; s.color = '#6b7280'; }
                      else if (k === 'normal') { s.fontSize = '14px'; s.color = '#111827'; }
                      const mapKey = k === 'title' ? 'documentTitle' : (k === 'normal' ? 'body' : k)
                      const profile = profiles.find(p => p.id === selectedProfileId)
                      const cfg: any = (profile as any)?.styles?.[mapKey as any] || {}
                      const labelMap: Record<string, string> = { documentTitle: '文档标题', heading1: '一级标题', heading2: '二级标题', heading3: '三级标题', heading4: '四级标题', body: '正文' }
                      const label = labelMap[mapKey] || mapKey
                      const desc = `将应用：${label}｜字体 ${cfg.fontFamily || '-'}｜字号 ${cfg.fontSize ? `${cfg.fontSize}pt` : '-'}｜行距 ${cfg.lineSpacing ? `${cfg.lineSpacing}磅` : '-'}`

                      const displayText = textReplacements[String(record.index)] !== undefined ? textReplacements[String(record.index)] : (text || '')

                      return (
                        <div>
                          <Input
                            style={{
                              ...s,
                              fontFamily: cfg.fontFamily || 'inherit',
                              height: 'auto',
                              padding: '8px 12px',
                              width: '100%',
                              backgroundColor: '#f7f8fa',
                              border: '1px solid #e5e6eb',
                              borderRadius: '4px',
                            }}
                            value={displayText}
                            onChange={(val) => setTextReplacements(prev => ({ ...prev, [String(record.index)]: val }))}
                            placeholder="点击此处编辑文本..."
                            onFocus={(e) => { (e.target as HTMLInputElement).style.backgroundColor = '#ffffff'; (e.target as HTMLInputElement).style.borderColor = '#165DFF'; }}
                            onBlur={(e) => { (e.target as HTMLInputElement).style.backgroundColor = '#f7f8fa'; (e.target as HTMLInputElement).style.borderColor = '#e5e6eb'; }}
                          />
                          <div className="text-xs text-gray-400 mt-1">{desc}</div>
                        </div>
                      )
                    }
                  },
                  {
                    title: '字数',
                    dataIndex: 'text',
                    key: 'wordCount',
                    width: 80,
                    render: (t: string) => <span className="text-sm text-gray-600">{t?.length || 0}</span>
                  },
                  {
                    title: '原样式', dataIndex: 'style', width: 140,
                    render: (s: string) => {
                      const text = normalizeOriginStyle(s)
                      const lower = String(s || '').toLowerCase()
                      const isHeading = s?.includes('标题') || lower.includes('heading')
                      const isNormal = text === '正文' || lower === 'normal'
                      const color = isHeading ? 'green' : (isNormal ? 'orange' : 'arcoblue')
                      return <Tag color={color}>{text}</Tag>
                    }
                  },
                  {
                    title: '目标规范',
                    dataIndex: 'operation', width: 220,
                    render: (_, r) => (
                      <Select value={mappings[String(r.index)] || r.suggested_key} onChange={v => setMappings(p => ({ ...p, [String(r.index)]: v }))}>
                        <Select.Option value="title">文档标题</Select.Option>
                        <Select.Option value="heading1">一级标题</Select.Option>
                        <Select.Option value="heading2">二级标题</Select.Option>
                        <Select.Option value="heading3">三级标题</Select.Option>
                        <Select.Option value="heading4">四级标题</Select.Option>
                        <Select.Option value="normal">正文</Select.Option>
                      </Select>
                    )
                  }
                ]}
                data={filteredScanReport}
                pagination={false}
                scroll={{ y: 'calc(68vh - 100px)' }}
                rowKey="index"
                hover
                border={false}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* 抽屉遮罩层：仅当抽屉打开时显示，点击关闭抽屉 */}
      {isCleanDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[9998]"
          onClick={() => setCleanDrawerOpen(false)}
        />
      )}

      {/* 手动编号清洗抽屉 */}
      <div
        className={`fixed top-0 right-0 w-[420px] h-full bg-white shadow-xl border-l border-gray-200 z-[9999] flex flex-col transition-transform duration-300 ease-in-out ${isCleanDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-sm">手动编号清洗</h3>
          </div>
          <button
            onClick={() => setCleanDrawerOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 规则说明区 */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] text-gray-500 mb-2 font-medium uppercase tracking-wider">当前识别逻辑</p>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const typeConfigs = [
                { type: 'arabic', label: '数字+点', color: 'indigo', dotColor: 'bg-indigo-500' },
                { type: 'chinese', label: '中文顿号', color: 'purple', dotColor: 'bg-purple-500' },
                { type: 'parenthesis', label: '括号包裹', color: 'emerald', dotColor: 'bg-emerald-500' }
              ]
              return typeConfigs
                .filter(cfg => scanReport.some(item => item.manual_numbering?.type === cfg.type && cleaningSelections[item.index] !== undefined))
                .map(cfg => (
                  <span
                    key={cfg.type}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded border border-${cfg.color}-100 bg-${cfg.color}-50 text-[10px] text-${cfg.color}-600`}
                    style={{
                      borderColor: cfg.color === 'indigo' ? '#e0e7ff' : cfg.color === 'purple' ? '#f3e8ff' : '#d1fae5',
                      backgroundColor: cfg.color === 'indigo' ? '#eef2ff' : cfg.color === 'purple' ? '#faf5ff' : '#ecfdf5',
                      color: cfg.color === 'indigo' ? '#4f46e5' : cfg.color === 'purple' ? '#7c3aed' : '#059669'
                    }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`}></span>
                    {cfg.label}
                  </span>
                ))
            })()}
          </div>
        </div>

        {/* Body - 卡片式分组 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 200px)', scrollbarWidth: 'thin' }}>
          {[
            { type: 'arabic', label: '数字 + 点/空格', headerBg: 'bg-indigo-50/50', headerBorder: 'border-indigo-100', headerText: 'text-indigo-700' },
            { type: 'chinese', label: '中文数字 + 顿号', headerBg: 'bg-purple-50/50', headerBorder: 'border-purple-100', headerText: 'text-purple-700' },
            { type: 'parenthesis', label: '括号编号', headerBg: 'bg-emerald-50/50', headerBorder: 'border-emerald-100', headerText: 'text-emerald-700' }
          ].map(({ type, label, headerBg, headerBorder, headerText }) => {
            const items = scanReport.filter(item => item.manual_numbering?.type === type && cleaningSelections[item.index] !== undefined)
            if (items.length === 0) return null

            const allSelected = items.every(item => cleaningSelections[item.index])
            const isCollapsed = collapsedGroups[type]

            return (
              <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Group Header */}
                <div className={`${headerBg} px-3 py-2 border-b ${headerBorder} flex justify-between items-center`}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCollapsedGroups(prev => ({ ...prev, [type]: !prev[type] }))}
                      className="text-gray-500 hover:text-gray-700 transition-transform"
                      style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <span className={`text-xs font-bold ${headerText}`}>{label}</span>
                  </div>
                  <a
                    className="text-[10px] text-blue-600 cursor-pointer hover:underline"
                    onClick={() => {
                      const newSelections = { ...cleaningSelections }
                      items.forEach(item => {
                        newSelections[item.index] = !allSelected
                      })
                      setCleaningSelections(newSelections)
                    }}
                  >
                    {allSelected ? '取消全选' : '全选'}
                  </a>
                </div>

                {/* Group Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-gray-50">
                    {items.map(item => {
                      const isChecked = cleaningSelections[item.index]
                      return (
                        <div
                          key={item.index}
                          className={`group flex items-center gap-3 p-2 rounded-lg transition-colors cursor-default border ${isChecked
                            ? 'hover:bg-blue-50/50 hover:border-blue-100 border-transparent'
                            : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                          {/* 左侧对勾图标（仅选中时显示） */}
                          {isChecked ? (
                            <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 flex-shrink-0"></div>
                          )}

                          {/* 文本内容 */}
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm truncate font-medium ${isChecked
                              ? 'text-gray-700'
                              : 'text-gray-400 line-through'
                              }`}>
                              <span className="font-mono mr-1">{item.manual_numbering?.match}</span>
                              {item.manual_numbering?.clean_text}
                            </div>
                          </div>

                          {/* 右侧排除/撤销按钮 */}
                          <button
                            className={`px-2 py-1 text-xs rounded border transition-all shadow-sm ${isChecked
                              ? 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-[#165DFF] hover:bg-white border-transparent hover:border-blue-200'
                              : 'text-gray-500 bg-white border-gray-300 hover:text-[#165DFF] hover:border-blue-300'
                              }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCleaningSelection(item.index)
                            }}
                          >
                            {isChecked ? '排除' : '撤销排除'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={() => setCleanDrawerOpen(false)}
            className="flex-1 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirmCleaning}
            className="flex-[2] py-2 bg-[#165DFF] hover:bg-blue-700 text-white rounded text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            确认清洗 ({Object.values(cleaningSelections).filter(Boolean).length})
          </button>
        </div>
      </div>


      {/* 批量纠偏模态框 */}
      <Modal
        title={null}
        visible={isBatchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        footer={null}
        style={{ width: 700, top: 60 }}
        className="batch-correction-modal"
      >
        <div className="space-y-4">
          {/* 智能聚合卡片 */}
          <div className="bg-white rounded-xl border border-blue-200 shadow-[0_4px_20px_-4px_rgba(22,93,255,0.15)] overflow-hidden transition-all ring-4 ring-blue-50/50">
            {/* 卡片头部：AI 总控区 */}
            <div className="bg-gradient-to-r from-blue-50/80 via-white to-white p-4 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* AI 图标容器 */}
                <div className="w-10 h-10 rounded-lg bg-white border border-blue-100 flex items-center justify-center shadow-sm text-[#165DFF]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    包含 "{searchKeyword}" 的段落
                    <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-normal border border-gray-200">
                      {filteredScanReport.length}个
                    </span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">AI 识别为同一层级，建议统一设置</p>
                </div>
              </div>

              {/* 统一设置控件 */}
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">统一设为</span>
                <div className="h-4 w-px bg-gray-200"></div>
                <Select
                  value={batchTargetStyle}
                  onChange={setBatchTargetStyle}
                  size="small"
                  style={{ width: 120, fontWeight: 'bold', color: '#165DFF' }}
                  bordered={false}
                >
                  <Select.Option value="heading1">一级标题</Select.Option>
                  <Select.Option value="heading2">二级标题</Select.Option>
                  <Select.Option value="heading3">三级标题</Select.Option>
                  <Select.Option value="heading4">四级标题</Select.Option>
                  <Select.Option value="normal">正文</Select.Option>
                </Select>
              </div>
            </div>

            {/* 卡片身体：折叠列表 */}
            <div className="bg-white">
              {/* 列表头 */}
              <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">预览明细</span>
              </div>

              {/* 滚动列表区 */}
              <div className="max-h-[320px] overflow-y-auto p-2 space-y-1" style={{ scrollbarWidth: 'thin' }}>
                {filteredScanReport.map((item) => {
                  const excluded = batchExcludedIndices.has(item.index)
                  return (
                    <div key={item.index} className={`group flex items-center gap-3 p-2 rounded-lg transition-colors cursor-default border ${excluded ? 'bg-gray-50 border-gray-200' : 'hover:bg-blue-50/50 hover:border-blue-100 border-transparent'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${excluded ? 'bg-gray-100' : 'bg-green-50'}`}>
                        {!excluded && (
                          <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm truncate font-medium ${excluded ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.text}</div>
                      </div>
                      {/* 操作：切换排除/撤销排除 */}
                      <button
                        className={`px-2 py-1 text-xs rounded border transition-all shadow-sm ${excluded
                          ? 'text-gray-500 bg-white border-gray-300 hover:text-[#165DFF] hover:border-blue-300'
                          : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:text-[#165DFF] hover:bg-white border-transparent hover:border-blue-200'}`}
                        onClick={() => {
                          setBatchExcludedIndices(prev => {
                            const s = new Set(prev);
                            if (s.has(item.index)) s.delete(item.index); else s.add(item.index);
                            return s
                          })
                        }}
                      >
                        {excluded ? '撤销排除' : '排除'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-end gap-3">
              <Button onClick={() => setBatchModalOpen(false)}>取消</Button>
              <Button
                type="primary"
                onClick={() => {
                  // 批量应用设置（排除用户标记的段落）
                  const newMappings = { ...mappings }
                  const appliedItems = filteredScanReport.filter(item => !batchExcludedIndices.has(item.index))
                  appliedItems.forEach(item => {
                    newMappings[String(item.index)] = batchTargetStyle
                  })
                  setMappings(newMappings)
                  setBatchModalOpen(false)
                  const total = filteredScanReport.length
                  const applied = appliedItems.length
                  const excluded = total - applied
                  Message.success(`已将 ${applied} 个段落设置为 ${batchTargetStyle}${excluded > 0 ? `（已排除 ${excluded} 个）` : ''}`)
                }}
              >
                应用批量设置
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
