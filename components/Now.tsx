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
                        Location
                    </h2>
                    <p className="text-saka-ink/70 font-serif leading-relaxed">
                        Living in <span className="text-saka-deep-red/80">Hangzhou, China</span>.
                        <br />
                        Enjoying the misty rain and the digital silence.
                    </p>
                </section>

                <section>
                    <h2 className="text-lg font-normal text-saka-ink/80 mb-6 tracking-wide">
                        Working On
                    </h2>
                    <ul className="space-y-4 text-saka-ink/70 font-serif leading-relaxed">
                        <li className="flex items-start">
                            <span className="mr-3 opacity-50">–</span>
                            <span>Building intuitive interfaces for complex data systems.</span>
                        </li>
                        <li className="flex items-start">
                            <span className="mr-3 opacity-50">–</span>
                            <span>Refining this digital garden, creating a space for quiet thoughts.</span>
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-lg font-normal text-saka-ink/80 mb-6 tracking-wide">
                        Reading
                    </h2>
                    <div className="flex flex-col gap-2">
                        <div className="group flex items-baseline gap-3">
                            <span className="text-saka-ink/80 italic">《The Design of Everyday Things》</span>
                            <span className="text-xs text-saka-ink/40 uppercase tracking-widest group-hover:text-saka-deep-red transition-colors">Don Norman</span>
                        </div>
                        <p className="text-sm text-saka-ink/50 mt-1 pl-1">Revisiting the fundamentals.</p>
                    </div>
                </section>

                <section>
                    <div className="mt-20 pt-10 border-t border-saka-ink/10 text-xs text-saka-ink/40 tracking-widest">
                        Last updated: January 2026
                    </div>
                </section>
            </div>
        </div>
    );
};
