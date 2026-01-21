import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ArrowRight, CheckCircle, MousePointer2, Cpu, ShieldCheck, Type } from 'lucide-react';
import introLogo from '@/assets/brand_logo.png';

// Components
const FormatDemo = () => {
    const [step, setStep] = useState(0); // 0: Idle, 1: Hover/Select, 2: Applied, 3: Success

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((s) => (s + 1) % 4);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const mockData = [
        { text: '关于印发管理办法的通知', origin: '正文', target: '一级标题' },
        { text: '一、基本原则', origin: '正文', target: '二级标题' },
        { text: '各部门要高度重视...', origin: '正文', target: '正文' }
    ];

    return (
        <div className="relative w-full max-w-[480px] bg-white/40 backdrop-blur-2xl rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden flex flex-col h-[340px] transition-all duration-500 hover:shadow-[0_48px_80px_-24px_rgba(0,0,0,0.15)]">
            <div className="h-8 bg-slate-900/5 border-b border-slate-900/5 flex items-center px-4">
                <div className="flex gap-1.5 opacity-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left: Scanned Items List */}
                <div className="w-[45%] border-r border-slate-100 p-5 space-y-2.5 bg-white/20">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">分析引擎预览</div>
                    {mockData.map((item, idx) => (
                        <div
                            key={idx}
                            className={`p-2.5 rounded-2xl border transition-all duration-700 ${step === 1 && idx === 0 ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-500/20 scale-[1.05] z-10' :
                                step >= 2 && idx === 0 ? 'bg-green-50 border-green-100' :
                                    'bg-white/40 border-slate-100/50 opacity-40'
                                }`}
                        >
                            <div className={`text-[10px] truncate leading-tight mb-1.5 font-bold ${step === 1 && idx === 0 ? 'text-white' : 'text-slate-700'}`}>
                                {item.text}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${step === 1 && idx === 0 ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {item.origin}
                                </span>
                                <div className={`text-[8px] font-black ${step === 1 && idx === 0 ? 'text-white' : 'text-blue-500'}`}>
                                    {step >= 2 && idx === 0 ? item.target : '→ 识别中'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right: Live Preview */}
                <div className="flex-1 bg-slate-50/30 p-8 relative flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full h-full max-h-[220px] border border-slate-100/50 transition-all duration-1000">
                        {/* Title Preview */}
                        <div className={`transition-all duration-1000 ease-in-out origin-center ${step >= 2 ? 'text-center text-red-600 font-bold text-base mb-6 translate-y-2' : 'text-left text-slate-700 font-medium text-[11px] mb-3 opacity-60'
                            }`}>
                            关于印发管理办法的通知
                        </div>
                        {/* Content Lines */}
                        <div className="space-y-3 px-2">
                            <div className={`h-1.5 rounded-full transition-all duration-700 ${step >= 2 ? 'w-full bg-blue-50 translate-x-2' : 'w-full bg-slate-100'}`}></div>
                            <div className={`h-1.5 bg-slate-100 rounded-full transition-all duration-700 ${step >= 2 ? 'w-4/5 translate-x-0' : 'w-full opacity-40'}`}></div>
                            <div className={`h-1.5 bg-slate-100 rounded-full w-3/5 opacity-20`}></div>
                        </div>

                        {/* Success Overlay */}
                        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md transition-all duration-1000 ${step === 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-green-500/30 mb-3 animate-bounce">
                                <CheckCircle size={24} />
                            </div>
                            <span className="text-xs font-black text-green-600 tracking-widest">排版就绪</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simulated Cursor */}
            <div className={`absolute transition-all duration-1000 pointer-events-none z-50
                ${step === 0 ? 'top-10 left-10 opacity-0' :
                    step === 1 ? 'top-[54px] left-[110px] opacity-100 scale-125' :
                        step === 2 ? 'top-[54px] left-[110px] opacity-100 scale-90 translate-x-4' :
                            'top-20 left-20 opacity-0'
                }
            `}>
                <MousePointer2 size={28} fill="currentColor" className="text-blue-600 drop-shadow-[0_8px_16px_rgba(37,99,235,0.3)]" />
            </div>
        </div>
    );
};

// Simplified Intro Page (v1.0.6 Style + v1.0.7 Content)
const slides = [
    {
        id: 'welcome',
        color: 'bg-white',
        content: (
            <div className="relative h-full w-full flex flex-col justify-center px-24">
                {/* Fixed Header Logo */}
                <div className="absolute top-12 left-24">
                    <img src={introLogo} alt="Logo" className="h-16 w-auto object-contain" />
                </div>

                {/* Main Text Content */}
                <div className="space-y-8 max-w-3xl mt-12">
                    <h1 className="text-4xl font-bold text-slate-900 leading-[1.15] tracking-tight">
                        把复杂的规则交给<span className="text-slate-400">程序</span><br />
                        <span className="text-blue-600">把简单留给用户</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-xl leading-relaxed font-normal">
                        通过底层算法逻辑，解决 word 公文排版中的高频痛点，实现自动化排版，不在琐碎的重复机械工作浪费时间。
                    </p>
                </div>
            </div>
        )
    },
    {
        id: 'format',
        title: '所见即所得',
        color: 'bg-white',
        content: (
            <div className="h-full flex flex-row items-center justify-center px-24 gap-20">
                <div className="flex-1 space-y-6 text-left">
                    <h2 className="text-4xl font-bold text-slate-900 leading-tight">内置兴城集团<br />公文排版规范</h2>
                    <p className="text-slate-600 text-lg leading-relaxed max-w-md">
                        支持实时预览与手动微调。识别结果一目了然，修改即刻生效，真正做到所见即所得。
                    </p>
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="w-full transform scale-95 shadow-2xl rounded-[24px]">
                        <FormatDemo />
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'font',
        title: '字体环境补齐',
        color: 'bg-white',
        content: (
            <div className="h-full flex flex-row-reverse items-center justify-center px-24 gap-20">
                <div className="flex-1 space-y-6 text-left">
                    <h2 className="text-4xl font-bold text-slate-900 leading-tight">预装兴城集团公文字体<br />必备字体一键补齐</h2>
                    <p className="text-slate-600 text-lg leading-relaxed max-w-md">
                        深度集成核心公文字体。无需盲目搜索安装，彻底规避捆绑软件与流氓弹窗带来的隐患。
                    </p>
                    <div className="flex items-center gap-3 text-slate-700 font-medium pt-2">
                        <CheckCircle className="text-green-500" size={20} />
                        <span>核心字体全预装，点击即用</span>
                    </div>
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="w-[280px] h-[280px] bg-slate-100 rounded-[32px] flex flex-col items-center justify-center text-slate-800 space-y-4 shadow-inner">
                        <Type size={80} className="text-blue-600 opacity-80" />
                        <div className="text-center">
                            <div className="text-lg font-bold">智能环境初始化</div>
                            <div className="text-sm text-slate-500 mt-2">自动检测并修复缺失字体</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'secure',
        title: '定期更新',
        color: 'bg-white',
        content: (
            <div className="h-full flex flex-col items-center justify-center text-center px-16">
                <h2 className="text-4xl font-bold text-slate-900 mb-6">定期更新，持续进化</h2>
                <p className="text-xl text-slate-600 max-w-3xl mb-16 leading-relaxed">
                    基于用户反馈持续优化底层算法。本程序处理均在<span className="font-bold text-slate-900 underline decoration-blue-500 underline-offset-4">本地完成</span>，绝不上传文档，守护您的核心数据。
                </p>

                <div className="grid grid-cols-2 gap-8 w-full max-w-3xl">
                    <div className="p-8 bg-slate-50 rounded-2xl flex flex-col items-center gap-4 hover:shadow-lg transition-shadow duration-300">
                        <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-sm border border-slate-100"><Cpu size={24} /></div>
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold text-slate-800">响应需求</h4>
                            <p className="text-sm text-slate-500">逐步丰富排版模版库</p>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-2xl flex flex-col items-center gap-4 hover:shadow-lg transition-shadow duration-300">
                        <div className="w-12 h-12 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-sm border border-slate-100"><ShieldCheck size={24} /></div>
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold text-slate-800">隐私至上</h4>
                            <p className="text-sm text-slate-500">离线运行，绝无泄密后忧</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'start',
        title: '',
        color: 'bg-white',
        content: (
            <div className="h-full flex flex-col items-center justify-center text-center px-10">
                <h1 className="text-6xl font-bold text-slate-900 mb-8 tracking-tight">开启高效排版新时代</h1>
                <p className="text-xl text-slate-500 max-w-md mb-16 leading-relaxed">
                    由算法接管繁杂，让您专注创作核心，<br />即刻开启极简排版之旅。
                </p>
                <button
                    onClick={() => {
                        const api = (window as any).electronAPI;
                        if (api && api.closeIntro) api.closeIntro();
                    }}
                    className="px-12 py-4 bg-slate-900 text-white rounded-full text-xl font-bold hover:bg-blue-600 transition-colors duration-300 shadow-xl shadow-blue-900/10 flex items-center gap-3"
                >
                    立即进入
                    <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        )
    }
];

export function IntroPage() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const slide = slides[currentSlide];

    return (
        <div className="w-screen h-screen flex flex-col overflow-hidden bg-white select-none font-sans antialiased text-slate-900">
            {/* Main Content Viewport */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <div className="w-full h-full max-w-[1280px] animate-fade-in">
                    {slide.content}
                </div>
            </div>

            {/* Navigation Footer */}
            {slide.id !== 'start' && (
                <div className="h-24 flex-shrink-0 flex items-center justify-between px-16 border-t border-slate-100">
                    <div className="flex gap-3">
                        {slides.filter(s => s.id !== 'start').map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlide(idx)}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-slate-900 w-8' : 'bg-slate-200 w-2 hover:bg-slate-400'
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={handlePrev}
                            disabled={currentSlide === 0}
                            className={`px-4 py-2 font-bold transition-all text-sm flex items-center gap-2 ${currentSlide === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            <ChevronLeft size={18} /> 上一步
                        </button>
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-slate-900 text-white rounded-lg text-base font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-slate-200 flex items-center gap-2"
                        >
                            继续探索
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
