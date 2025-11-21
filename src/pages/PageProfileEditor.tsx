import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Message } from '@arco-design/web-react'
import { getFontSizeDisplay, parseFontSizeInput } from '@/utils/fontUtils'
import { 
  ArrowLeft, 
  MousePointerClick, 
  Type, 
  Scaling, 
  ArrowUpDown, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  ListOrdered, 
  Pencil, 
  Bold, 
  CheckCircle2, 
  CircleDashed, 
  Settings2, 
  X, 
  Power,
  Indent 
} from 'lucide-react'
import { useProfileStore } from '@/store/profileStore'
import { FormatProfile, DEFAULT_PROFILE, NumberingConfig, StyleConfig } from '@/types/profile'

// --- Constants ---

const FONT_OPTIONS = [
  '方正小标宋简体',
  '方正仿宋_GBK',
  '方正仿宋',
  '方正黑体_GBK',
  '方正黑体',
  '方正楷体_GBK',
  '方正楷体',
  '宋体',
  '仿宋',
  '仿宋_GB2312',
  '楷体',
  '楷体_GB2312',
  '黑体',
  '微软雅黑',
  'Arial',
  'Times New Roman',
  'SimSun',
  'SimHei',
]

const STYLE_ITEMS_CONFIG = [
  { key: 'styles.documentTitle', label: '文档标题', showIndent: false, showNumbering: false },
  { key: 'styles.body', label: '正文', showIndent: true, showNumbering: false },
  { key: 'styles.heading1', label: '一级标题', showIndent: true, showNumbering: true },
  { key: 'styles.heading2', label: '二级标题', showIndent: true, showNumbering: true },
  { key: 'styles.heading3', label: '三级标题', showIndent: true, showNumbering: true },
  { key: 'styles.heading4', label: '四级标题', showIndent: true, showNumbering: true },
]

const DEFAULT_NUMBERING: NumberingConfig = {
  enabled: false,
  cascade: false,
  separator: '.',
  prefix: '',
  counterType: '1',
  suffix: '',
  previewText: '1.1'
}

// --- Hierarchy Definition ---
const STYLE_HIERARCHY: Record<string, string | null> = {
  'styles.heading1': null,
  'styles.heading2': 'styles.heading1',
  'styles.heading3': 'styles.heading2',
  'styles.heading4': 'styles.heading3',
}

// --- Helper Components ---

const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <span className="opacity-60">{children}</span>
)

// --- Main Component ---

