import React from 'react';

export const Now: React.FC = () => {
    return (
        <div className="w-full max-w-4xl mx-auto px-8 md:px-12 pt-32 pb-20 animate-fade-in">
            <header className="mb-16 md:mb-20">
                <h1 className="text-3xl md:text-4xl font-light text-saka-ink/90 tracking-wider mb-3">
                    Now
                </h1>
                <p className="text-sm text-saka-ink/50 tracking-wider">此时 · Present</p>
                <div className="mt-6 h-px w-16 bg-saka-ink/20" />
            </header>

            <div className="space-y-16">
                <section>
                    <h2 className="text-lg font-normal text-saka-ink/80 mb-6 tracking-wide">
                        坐标
                    </h2>
                    <p className="text-saka-ink/70 font-serif leading-relaxed">
                        <span className="text-saka-deep-red/80">南京</span>。
                        <br />
                        码农/独立开发者，偶尔去玄武湖边溜达，更多时候泡在网上。
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-normal text-saka-ink/80 mb-6 tracking-wide">
                        专注
                    </h2>
                    <ul className="space-y-4 text-saka-ink/70 font-serif leading-relaxed">
                        <li className="flex items-start">
                            <span className="mr-3 opacity-50">–</span>
                            <span>这里是我的自留地，整理思绪，防止脑子生锈。</span>
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-normal text-saka-ink/80 mb-6 tracking-wide">
                        阅读
                    </h2>
                    <div className="flex flex-col gap-2">
                        <div className="group flex items-baseline gap-3">
                            <span className="text-saka-ink/80 italic">《设计心理学》</span>
                            <span className="text-xs text-saka-ink/40 uppercase tracking-widest group-hover:text-saka-deep-red transition-colors">唐·诺曼</span>
                        </div>
                        <p className="text-sm text-saka-ink/50 mt-1 pl-1">经典老书，常看常新。</p>
                    </div>
                </section>

                <section>
                    <div className="mt-20 pt-10 border-t border-saka-ink/10 text-xs text-saka-ink/40 tracking-widest">
                        最后更新：2026年1月
                    </div>
                </section>
            </div>
        </div>
    );
};
