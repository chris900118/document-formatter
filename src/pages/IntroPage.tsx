import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Zap, Type, RefreshCw, ShieldCheck, Download, ArrowRight, FileText, CheckCircle, Smartphone } from 'lucide-react';
import introLogo from '@/assets/intro_logo.png';
// import introLogo from '@/assets/intro_logo.png'; // Optional if we want to show it again

// Slide Configuration
const slides = [
    {
        id: 'welcome',
        color: 'bg-blue-50',
        content: (
            <div className="h-full flex flex-col items-center justify-center text-center px-10">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                    <img src={introLogo} alt="Logo" className="h-40 w-40 object-contain relative z-10 drop-shadow-2xl" />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                    兴城公文格式化助手
                </h1>
                <p className="text-xl text-gray-600 mb-10 max-w-lg">
                    专为公文写作打造的智能化工具，让排版更规范、更高效。
                </p>
                <div className="flex gap-4">
                    <span className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-600 border border-gray-100 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" /> 极速排版
                    </span>
                    <span className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-600 border border-gray-100 flex items-center gap-2">
                        <Type className="w-4 h-4 text-green-500" /> 字体检测
                    </span>
                    <span className="px-4 py-2 bg-white rounded-lg shadow-sm text-sm font-medium text-gray-600 border border-gray-100 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-500" /> 本地安全
                    </span>
                </div>
            </div>
        )
    },
    {
        id: 'format',
        title: '一键公文标准化',
        color: 'bg-white',
        content: (
            <div className="h-full flex flex-row items-center justify-between px-12 gap-8">
                <div className="flex-1 space-y-6 text-left">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                        <FileText className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">智能排版引擎</h2>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        告别繁琐的手动调整。内置《党政机关公文格式》国家标准，一键自动纠正：
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                            <span>标题、正文、落款字号与字体</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                            <span>标准行间距与段落缩进</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                            <span>页边距与版式自动校准</span>
                        </li>
                    </ul>
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="relative w-64 h-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="h-4 bg-gray-100 rounded w-3/4 mb-4"></div>
                        <div className="space-y-2">
                            <div className="h-2 bg-gray-100 rounded w-full"></div>
                            <div className="h-2 bg-gray-100 rounded w-full"></div>
                            <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                            <div className="h-2 bg-gray-100 rounded w-full"></div>
                        </div>
                        <div className="absolute inset-0 bg-blue-500/5 flex items-center justify-center">
                            <Zap className="w-16 h-16 text-blue-500 opacity-20" />
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'font',
        title: '字体智能管理',
        color: 'bg-green-50/30',
        content: (
            <div className="h-full flex flex-row-reverse items-center justify-between px-12 gap-8">
                <div className="flex-1 space-y-6 text-left">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-4">
                        <Type className="w-6 h-6" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">缺失字体自动修复</h2>
                    <p className="text-gray-500 text-lg leading-relaxed">
                        文档打开乱码？字体显示不对？助手帮您自动检测并安装所需公文专用字体。
                    </p>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>方正小标宋、仿宋_GB2312 等专用字体</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>一键安装，无需手动搜索下载</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span>彻底解决“跑版”问题</span>
                        </li>
                    </ul>
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="w-72 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 p-3 border-b border-gray-100 flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-100">
                                <span className="font-serif">方正小标宋简体</span>
                                <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full">已安装</span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-100">
                                <span className="font-serif text-gray-400">仿宋_GB2312</span>
                                <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded-full">缺失</span>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <div className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded shadow">一键修复</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'secure',
        title: '安全无忧',
        color: 'bg-white',
        content: (
            <div className="h-full flex flex-col items-center justify-center text-center px-16">
                <div className="w-16 h-16 bg-purple-100 rounded-3xl flex items-center justify-center text-purple-600 mb-6 scale-110">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">数据本地处理，安全零泄露</h2>
                <p className="text-lg text-gray-500 max-w-2xl mb-12">
                    我们深知公文数据的敏感性。兴城公文格式化助手的所有核心逻辑（格式识别、排版调整）均在您计算机本地完成。
                </p>

                <div className="grid grid-cols-3 gap-8 w-full max-w-4xl">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="mb-3 text-gray-400"><Smartphone className="w-8 h-8 mx-auto" /></div>
                        <h3 className="font-bold text-gray-900">本地运行</h3>
                        <p className="text-sm text-gray-500 mt-2">无需互联网上传文档</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="mb-3 text-gray-400"><RefreshCw className="w-8 h-8 mx-auto" /></div>
                        <h3 className="font-bold text-gray-900">实时更新</h3>
                        <p className="text-sm text-gray-500 mt-2">自动获取最新规则</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="mb-3 text-gray-400"><ShieldCheck className="w-8 h-8 mx-auto" /></div>
                        <h3 className="font-bold text-gray-900">集团认证</h3>
                        <p className="text-sm text-gray-500 mt-2">科技创新部出品</p>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'start',
        title: '',
        color: 'bg-blue-600',
        content: (
            <div className="h-full flex flex-col items-center justify-center text-center px-10 text-white">
                <div className="mb-8 p-6 bg-white/10 rounded-full backdrop-blur-md">
                    <img src={introLogo} alt="Logo" className="h-28 w-28 object-contain brightness-0 invert" />
                </div>
                <h1 className="text-4xl font-extrabold mb-6">准备就绪</h1>
                <p className="text-xl text-blue-100 mb-12 max-w-lg">
                    开始体验更高效、更规范的公文写作流程。
                </p>
                <button
                    onClick={() => {
                        const api = (window as any).electronAPI;
                        if (api && api.closeIntroWindow) {
                            api.closeIntroWindow();
                        } else {
                            window.close();
                        }
                    }}
                    className="group px-10 py-4 bg-white text-blue-600 rounded-2xl text-xl font-bold hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20 flex items-center gap-3"
                >
                    立即开始使用
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        )
    }
];

export function IntroPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setIsAnimating(true);
            setCurrentSlide(prev => prev + 1);
            setTimeout(() => setIsAnimating(false), 300);
        } else {
            // Last slide button handles close
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setIsAnimating(true);
            setCurrentSlide(prev => prev - 1);
            setTimeout(() => setIsAnimating(false), 300);
        }
    };

    // Current Slide Data
    const slide = slides[currentSlide];

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden bg-white select-none">
            {/* Content Area - Filling remaining space */}
            <div className={`flex-1 relative transition-colors duration-500 ${slide.color}`}>
                {/* Decoration blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                {/* Main Content Container with Animation */}
                <div className={`w-full h-full transition-all duration-300 transform ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    {slide.content}
                </div>
            </div>

            {/* Footer Navigation - Fixed Height */}
            {slide.id !== 'start' && (
                <div className="h-20 flex-shrink-0 bg-white/80 backdrop-blur-md border-t border-gray-100 flex items-center justify-between px-10 z-20">
                    {/* Dots */}
                    <div className="flex gap-2">
                        {slides.map((s, idx) => (
                            <div
                                key={s.id}
                                className={`h-2 rounded-full transition-all duration-500 ease-out ${idx === currentSlide ? 'bg-blue-600 w-10' : 'bg-gray-200 w-2 hover:bg-gray-300'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handlePrev}
                            disabled={currentSlide === 0}
                            className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 text-sm ${currentSlide === 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <ChevronLeft className="w-4 h-4" /> 上一步
                        </button>

                        <button
                            onClick={handleNext}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 group text-sm hover:scale-105 active:scale-95"
                        >
                            下一步
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
