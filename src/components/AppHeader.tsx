import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconApps, IconSettings, IconSync, IconDownload, IconCheckCircle, IconExclamationCircle, IconEdit } from '@arco-design/web-react/icon'
import { Tooltip, Progress } from '@arco-design/web-react'
import brandLogo from '@/assets/brand_logo.png'

type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'

export function AppHeader() {
    const navigate = useNavigate()
    const location = useLocation()
    const [appVersion, setAppVersion] = useState<string>('')
    const [status, setStatus] = useState<UpdateStatus>('idle')
    const [progress, setProgress] = useState<number>(0)
    const [newVersion, setNewVersion] = useState<string>('')

    useEffect(() => {
        const api = (window as any).electronAPI
        if (api) {
            // 获取当前版本
            api.getAppVersion().then((v: string) => setAppVersion(v))

            // 监听更新事件
            api.onCheckingForUpdate(() => setStatus('checking'))

            api.onUpdateAvailable((info: any) => {
                setStatus('available')
                setNewVersion(info.version)
            })

            api.onDownloadProgress((prog: any) => {
                setStatus('downloading')
                setProgress(Math.floor(prog.percent))
            })

            api.onUpdateDownloaded((info: any) => {
                setStatus('downloaded')
                setNewVersion(info.version)
            })

            api.onUpdateError((err: string) => {
                console.error('Update error:', err)
                setStatus('error')
                // 3秒后恢复空闲状态，避免报错一直显示
                setTimeout(() => setStatus('idle'), 5000)
            })
        }
    }, [])

    const handleRestart = () => {
        (window as any).electronAPI.quitAndInstall()
    }

    const navItems = [
        { path: '/', label: '工作台', icon: <IconApps className="mr-2" /> },
        { path: '/profiles', label: '规范管理', icon: <IconSettings className="mr-2" /> },
        { path: '/fonts', label: '字体管理', icon: <IconEdit className="mr-2" /> },
    ]

    // 渲染更新状态指示器
    const renderUpdateIndicator = () => {
        const displayVersion = appVersion || 'Dev'

        return (
            <div className="flex items-center gap-3 mr-4 transition-all">
                {/* 版本号 */}
                <span className="text-xs text-gray-400 font-mono">v{displayVersion}</span>

                {/* 状态反馈 */}
                {status === 'checking' && (
                    <Tooltip content="正在检查更新...">
                        <IconSync spin className="text-gray-400" />
                    </Tooltip>
                )}

                {status === 'available' && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full animate-pulse">
                        <IconDownload />
                        <span>发现新版本 v{newVersion}</span>
                    </div>
                )}

                {status === 'downloading' && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                        <div style={{ width: 16, height: 16 }}>
                            <Progress
                                type="circle"
                                percent={progress}
                                width={16}
                                color="#165DFF"
                                showText={false}
                                strokeWidth={4}
                            />
                        </div>
                        <span className="font-medium">下载中 {progress}%</span>
                    </div>
                )}

                {status === 'downloaded' && (
                    <div
                        onClick={handleRestart}
                        className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200 cursor-pointer hover:bg-green-100 transition-colors shadow-sm"
                        title="点击重启以应用更新"
                    >
                        <IconCheckCircle />
                        <span className="font-bold">更新就绪 (v{newVersion})</span>
                    </div>
                )}

                {status === 'error' && (
                    <Tooltip content="更新检查失败，请检查网络">
                        <IconExclamationCircle className="text-red-400" />
                    </Tooltip>
                )}
            </div>
        )
    }

    return (
        <div className="fixed top-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 flex justify-between items-center z-50">
            <div className="flex items-center gap-3">
                <img src={brandLogo} alt="成都兴城" className="h-8 object-contain" />
                <div className="h-5 w-px bg-gray-300 mx-2"></div>
                <span className="text-lg font-bold text-gray-800">公文格式化助手</span>
            </div>

            <div className="flex items-center">
                {renderUpdateIndicator()}

                <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200/50">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all ${isActive
                                    ? 'bg-white text-blue-600 shadow-sm font-bold'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                    }`}
                            >
                                {item.icon} {item.label}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