export function PageProfileEditor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { profiles, addProfile, updateProfile } = useProfileStore()
  
  // State
  const [profile, setProfile] = useState<FormatProfile>(DEFAULT_PROFILE)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [activeDrawerStyleKey, setActiveDrawerStyleKey] = useState<string | null>(null)
  const [tempNumbering, setTempNumbering] = useState<NumberingConfig>(DEFAULT_NUMBERING)
  const [systemFonts, setSystemFonts] = useState<string[]>([])

  // Load Profile
  useEffect(() => {
    if (id) {
      const existing = profiles.find((p) => p.id === id)
      if (existing) {
        const loaded = JSON.parse(JSON.stringify(existing))
        // Migration: Ensure heading4 exists for old profiles
        if (!loaded.styles.heading4) {
          loaded.styles.heading4 = JSON.parse(JSON.stringify(DEFAULT_PROFILE.styles.heading4))
        }
        setProfile(loaded)
      }
    } else {
      setProfile(JSON.parse(JSON.stringify(DEFAULT_PROFILE)))
    }
  }, [id, profiles])

  // Load Fonts
  useEffect(() => {
    const loadSystemFonts = async () => {
      if (window.electronAPI && window.electronAPI.getFonts) {
        try {
          const result = await window.electronAPI.getFonts()
          if (result.success) {
            setSystemFonts(result.fonts)
          }
        } catch (error) {
          console.error('Error loading system fonts:', error)
        }
      }
    }
    loadSystemFonts()
  }, [])

  // --- Handlers ---

  const handleSave = () => {
    try {
      const profileData: FormatProfile = {
        ...profile,
        id: id || `custom_${Date.now()}`,
        updatedAt: new Date().toISOString(),
      }

      if (id) {
        updateProfile(id, profileData)
        Message.success('规范更新成功')
      } else {
        addProfile(profileData)
        Message.success('规范创建成功')
      }
      navigate('/profiles')
    } catch (error: any) {
      Message.error(error.message || '操作失败')
    }
  }

  const updateStyle = (key: string, field: string, value: any) => {
    // key is like 'styles.heading1'
    // We need to update profile.styles.heading1[field]
    const styleKey = key.split('.')[1]
    setProfile(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        [styleKey]: {
          ...prev.styles[styleKey as keyof typeof prev.styles],
          [field]: value
        }
      }
    }))
  }

  const getStyle = (key: string): StyleConfig => {
    const styleKey = key.split('.')[1]
    return profile.styles[styleKey as keyof typeof profile.styles] as StyleConfig
  }

  // --- Preview Calculation Logic ---

  // Get the "Cascade String" (e.g. "1.1") for a given style key
  // This string is used as the prefix for *children* of this style.
  // It always uses Arabic numerals (1) regardless of the display counter type.
  const getCascadeString = (key: string, currentProfile: FormatProfile, currentEditingKey: string | null, currentEditingConfig: NumberingConfig): string => {
    // 1. Get the config for this key
    let config: NumberingConfig | undefined
    
    if (key === currentEditingKey) {
      config = currentEditingConfig
    } else {
      const styleKey = key.split('.')[1]
      const style = currentProfile.styles[styleKey as keyof typeof currentProfile.styles] as StyleConfig
      // Safety check: if style is missing (e.g. old profile), treat as no numbering
      if (!style) return '1'
      config = style.numbering
    }

    // Default to "1" if no config or not enabled (though usually we only cascade from enabled parents)
    // But for the sake of preview, we assume "1"
    if (!config || !config.enabled) return '1'

    // Determine the value this level contributes to the cascade string
    let myVal = config.counterType || '1'
    
    // Special Rule: If Level 1 is Chinese ('一' or '壹'), convert to '1' and ignore prefix/suffix.
    // This ensures H2 inherits "1" instead of "第一章".
    if (key === 'styles.heading1' && (myVal === '一' || myVal === '壹')) {
      return '1'
    }
    
    const currentLevelString = `${config.prefix}${myVal}${config.suffix}`

    // 2. Check parent
    const parentKey = STYLE_HIERARCHY[key]
    if (config.cascade && parentKey) {
      const parentStr = getCascadeString(parentKey, currentProfile, currentEditingKey, currentEditingConfig)
      return `${parentStr}${config.separator}${currentLevelString}`
    }

    return currentLevelString
  }

  // Drawer Logic
  const openDrawer = (key: string) => {
    const style = getStyle(key)
    setTempNumbering(style.numbering || DEFAULT_NUMBERING)
    setActiveDrawerStyleKey(key)
    setDrawerVisible(true)
  }

  const saveDrawerConfig = () => {
    if (activeDrawerStyleKey) {
      // 1. Create a draft profile with the immediate change
      // Deep copy to avoid mutation issues during calculation
      const nextProfile = JSON.parse(JSON.stringify(profile)) as FormatProfile
      const activeStyleKey = activeDrawerStyleKey.split('.')[1]
      const activeStyle = nextProfile.styles[activeStyleKey as keyof typeof nextProfile.styles] as StyleConfig
      
      // Apply the current drawer state
      activeStyle.numbering = { ...tempNumbering }

      // 2. Recalculate previews for ALL headings (in order)
      // This ensures that if H1 changes, H2/H3/H4 previews are updated immediately
      const headingKeys = ['styles.heading1', 'styles.heading2', 'styles.heading3', 'styles.heading4']
      
      headingKeys.forEach(key => {
        const styleKey = key.split('.')[1]
        const style = nextProfile.styles[styleKey as keyof typeof nextProfile.styles] as StyleConfig
        
        // Safety check
        if (!style) return

        const config = style.numbering
        
        if (config && config.enabled) {
            const { cascade, separator, prefix, counterType, suffix } = config
            
            // Determine display value
            let val = counterType
            if (val === '1') val = '1'
            if (val === '一') val = '一'
            if (val === '①') val = '①'
            
            let res = `${prefix}${val}${suffix}`
            
            // Calculate cascade from parent
            const parentKey = STYLE_HIERARCHY[key]
            if (cascade && parentKey) {
                // We pass null for editingKey because we want to use the values in nextProfile
                // which contains the updates from previous iterations of this loop
                const parentStr = getCascadeString(parentKey, nextProfile, null, DEFAULT_NUMBERING) 
                res = `${parentStr}${separator}${res}`
            }
            
            // Update the preview text in the profile
            if (style.numbering) {
              style.numbering.previewText = res
            }
        }
      })

      // 3. Commit the final profile
      setProfile(nextProfile)
    }
    setDrawerVisible(false)
  }



  // Live Preview Effect
  useEffect(() => {
    if (drawerVisible && activeDrawerStyleKey) {
      const { cascade, separator, prefix, counterType, suffix } = tempNumbering
      
      // 1. Determine current level's display value
      let val = counterType
      if (val === '1') val = '1'
      if (val === '一') val = '一'
      if (val === '①') val = '①'
      
      let res = `${prefix}${val}${suffix}`

      // 2. If cascade is on, get parent's cascade string
      const parentKey = STYLE_HIERARCHY[activeDrawerStyleKey]
      if (cascade && parentKey) {
        const parentStr = getCascadeString(parentKey, profile, activeDrawerStyleKey, tempNumbering)
        res = `${parentStr}${separator}${res}`
      }

      setTempNumbering(prev => ({ ...prev, previewText: res }))
    }
  }, [
    tempNumbering.cascade, 
    tempNumbering.separator, 
    tempNumbering.prefix, 
    tempNumbering.counterType, 
    tempNumbering.suffix,
    drawerVisible,
    activeDrawerStyleKey,
    profile // Need profile to look up parents
  ])

  // --- Render Helpers ---

  const renderViewRow = (item: typeof STYLE_ITEMS_CONFIG[0]) => {
    const style = getStyle(item.key)
    const numbering = style.numbering || DEFAULT_NUMBERING
    
    const alignMap: Record<string, string> = { left: '左对齐', center: '居中', right: '右对齐', justify: '两端对齐' }
    const AlignIcon = {
      left: AlignLeft,
      center: AlignCenter,
      right: AlignRight,
      justify: AlignJustify
    }[style.alignment || 'left'] || AlignLeft

    return (
      <tr 
        key={item.key}
        className="hover:bg-gray-50 transition-colors cursor-pointer h-[72px] group" 
        onClick={() => setEditingId(item.key)}
      >
        <td className="pl-6 font-medium text-gray-900">{item.label}</td>
        <td className="px-2">
          <div className="capsule">
            <IconWrapper><Type size={14} /></IconWrapper>
            {style.fontFamily}
            {style.bold && <span className="font-bold ml-1 text-black">B</span>}
          </div>
        </td>
        <td className="px-2">
          <div className="capsule">
            <IconWrapper><Scaling size={14} /></IconWrapper>
            {style.fontSize}pt
          </div>
        </td>
        <td className="px-2">
          <div className="capsule">
            <IconWrapper><ArrowUpDown size={14} /></IconWrapper>
            {style.lineSpacing}
          </div>
        </td>
        <td className="px-2">
          <div className="capsule">
            <IconWrapper><AlignIcon size={14} /></IconWrapper>
            {alignMap[style.alignment || 'left']}
          </div>
        </td>
        <td className="px-2">
          {item.showIndent ? (
            typeof style.firstLineIndent === 'number' ? (
              <div className="capsule">
                <IconWrapper><Indent size={14} /></IconWrapper>
                {style.firstLineIndent} 字符
              </div>
            ) : (
              <span className="text-gray-300 text-xs ml-2">-</span>
            )
          ) : (
            <span className="text-gray-300 text-xs ml-2">-</span>
          )}
        </td>
        <td className="px-2">
          {item.showNumbering ? (
            numbering.enabled ? (
              <div className="capsule blue">
                <ListOrdered size={14} />
                {numbering.previewText}
              </div>
            ) : (
              <span className="text-gray-300 text-xs ml-2">-</span>
            )
          ) : (
            <span className="text-gray-300 text-xs ml-2">-</span>
          )}
        </td>
        <td className="pr-6 text-right">
          <button className="text-gray-400 hover:text-[#165DFF] p-2 rounded-full hover:bg-blue-50 transition-colors">
            <Pencil size={16} />
          </button>
        </td>
      </tr>
    )
  }

  const renderEditRow = (item: typeof STYLE_ITEMS_CONFIG[0]) => {
    const style = getStyle(item.key)
    const numbering = style.numbering || DEFAULT_NUMBERING
    const listId = `font-list-${item.key}`

    return (
      <tr key={item.key} className="bg-[#F0F6FF] relative z-10 h-[72px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]">
        <td className="pl-6 font-bold text-[#165DFF]">{item.label}</td>
        
        {/* Font */}
        <td className="px-2">
          <div className="flex gap-2">
            <input 
              list={listId} 
              className="input-base flex-1" 
              value={style.fontFamily} 
              placeholder="选择或输入字体"
              onChange={(e) => updateStyle(item.key, 'fontFamily', e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <datalist id={listId}>
              {[...FONT_OPTIONS, ...systemFonts].map((f, i) => <option key={i} value={f} />)}
            </datalist>
            <button 
              className={`w-8 h-8 border border-gray-300 rounded hover:bg-gray-50 flex items-center justify-center transition-colors ${style.bold ? 'text-[#165DFF] font-bold border-[#165DFF] bg-white' : 'bg-white'}`}
              onClick={(e) => {
                e.stopPropagation()
                updateStyle(item.key, 'bold', !style.bold)
              }}
            >
              <Bold size={16} />
            </button>
          </div>
        </td>
        
        {/* Size */}
        <td className="px-2">
          <input 
            type="text" 
            className="input-base text-center" 
            value={getFontSizeDisplay(style.fontSize)}
            onChange={(e) => {
              const val = parseFontSizeInput(e.target.value)
              if (val > 0) updateStyle(item.key, 'fontSize', val)
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </td>
        
        {/* Line Height */}
        <td className="px-2">
          <input 
            type="number" 
            className="input-base text-center" 
            value={style.lineSpacing}
            onChange={(e) => updateStyle(item.key, 'lineSpacing', Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
          />
        </td>
        
        {/* Alignment */}
        <td className="px-2">
          <div className="seg-group" onClick={(e) => e.stopPropagation()}>
            {[
              { val: 'left', Icon: AlignLeft },
              { val: 'center', Icon: AlignCenter },
              { val: 'right', Icon: AlignRight },
              { val: 'justify', Icon: AlignJustify }
            ].map(({ val, Icon }) => (
              <button 
                key={val}
                className={`seg-btn ${style.alignment === val ? 'active' : ''}`}
                onClick={() => updateStyle(item.key, 'alignment', val)}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </td>
        
        {/* First Line Indent */}
        <td className="px-2">
          {item.showIndent ? (
            <input 
              type="number" 
              className="input-base text-center" 
              value={style.firstLineIndent ?? 0}
              onChange={(e) => updateStyle(item.key, 'firstLineIndent', Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="h-8 flex items-center justify-center text-gray-300">-</div>
          )}
        </td>
        
        {/* Numbering */}
        <td className="px-2">
          {item.showNumbering ? (
            <button 
              onClick={(e) => {
                e.stopPropagation()
                openDrawer(item.key)
              }}
              className={`w-full h-8 flex items-center gap-2 px-2 rounded text-xs border transition-colors ${numbering.enabled ? 'bg-white border-[#94BFFF] text-[#165DFF]' : 'bg-white border-dashed border-gray-300 text-gray-400'}`}
            >
              {numbering.enabled ? <CheckCircle2 size={14} className="flex-shrink-0" /> : <CircleDashed size={14} className="flex-shrink-0" />}
              <span className="truncate">{numbering.enabled ? numbering.previewText : '无编号'}</span>
              <Settings2 size={12} className="ml-auto opacity-50" />
            </button>
          ) : (
            <div className="h-8 flex items-center justify-center text-gray-300">-</div>
          )}
        </td>
        
        <td className="pr-6 text-right">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setEditingId(null)
            }}
            className="px-3 py-1.5 bg-[#165DFF] text-white text-xs rounded hover:bg-blue-700 shadow-sm transition-colors"
          >
            完成
          </button>
        </td>
      </tr>
    )
  }

  return (
    <>
      <style>{`
        /* --- 基础重置 --- */
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #F2F3F5; margin: 0; padding-bottom: 40px; }
        
        /* --- 1. 抽屉样式 --- */
        .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.2); backdrop-filter: blur(2px); z-index: 998; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .drawer-overlay.active { opacity: 1; visibility: visible; }
        .drawer-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 380px; background: white; z-index: 999; box-shadow: -5px 0 25px rgba(0,0,0,0.1); transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; }
        .drawer-panel.active { transform: translateX(0); }

        /* --- 2. 表格布局 --- */
        .table-wrapper { overflow-x: auto; border-radius: 0 0 8px 8px; }
        .data-table { width: 100%; min-width: 1000px; border-collapse: collapse; table-layout: fixed; }
        
        /* 列宽定义 */
        .col-name { width: 120px; }
        .col-font { width: 200px; }
        .col-size { width: 110px; }
        .col-line { width: 110px; }
        .col-align { width: 160px; }
        .col-indent { width: 110px; }
        .col-num  { width: 140px; }
        .col-opt  { width: 80px; }

        /* --- 3. 组件样式 --- */
        .capsule { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 99px; border: 1px solid #E5E7EB; background: #F7F8FA; color: #4E5969; font-size: 12px; font-weight: 500; white-space: nowrap; user-select: none; }
        .capsule.blue { background: #E8F3FF; color: #165DFF; border-color: #94BFFF; }
        
        .input-base { width: 100%; height: 32px; background: #fff; border: 1px solid #E5E6EB; border-radius: 4px; font-size: 13px; color: #1D2129; outline: none; padding: 0 8px; transition: all 0.2s; }
        .input-base:focus { border-color: #165DFF; box-shadow: 0 0 0 2px rgba(22,93,255,0.1); }
        .input-base:disabled { background: #F7F8FA; color: #C9CDD4; cursor: not-allowed; }
        
        /* 模糊搜索框 (DataList) */
        input[list]::-webkit-calendar-picker-indicator { opacity: 0.5; font-size: 12px; transition: 0.2s; cursor: pointer; }
        input[list]:hover::-webkit-calendar-picker-indicator { opacity: 1; }

        /* 分段按钮 */
        .seg-group { display: flex; background: #F2F3F5; padding: 2px; border-radius: 4px; height: 32px; }
        .seg-btn { flex: 1; display: flex; align-items: center; justify-content: center; border-radius: 2px; color: #86909C; cursor: pointer; transition: 0.1s; }
        .seg-btn.active { background: #fff; color: #165DFF; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
        
        /* Checkbox 自定义 */
        .custom-checkbox { appearance: none; width: 16px; height: 16px; border: 1px solid #C9CDD4; border-radius: 2px; background: #fff; position: relative; cursor: pointer; transition: 0.2s; }
        .custom-checkbox:checked { background: #165DFF; border-color: #165DFF; }
        .custom-checkbox:checked::after { content: ''; position: absolute; left: 5px; top: 1px; width: 4px; height: 8px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }

        /* 卡片通用 */
        .card { background: #fff; border-radius: 8px; border: 1px solid #E5E6EB; box-shadow: 0 1px 2px rgba(0,0,0,0.02); overflow: hidden; margin-bottom: 16px; }
        .card-header { padding: 16px 24px; border-bottom: 1px solid #F2F3F5; font-size: 14px; font-weight: 600; color: #1D2129; background: #fff; }
        .card-body { padding: 24px; }
      `}</style>

      {/* ================= 侧边抽屉 ================= */}
      <div 
        className={`drawer-overlay ${drawerVisible ? 'active' : ''}`} 
        onClick={() => setDrawerVisible(false)}
      ></div>
      <div className={`drawer-panel ${drawerVisible ? 'active' : ''}`}>
        {/* 抽屉头部 */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-base font-bold text-gray-900">配置编号规则</h3>
            <div className="text-xs text-gray-400 mt-1">
              设置 <span className="font-bold text-gray-700">{STYLE_ITEMS_CONFIG.find(i => i.key === activeDrawerStyleKey)?.label}</span> 的编号样式
            </div>
          </div>
          <button onClick={() => setDrawerVisible(false)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500">
            <X size={16} />
          </button>
        </div>
        
        {/* 抽屉内容 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white">
          {/* 启用开关 */}
          <div 
            className="flex items-center justify-between p-3 rounded-lg border shadow-sm transition-colors"
            style={{
              borderColor: tempNumbering.enabled ? '#BFDBFE' : '#E5E6EB',
              backgroundColor: tempNumbering.enabled ? '#F0F6FF' : '#fff'
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className={`p-2 rounded-md transition-colors ${tempNumbering.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
              >
                <Power size={16} />
              </div>
              <div>
                <span className={`block text-sm font-bold ${tempNumbering.enabled ? 'text-[#165DFF]' : 'text-gray-900'}`}>
                  启用自动编号
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={tempNumbering.enabled}
                onChange={(e) => setTempNumbering(prev => ({ ...prev, enabled: e.target.checked }))}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            </label>
          </div>

          {/* 配置项 */}
          <div 
            className="space-y-6 transition-opacity duration-300"
            style={{
              opacity: tempNumbering.enabled ? 1 : 0.4,
              pointerEvents: tempNumbering.enabled ? 'auto' : 'none'
            }}
          >
            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block uppercase">级联继承</label>
              <div className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="custom-checkbox" 
                    checked={tempNumbering.cascade}
                    onChange={(e) => setTempNumbering(prev => ({ ...prev, cascade: e.target.checked }))}
                  /> 
                  <span>继承上级</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">连接符</span>
                  <select 
                    className="input-base w-16 h-8 py-0 text-center bg-gray-50"
                    value={tempNumbering.separator}
                    onChange={(e) => setTempNumbering(prev => ({ ...prev, separator: e.target.value }))}
                  >
                    <option value=".">.</option>
                    <option value="-">-</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 mb-2 block uppercase">样式积木</label>
              <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-[50px_1fr_50px] gap-2 items-end">
                <div className="text-center">
                  <label className="text-[10px] text-gray-400 mb-1 block">前缀</label>
                  <input 
                    type="text" 
                    className="input-base text-center px-0 text-blue-600" 
                    placeholder="-" 
                    value={tempNumbering.prefix}
                    onChange={(e) => setTempNumbering(prev => ({ ...prev, prefix: e.target.value }))}
                  />
                </div>
                <div className="text-center">
                  <label className="text-[10px] text-gray-400 mb-1 block">类型</label>
                  <div className="relative">
                    <select 
                      className="input-base pl-2 text-sm"
                      value={tempNumbering.counterType}
                      onChange={(e) => setTempNumbering(prev => ({ ...prev, counterType: e.target.value }))}
                    >
                      <option value="1">1, 2, 3</option>
                      <option value="一">一, 二, 三</option>
                      <option value="①">①, ②, ③</option>
                      <option value="I">I, II, III</option>
                      <option value="i">i, ii, iii</option>
                      <option value="A">A, B, C</option>
                      <option value="a">a, b, c</option>
                      <option value="壹">壹, 贰, 叁</option>
                    </select>
                  </div>
                </div>
                <div className="text-center">
                  <label className="text-[10px] text-gray-400 mb-1 block">后缀</label>
                  <input 
                    type="text" 
                    className="input-base text-center px-0 text-blue-600" 
                    placeholder="-" 
                    value={tempNumbering.suffix}
                    onChange={(e) => setTempNumbering(prev => ({ ...prev, suffix: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* 预览 */}
            <div className="bg-slate-900 rounded-lg p-5 text-center">
              <div className="text-2xl font-bold text-white font-serif">
                {tempNumbering.previewText}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Live Preview</p>
            </div>
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
          <button onClick={() => setDrawerVisible(false)} className="flex-1 py-2 border border-gray-200 rounded text-sm text-gray-600">取消</button>
          <button onClick={saveDrawerConfig} className="flex-1 py-2 bg-blue-600 text-white rounded text-sm">确认应用</button>
        </div>
      </div>

      {/* ================= 主界面内容 ================= */}
      <div className="w-full max-w-[1200px] mx-auto px-4 py-6 space-y-6">
        
        {/* 1. 顶部导航 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ArrowLeft className="w-4 h-4 cursor-pointer hover:text-gray-900" onClick={() => navigate('/profiles')} /> 
            返回列表 <span className="text-gray-300">/</span> <span className="text-gray-900 font-bold">{profile.name || '新建规范'}</span>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-white border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 shadow-sm transition-colors"
              onClick={() => {
                if (id) {
                  const existing = profiles.find((p) => p.id === id)
                  if (existing) setProfile(JSON.parse(JSON.stringify(existing)))
                } else {
                  setProfile(JSON.parse(JSON.stringify(DEFAULT_PROFILE)))
                }
              }}
            >
              重置
            </button>
            <button 
              className="px-4 py-2 bg-[#165DFF] text-white rounded text-sm hover:bg-blue-700 shadow-sm transition-colors"
              onClick={handleSave}
            >
              保存修改
            </button>
          </div>
        </div>

        {/* 2. 基本信息卡片 */}
        <div className="card">
          <div className="card-header">基本信息</div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">规范名称 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="input-base h-9" 
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">描述</label>
                <input 
                  type="text" 
                  className="input-base h-9" 
                  value={profile.description || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. 样式配置矩阵 (核心) */}
        <div className="card min-h-[500px]">
          <div className="card-header flex justify-between items-center bg-gray-50/50">
            <span>样式配置矩阵</span>
            <span className="text-xs text-[#FF7D00] bg-[#FFF7E8] px-3 py-1 rounded-full border border-[#FF7D00]/20 flex items-center gap-1">
              <MousePointerClick size={12} /> 点击表格行即可编辑样式
            </span>
          </div>

          {/* 滚动容器 */}
          <div className="table-wrapper">
            <table className="data-table">
              <thead className="bg-[#F7F8FA] text-xs text-gray-500 border-b border-gray-200 font-medium">
                <tr>
                  <th className="col-name pl-6 py-3 text-left">层级名称</th>
                  <th className="col-font px-2 py-3 text-left">字体</th>
                  <th className="col-size px-2 py-3 text-left">字号 (pt)</th>
                  <th className="col-line px-2 py-3 text-left">行距 (磅)</th>
                  <th className="col-align px-2 py-3 text-left">对齐方式</th>
                  <th className="col-indent px-2 py-3 text-left">首行缩进 (字符)</th>
                  <th className="col-num px-2 py-3 text-left">自动编号</th>
                  <th className="col-opt pr-6 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm bg-white">
                {STYLE_ITEMS_CONFIG.map(item => 
                  editingId === item.key ? renderEditRow(item) : renderViewRow(item)
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. 特殊规则卡片 */}
        <div className="card">
          <div className="card-header">特殊规则</div>
          <div className="card-body">
            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
              {/* 规则 1 */}
              <div className="flex gap-3">
                <input 
                  type="checkbox" 
                  className="custom-checkbox mt-1" 
                  checked={profile.specialRules.autoTimesNewRoman}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialRules: { ...prev.specialRules, autoTimesNewRoman: e.target.checked } }))}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">数字/英文自动 Times New Roman</div>
                  <div className="text-xs text-gray-500 mt-1">将文档中所有的纯数字和英文字符强制设置为 Times New Roman 字体，保持中西文搭配美观。</div>
                </div>
              </div>
              {/* 规则 2 */}
              <div className="flex gap-3">
                <input 
                  type="checkbox" 
                  className="custom-checkbox mt-1" 
                  checked={profile.specialRules.resetIndentsAndSpacing}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialRules: { ...prev.specialRules, resetIndentsAndSpacing: e.target.checked } }))}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">重置缩进与间距</div>
                  <div className="text-xs text-gray-500 mt-1">将左右缩进、段前段后间距设为 0（保留首行缩进设置），清除多余格式。</div>
                </div>
              </div>
              {/* 规则 3 */}
              <div className="flex gap-3">
                <input 
                  type="checkbox" 
                  className="custom-checkbox mt-1" 
                  checked={profile.specialRules.pictureLineSpacing}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialRules: { ...prev.specialRules, pictureLineSpacing: e.target.checked } }))}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">图片自动单倍行距</div>
                  <div className="text-xs text-gray-500 mt-1">自动将图片所在段落设置为单倍行距，防止图片被行距截断显示不全。</div>
                </div>
              </div>
              {/* 规则 4 */}
              <div className="flex gap-3">
                <input 
                  type="checkbox" 
                  className="custom-checkbox mt-1" 
                  checked={profile.specialRules.pictureCenterAlign}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialRules: { ...prev.specialRules, pictureCenterAlign: e.target.checked } }))}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">图片自动居中</div>
                  <div className="text-xs text-gray-500 mt-1">自动将图片段落设置为居中对齐。</div>
                </div>
              </div>
              {/* 规则 5 */}
              <div className="flex gap-3">
                <input 
                  type="checkbox" 
                  className="custom-checkbox mt-1" 
                  checked={profile.specialRules.removeManualNumberPrefixes}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialRules: { ...prev.specialRules, removeManualNumberPrefixes: e.target.checked } }))}
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">自动清除自动编号</div>
                  <div className="text-xs text-gray-500 mt-1">自动识别并移除段落自动添加的 1. / 1、 / (1) / ① 等编号字符。（不是手动输入的编号）</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
