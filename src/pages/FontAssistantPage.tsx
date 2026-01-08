import { useState, useEffect, CSSProperties } from 'react'
import {
    List,
    Tag,
    Button,
    Message,
    Spin
} from '@arco-design/web-react'
import {
    IconCheckCircle,
    IconExclamationCircle,
    IconDownload,
    IconSync
} from '@arco-design/web-react/icon'
import { AppHeader } from '@/components/AppHeader'
import { useProfileStore } from '@/store/profileStore'

// 常用公文字体文件名映射
const FONT_FILE_MAP: Record<string, string> = {
    '仿宋_GB2312': 'fangsong_gb2312.ttf',
    '楷体_GB2312': 'kaiti_gb2312.ttf',
    '方正小标宋简体': 'FZXBSJW.TTF',
    '方正黑体': 'FangZhengHeiTiJianTi-1.ttf',
    '方正仿宋': 'FangZhengFangSongJianTi-1.ttf',
    '方正楷体': 'FangZhengKaiTiJianTi-1.ttf',
    '黑体': 'simhei.ttf',
    '宋体': 'simsun.ttc',
    'Times New Roman': 'times.ttf' // 通常 Windows 自带，但以防万一
}

export function FontAssistantPage() {
    const { profiles } = useProfileStore()
    const [systemFonts, setSystemFonts] = useState<string[]>([])
    const [requiredFonts, setRequiredFonts] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [installing, setInstalling] = useState<string | null>(null)

    const fetchFonts = async () => {
        setLoading(true)
        try {
            const result = await window.electronAPI.getFonts()
            if (result.success) {
                setSystemFonts(result.fonts)
            } else {
                Message.error('获取字体失败: ' + result.error)
            }
        } catch (e) {
            Message.error('获取字体异常')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFonts()
    }, [])

    // 监听 profiles 变化，动态计算所需字体
    useEffect(() => {
        const fonts = new Set<string>()
        profiles.forEach(p => {
            Object.values(p.styles).forEach(s => {
                // 有些字体比如 "仿宋" 可能就是 "FangSong"，比对时会处理
                if (s.fontFamily) fonts.add(s.fontFamily)
            })
            if (p.specialRules.autoTimesNewRoman) {
                fonts.add('Times New Roman')
            }
        })
        setRequiredFonts(Array.from(fonts))
    }, [profiles])

    const handleInstall = async (fontName: string, fileName: string) => {
        setInstalling(fontName)
        try {
            const result = await window.electronAPI.installFont(fileName)
            if (result.success) {
                Message.success(result.message || '已打开字体文件，请点击左上角“安装”按钮')
                // 刷新列表（可选，因为系统字体需要时间生效）
                // checkFonts() // 对于手动安装，立即刷新可能还是检测不到，可以去掉自动刷新或延迟刷新
            } else {
                Message.error(result.error || '无法打开字体文件')
            }
        } catch (error) {
            console.error('Install error:', error)
            Message.error('操作失败')
        } finally {
            setInstalling(null)
        }
    }


    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            paddingBottom: 40
        }}>
            <AppHeader />

            <div style={{
                maxWidth: 1000,
                margin: '40px auto',
                padding: 40,
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: 24,
                border: '1px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
            }}>
                {/* 页面标题 */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <h1 style={{
                        marginTop: 0,
                        fontSize: 32,
                        background: 'linear-gradient(90deg, #165DFF, #00B42A)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 10
                    }}>
                        字体管理助手
                    </h1>
                    <p style={{ color: '#4E5969', fontSize: 16, margin: 0 }}>
                        基于公文要求与本地字体情况的动态监测
                    </p>
                </div>

                {/* 统计卡片 */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 20,
                    marginBottom: 30
                }}>
                    <div style={statCardStyle}>
                        <div style={{ fontSize: 36, fontWeight: 'bold', color: '#165DFF' }}>{profiles.length}</div>
                        <div style={{ color: '#4E5969', fontSize: 14, marginTop: 5 }}>生效规范</div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={{ fontSize: 36, fontWeight: 'bold', color: '#165DFF' }}>{requiredFonts.length}</div>
                        <div style={{ color: '#4E5969', fontSize: 14, marginTop: 5 }}>必备字体</div>
                    </div>
                    <div style={statCardStyle}>
                        <div style={{ fontSize: 36, fontWeight: 'bold', color: '#FF7D00' }}>
                            {requiredFonts.filter(f => !isFontInstalled(f, systemFonts)).length}
                        </div>
                        <div style={{ color: '#4E5969', fontSize: 14, marginTop: 5 }}>需要安装</div>
                    </div>
                </div>

                {/* 列表区域 - 使用现有的 List 组件 */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: 16,
                    padding: 24,
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <span style={{ fontSize: 18, fontWeight: 600, color: '#1d2129' }}>检测结果</span>
                        <Button icon={<IconSync />} type="text" onClick={fetchFonts}>刷新状态</Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8"><Spin tip="正在检测系统字体..." /></div>
                    ) : (
                        <List
                            dataSource={requiredFonts}
                            render={(fontName, index) => {
                                const isInstalled = isFontInstalled(fontName, systemFonts)
                                const fileName = FONT_FILE_MAP[fontName]
                                const canAutoInstall = !!fileName

                                return (
                                    <List.Item
                                        key={index}
                                        style={{ padding: '16px 0' }}
                                        extra={
                                            isInstalled ? (
                                                <Tag color="green" icon={<IconCheckCircle />}>已安装</Tag>
                                            ) : canAutoInstall ? (
                                                <Button
                                                    type="primary"
                                                    size="small"
                                                    icon={<IconDownload />}
                                                    loading={installing === fontName}
                                                    onClick={() => fileName && handleInstall(fontName, fileName)}
                                                >
                                                    打开安装
                                                </Button>
                                            ) : (
                                                <Tag color="orange" icon={<IconExclamationCircle />}>需手动安装</Tag>
                                            )
                                        }
                                    >
                                        <List.Item.Meta
                                            title={<span style={{ fontWeight: 500, fontSize: 16 }}>{fontName}</span>}
                                            description={
                                                isInstalled
                                                    ? '字体已就绪，可正常使用'
                                                    : canAutoInstall
                                                        ? '系统检测到缺失，建议一键安装'
                                                        : '未找到匹配的安装包，请联系管理员或手动下载'
                                            }
                                            avatar={
                                                isInstalled
                                                    ? <IconCheckCircle style={{ color: '#00b42a', fontSize: 28 }} />
                                                    : <IconExclamationCircle style={{ color: '#ff7d00', fontSize: 28 }} />
                                            }
                                        />
                                    </List.Item>
                                )
                            }}
                        />
                    )}
                </div>

                {/* 本地字体展示区域 (Grid) */}
                <div style={{ marginTop: 30 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#4E5969', marginBottom: 16, paddingLeft: 4 }}>
                        系统已安装字体 (共 {systemFonts.length} 个)
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: 12
                    }}>
                        {systemFonts.map((font, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: 8,
                                padding: '12px 16px',
                                textAlign: 'center',
                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                color: '#1d2129',
                                fontSize: 14,
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                cursor: 'default',
                                transition: 'all 0.2s'
                            }}
                                title={font}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ffffff';
                                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {font}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// 辅助样式和函数
const statCardStyle: CSSProperties = {
    background: 'rgba(255, 255, 255, 0.6)',
    padding: 20,
    borderRadius: 16,
    textAlign: 'center' as const,
    border: '1px solid rgba(255, 255, 255, 0.5)',
    transition: 'all 0.3s ease',
    cursor: 'default'
}

// 抽离检测逻辑以复用
const isFontInstalled = (fontName: string, systemFonts: string[]) => {
    return systemFonts.some(sys => {
        const s = sys.toLowerCase()
        const f = fontName.toLowerCase()
        return s === f || s.includes(f) || (f === '仿宋' && s.includes('fangsong')) || (f === '楷体' && s.includes('kaiti'))
    })
}
