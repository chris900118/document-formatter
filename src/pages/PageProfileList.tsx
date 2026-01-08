import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/store/profileStore'
import { StyleConfig } from '@/types/profile'
import { getFontSizeDisplay } from '@/utils/fontUtils'
import {
  Plus, Search, LayoutGrid, MoreHorizontal,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ToggleRight, Trash2, Edit
} from 'lucide-react'
import { Modal, Message, Dropdown, Menu, Tooltip } from '@arco-design/web-react'
import { AppHeader } from '@/components/AppHeader'

export function PageProfileList() {
  const navigate = useNavigate()
  const { profiles, deleteProfile } = useProfileStore()
  const [searchTerm, setSearchTerm] = useState('')

  const handleEdit = (id: string) => {
    navigate(`/profiles/edit/${id}`)
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个规范吗？此操作不可恢复。',
      okButtonProps: { status: 'danger' },
      onOk: () => {
        deleteProfile(id)
        Message.success('删除成功')
      },
    })
  }

  const handleCreate = () => {
    navigate('/profiles/new')
  }

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 辅助函数：获取对齐图标
  const getAlignIcon = (align?: string) => {
    switch (align) {
      case 'center': return <AlignCenter className="w-3 h-3 text-gray-400" />
      case 'right': return <AlignRight className="w-3 h-3 text-gray-400" />
      case 'justify': return <AlignJustify className="w-3 h-3 text-gray-400" />
      default: return <AlignLeft className="w-3 h-3 text-gray-400" />
    }
  }

  // 辅助函数：渲染微缩矩阵行
  const renderPreviewRow = (label: string, style: StyleConfig) => {
    const alignMap: Record<string, string> = { left: '左对齐', center: '居中', right: '右对齐', justify: '两端对齐' }
    const alignText = alignMap[style.alignment || 'left'] || '左对齐'

    // 使用更紧凑的 Grid 定义：减小间距(gap-1)，压缩固定列宽，为字体名称留出空间
    return (
      <div className="grid grid-cols-[52px_minmax(40px,1fr)_44px_36px_24px_28px_24px] gap-1 items-center py-1.5 border-b border-gray-100 last:border-0 text-xs">
        {/* 1. 标题 */}
        <span className="text-gray-500 truncate">{label}</span>

        {/* 2. 字体 */}
        <div className="font-medium text-gray-900 truncate" title={style.fontFamily}>
          {style.fontFamily}
        </div>

        {/* 3. 字号 */}
        <div className="text-gray-600 font-mono text-[11px] text-center bg-gray-100 rounded px-0.5 truncate">
          {getFontSizeDisplay(style.fontSize)}
        </div>

        {/* 4. 行距 */}
        <div className="flex items-center justify-center text-gray-400" title={`行距: ${style.lineSpacing || '默认'}磅`}>
          <span className="text-[10px] transform scale-90">{style.lineSpacing || '-'}</span>
        </div>

        {/* 5. 对齐 */}
        <div className="flex justify-center" title={alignText}>
          {getAlignIcon(style.alignment)}
        </div>

        {/* 6. 缩进 */}
        <div className="flex justify-center" title={`首行缩进: ${style.firstLineIndent || 0}字符`}>
          {style.firstLineIndent ? (
            <span className="text-[10px] text-gray-500">{style.firstLineIndent}</span>
          ) : <span className="text-gray-300">-</span>}
        </div>

        {/* 7. 自动编号 */}
        <div className="flex justify-end">
          {style.numbering?.enabled ? (
            <Tooltip content="已启用自动编号">
              <ToggleRight className="w-3.5 h-3.5 text-green-500 cursor-help" />
            </Tooltip>
          ) : (
            <span className="w-3.5 h-3.5" /> // 占位
          )}
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-10">
      <AppHeader />

      <div className="max-w-[1600px] mx-auto pt-24 px-6">

        {/* 顶部工具栏 */}
        <header className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">规范管理库</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索规范..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-md text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all w-64"
              />
            </div>

            {/* 新建按钮 */}
            <button
              onClick={handleCreate}
              className="h-9 px-4 bg-[#165DFF] hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> 新建规范
            </button>
          </div>
        </header>

        {/* 卡片网格 - 调整断点以保证卡片宽度足够容纳微缩矩阵 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className={`
                group relative bg-white border rounded-xl p-4 transition-all duration-200
                ${profile.isDefault ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-blue-400 hover:shadow-md'}
              `}
            >
              {/* 卡片头部 */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate max-w-[180px]" title={profile.name}>
                      {profile.name}
                    </h3>
                    {profile.isDefault && (
                      <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold">
                        默认
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1" title={profile.description}>
                    {profile.description || '暂无描述'}
                  </p>
                </div>

                {/* 操作菜单 */}
                <Dropdown
                  droplist={
                    <Menu>
                      <Menu.Item key="edit" onClick={() => handleEdit(profile.id)}>
                        <div className="flex items-center gap-2"><Edit className="w-3 h-3" /> 编辑</div>
                      </Menu.Item>
                      {!profile.isDefault && (
                        <Menu.Item key="delete" onClick={() => handleDelete(profile.id)}>
                          <div className="flex items-center gap-2 text-red-500"><Trash2 className="w-3 h-3" /> 删除</div>
                        </Menu.Item>
                      )}
                    </Menu>
                  }
                  trigger="click"
                  position="br"
                >
                  <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </Dropdown>
              </div>

              {/* 微缩矩阵 (Preview Box) */}
              <div className="bg-gray-50/80 rounded-lg border border-gray-100 p-2 space-y-0.5">
                {renderPreviewRow('文档标题', profile.styles.documentTitle)}
                {renderPreviewRow('正文', profile.styles.body)}
                {renderPreviewRow('一级标题', profile.styles.heading1)}
                {renderPreviewRow('二级标题', profile.styles.heading2)}
                {renderPreviewRow('三级标题', profile.styles.heading3)}
                {renderPreviewRow('四级标题', profile.styles.heading4)}
              </div>

              {/* 底部装饰条 (仅选中/Hover时显示) */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}

          {/* 空状态 */}
          {filteredProfiles.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>未找到匹配的规范</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

