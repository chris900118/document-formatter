import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconApps, IconSettings, IconSync, IconDownload, IconCheckCircle, IconExclamationCircle, IconEdit, IconQuestionCircle } from '@arco-design/web-react/icon'
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
    const [errorMessage, setErrorMessage] = useState<string>('')

    useEffect(() => {
        const hasSeenIntro = localStorage.getItem('hasSeenIntro_v1.0.5');
        if (!hasSeenIntro) {
            setTimeout(() => {
                window.electronAPI?.openIntro();
            }, 1000);
            localStorage.setItem('hasSeenIntro_v1.0.5', 'true');
        }
    }, []);

    const handleShowIntro = () => {
        window.electronAPI?.openIntro();
    };

    useEffect(() => {
        const api = (window as any).electronAPI
        if (api) {
            // 获取当前版本
            api.getAppVersion().then((v: string) => setAppVersion(v))

            // 监听更新事件
            api.onCheckingForUpdate(() => {
                setStatus('checking')
                setErrorMessage('')
            })

            api.onUpdateAvailable((info: any) => {
                setStatus('available')
                setNewVersion(info.version)
            })

            api.onUpdateNotAvailable((info: any) => {
                console.log('Update check: No new version found.', info)
                setStatus('idle')
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
                // 忽略 404 错误（通常意味着没有发布版本），视为已经是最新
                if (err.includes('404') || err.includes('net::ERR_HTTP_RESPONSE_CODE_FAILURE')) {
                    console.warn('Update check: Release not found (404), assuming latest version.', err)
                    setStatus('idle')
                    return
                }

                console.error('Update error:', err)
                setErrorMessage(err)
                setStatus('error')
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
                {/* 版本号 & 署名 */}
                <div
                    onClick={() => {
                        if (status === 'checking') return
                        const api = (window as any).electronAPI
                        if (api && api.checkForUpdate) {
                            console.log('Manually checking for update...')
                            api.checkForUpdate()
                        }
                    }}
                    className="flex flex-col items-end cursor-pointer group"
                    title="点击检查更新"
                >
                    <span className="text-xs text-gray-400 font-mono group-hover:text-blue-500 transition-colors">v{displayVersion}</span>
                    <span className="text-[10px] text-gray-400 scale-90 origin-right tracking-wider opacity-60">科技创新部</span>
                </div>

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
                    <Tooltip content={`错误详情: ${errorMessage || '未知网络错误'}`}>
                        <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full cursor-help animate-pulse">
                            <IconExclamationCircle />
                            <span>更新中断</span>
                        </div>
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

                <Tooltip content="新功能介绍 / 使用指引">
                    <div
                        className="ml-2 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors flex items-center"
                        onClick={handleShowIntro}
                    >
                        <IconQuestionCircle style={{ fontSize: 18 }} />
                    </div>
                </Tooltip>
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
