import React, { useEffect, useState } from 'react'
import { Modal } from '@arco-design/web-react'
import { useToolsStore } from '@/store/toolsStore'
import { useProfileStore } from '@/store/profileStore'
import {
    Wrench,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Type,
    Download
} from 'lucide-react'
import FontInstallGuide from './FontInstallGuide'

export default function ToolsModal() {
    const { isOpen, close } = useToolsStore()
    const { profiles, selectedProfileId } = useProfileStore()

    const currentProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0]

    const [loading, setLoading] = useState(false)
    const [missingFonts, setMissingFonts] = useState<string[]>([])
    const [guideFont, setGuideFont] = useState<string | null>(null)

    // Required fonts from profile
    const requiredFonts = React.useMemo(() => {
        if (!currentProfile) return []
        const fonts = new Set<string>()
        // Add fonts from styles
        if (currentProfile.styles) {
            Object.values(currentProfile.styles).forEach(style => {
                if (style.fontFamily) fonts.add(style.fontFamily)
            })
        }
        return Array.from(fonts)
    }, [currentProfile])

    const checkFonts = async () => {
        setLoading(true)
        try {
            // Mock delay for animation
            await new Promise(resolve => setTimeout(resolve, 800))

            if (window.electronAPI) {
                const res = await window.electronAPI.getFonts()
                if (res.success) {
                    // Check missing
                    const missing = requiredFonts.filter(f => !res.fonts.includes(f))
                    setMissingFonts(missing)
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            checkFonts()
        }
    }, [isOpen, currentProfile])

    return (
        <>
            <Modal
                visible={isOpen}
                onCancel={close}
                footer={null}
                closable={false}
                style={{ width: 800, padding: 0, borderRadius: 16, overflow: 'hidden' }}
                wrapClassName="tools-modal-wrap"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50/50 to-white p-6 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                            <Wrench className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">系统工具箱</h2>
                            <p className="text-xs text-gray-500">环境检测与修复</p>
                        </div>
                    </div>
                    <button onClick={close} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Context Bar */}
                <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-b border-gray-100">
                    <div className="text-sm text-gray-600">
                        当前检测规范：<span className="font-bold text-gray-900">{currentProfile?.name}</span>
                    </div>
                    <button
                        onClick={checkFonts}
                        disabled={loading}
                        className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${loading ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'}`}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? '扫描中...' : '重新扫描'}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 relative min-h-[300px]">
                    {/* Scanning Animation */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                            <div className="w-64 h-1 bg-gray-100 rounded-full overflow-hidden relative">
                                <div className="absolute inset-0 bg-blue-500 animate-scan-line"></div>
                            </div>
                            <p className="text-sm text-gray-500 mt-4">正在扫描系统字体库...</p>
                        </div>
                    )}

                    {/* Status Cards */}
                    {!loading && missingFonts.length > 0 && (
                        <div className="border border-red-100 bg-red-50 rounded-xl p-5 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-red-800 mb-2">环境检测未通过</h3>
                                    <p className="text-xs text-red-600 mb-3">检测到 {missingFonts.length} 款必要字体缺失，可能导致文档格式错乱。</p>

                                    <div className="flex flex-wrap gap-2">
                                        {missingFonts.map(font => (
                                            <div key={font} className="flex items-center bg-white border border-red-200 rounded-lg px-3 py-1.5 shadow-sm">
                                                <span className="text-red-700 font-bold text-sm mr-3">{font}</span>
                                                <button
                                                    onClick={() => setGuideFont(font)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 border-l border-red-100 pl-2 hover:underline transition-all font-medium"
                                                >
                                                    <Download className="w-3 h-3" />
                                                    修复
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!loading && missingFonts.length === 0 && (
                        <div className="border border-green-100 bg-green-50 rounded-xl p-5 mb-6 flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            <div>
                                <h3 className="text-sm font-bold text-green-800">环境检测通过</h3>
                                <p className="text-xs text-green-600">所有必要字体均已安装，您可以正常使用。</p>
                            </div>
                        </div>
                    )}

                    {/* Detail Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {requiredFonts.map(font => {
                            const isMissing = missingFonts.includes(font)
                            return (
                                <div key={font} className={`flex items-center justify-between p-3 rounded-lg border ${isMissing ? 'border-red-100 bg-red-50/30' : 'border-gray-100 bg-white'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center ${isMissing ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                                            <Type className="w-4 h-4" />
                                        </div>
                                        <span className={`text-sm font-medium ${isMissing ? 'text-red-700' : 'text-gray-700'}`}>{font}</span>
                                    </div>
                                    {isMissing ? (
                                        <span className="text-xs text-red-500 font-bold px-2 py-1 bg-red-100 rounded">缺失</span>
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </Modal>

            {/* Guide Modal */}
            {guideFont && (
                <FontInstallGuide
                    visible={!!guideFont}
                    fontName={guideFont}
                    onCancel={() => setGuideFont(null)}
                />
            )}
        </>
    )
}
