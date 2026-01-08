import { Modal } from '@arco-design/web-react'
import { AlertCircle, X, Copyright, ShieldCheck, ExternalLink, Wrench, Settings2 } from 'lucide-react'

interface FontInstallGuideProps {
    visible: boolean
    onCancel: () => void
    fontName: string
}

export default function FontInstallGuide({ visible, onCancel, fontName }: FontInstallGuideProps) {
    // Logic: If fontName includes "GB2312" or "方正" (common requirement), show both options.
    const showSystemFix = fontName.includes('GB2312') || fontName.includes('方正')

    const openUrl = (url: string) => {
        if (window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal(url)
        } else {
            window.open(url, '_blank')
        }
    }

    return (
        <Modal
            visible={visible}
            onCancel={onCancel}
            footer={null}
            closable={false}
            className="font-install-guide-modal"
            style={{ width: 900, padding: 0, borderRadius: 16, overflow: 'hidden' }}
            wrapClassName="p-0"
        >
            <div className="bg-white rounded-2xl overflow-hidden relative">
                {/* Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            缺失字体：{fontName}
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">检测到系统缺失该字体，请选择一种方式进行修复：</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body: Options */}
                <div className="p-8 bg-gray-50/50 relative">

                    {/* Divider (Only if both options are shown) */}
                    {showSystemFix && (
                        <>
                            <div className="absolute left-1/2 top-8 bottom-8 w-px bg-gray-200 hidden md:block"></div>
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 text-gray-400 text-xs font-bold border border-gray-200 rounded-xl z-10 hidden md:block">OR</div>
                        </>
                    )}

                    <div className={`grid ${showSystemFix ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'} gap-8`}>

                        {/* Option 1: Official */}
                        <div className="bg-white rounded-xl p-6 flex flex-col h-full cursor-pointer group border border-gray-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <Copyright className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">方案一</div>
                                    <h3 className="text-lg font-bold text-gray-900">官方正版渠道</h3>
                                </div>
                            </div>

                            <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">
                                适用于<strong>商业用途</strong>或对版权有严格要求的场景。请前往方正字库或相关官网获取授权及安装包。
                            </p>

                            <div className="bg-gray-50 rounded-lg p-3 mb-6 border border-gray-100">
                                <div className="flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5" />
                                    <span className="text-xs text-gray-600">100% 版权合规，无法律风险</span>
                                </div>
                            </div>

                            <button
                                onClick={() => openUrl('https://www.foundertype.com/')}
                                className="w-full py-2.5 bg-white border border-blue-200 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 group-hover:border-blue-600"
                            >
                                <ExternalLink className="w-4 h-4" />
                                前往官网下载
                            </button>
                        </div>

                        {/* Option 2: System Fix (Conditional) */}
                        {showSystemFix && (
                            <div className="bg-white rounded-xl p-6 flex flex-col h-full cursor-pointer group border border-gray-200 hover:-translate-y-1 hover:shadow-lg hover:border-green-200 transition-all duration-300 relative">
                                {/* Recommended Badge */}
                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm">
                                    推荐 (免费)
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                                        <Wrench className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-0.5">方案二</div>
                                        <h3 className="text-lg font-bold text-gray-900">Windows 系统修复</h3>
                                    </div>
                                </div>

                                <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">
                                    适用于 <strong>Windows 10/11</strong> 用户。该字体是系统自带组件，只是被隐藏了。开启“中文补充字体”功能即可找回。
                                </p>

                                {/* Mini Steps */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">1</span>
                                        <span>点击下方按钮打开系统设置</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">2</span>
                                        <span>添加功能 -&gt; 搜索 <strong>"中文"</strong></span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">3</span>
                                        <span>勾选补充字体并安装</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => openUrl('ms-settings:optionalfeatures')}
                                    className="w-full py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md shadow-green-200 flex items-center justify-center gap-2"
                                >
                                    <Settings2 className="w-4 h-4" />
                                    一键打开设置
                                </button>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-gray-100 flex justify-end items-center bg-white">
                    <button onClick={onCancel} className="px-6 py-2 bg-gray-100 text-gray-600 font-medium rounded-lg hover:bg-gray-200 transition-colors">暂不处理</button>
                </div>
            </div>
        </Modal>
    )
}
