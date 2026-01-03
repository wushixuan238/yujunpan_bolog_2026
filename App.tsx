import React, { useState, useEffect } from 'react';
import { OrganicBackground } from './components/OrganicBackground';
import { NoiseOverlay } from './components/NoiseOverlay';
import { Navigation } from './components/Navigation';
import { About } from './components/About';
import { Blog } from './components/Blog';
import { Now } from './components/Now';
import { SnowEffect } from './components/SnowEffect';
import { ClickEffect } from './components/ClickEffect';
import { PlaylistItem } from './types';

const playList: PlaylistItem[] = [
  { id: '1', title: 'Honest', originalTitle: '誠實', duration: '04:38' },
  { id: '2', title: 'Adventure', originalTitle: '冒險', duration: '04:20' },
  { id: '3', title: 'Humble', originalTitle: '謙遜', duration: '04:34' },
  { id: '4', title: 'Study', originalTitle: '學習', duration: '05:03' },
];

export type PageType = 'home' | 'blog' | 'about' | 'now';

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [snowEnabled, setSnowEnabled] = useState(false);




  useEffect(() => {
    setMounted(true);
  }, []);



  return (
    <div className={`relative min-h-screen w-full font-serif text-saka-highlight overflow-hidden transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

      {/* 1. Background Layer: Gradients */}
      <OrganicBackground />

      {/* 2. Texture Layer: Noise/Grain (The Soul) */}
      <NoiseOverlay />

      {/* 3. Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <ClickEffect />
        {snowEnabled && <SnowEffect />}

        <Navigation
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          snowEnabled={snowEnabled}
          onToggleSnow={() => setSnowEnabled(!snowEnabled)}
        />

        {currentPage === 'about' ? (
          <About />
        ) : currentPage === 'now' ? (
          <Now />
        ) : currentPage === 'blog' ? (
          <Blog />
        ) : (
          <main className="flex-grow flex flex-col md:flex-row items-center justify-between px-8 md:px-20 pb-32 pt-20 w-full max-w-7xl mx-auto">

            {/* Left Side: Main Title & Intro (Centered) */}
            <div className="mb-16 md:mb-0 w-full md:w-auto z-20 pointer-events-auto select-text">
              {/* <h1 className="text-4xl md:text-6xl font-bold text-saka-ink mix-blend-color-burn opacity-80 mb-4 tracking-wide leading-tight">
                Yujun <br /> Pan
              </h1> */}
              <p className="text-sm md:text-base text-saka-ink opacity-60 font-serif tracking-widest mb-12">
                如果不写代码，我就是一个普通的思考者。<br />
                这里是我与平庸对抗的失败记录。<br />
                归档了我所有的非生产环境产出。
              </p>
            </div>

            {/* Left Bottom: Slogan (Absolute) */}
            <div className="absolute left-8 bottom-32 md:left-20 w-full md:w-auto z-20 pointer-events-auto select-text">
              <h2 className="text-2xl md:text-3xl text-saka-ink opacity-60 font-light tracking-widest mix-blend-multiply">
                因爲我的骨頭也是藍的。
              </h2>
              <div className="mt-8 h-px w-24 bg-saka-ink opacity-40"></div>
              <p className="mt-6 text-sm md:text-base text-saka-ink opacity-70 max-w-xs leading-loose font-serif italic">
                "Because my bones are blue too."
              </p>
            </div>

            {/* Right Side: The List (Interactive) */}
            <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-6 text-saka-highlight mix-blend-overlay md:pr-0 md:mr-0 md:absolute md:right-8 md:top-1/2 md:-translate-y-1/2">
              {playList.map((item, index) => (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="group cursor-pointer relative w-full md:w-auto text-left md:text-right"
                >
                  {/* 
                   Typography styling to match the reference:
                   Serif, enclosed in brackets like the reference image 《Title》 
                */}
                  <div className={`
                    relative transition-all duration-700 ease-out
                    flex flex-col md:items-end
                    ${hoveredItem === item.id ? 'translate-x-2 md:-translate-x-4 opacity-100' : 'opacity-70'}
                `}>
                    <span className="text-lg md:text-2xl font-light tracking-wider whitespace-nowrap">
                      《{item.title}》
                    </span>

                    {/* Subtle reveal of original title on hover */}
                    <span className={`
                    text-xs md:text-sm tracking-widest font-light mt-1 text-saka-highlight/80
                    transition-all duration-500
                    ${hoveredItem === item.id ? 'max-h-10 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2'}
                  `}>
                      {item.originalTitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </main>
        )}

        {/* Footer / Copyright */}
        <footer className="absolute bottom-6 left-8 right-8 flex justify-between items-center text-[10px] md:text-xs text-saka-highlight/40 tracking-[0.2em] font-sans mix-blend-overlay uppercase">
          <span>© {new Date().getFullYear()} Yujun. All Rights Reserved.</span>
          <div className="flex space-x-4">
            <a href="mailto:wushixuan238@gmail.com" className="hover:text-saka-highlight/70 transition-colors duration-300" title="Email">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
              </svg>
            </a>
            <a href="https://github.com/wushixuan238" target="_blank" rel="noopener noreferrer" className="hover:text-saka-highlight/70 transition-colors duration-300" title="GitHub">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.165 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="https://www.linkedin.com/in/yujun-pan-094756364/" target="_blank" rel="noopener noreferrer" className="hover:text-saka-highlight/70 transition-colors duration-300" title="LinkedIn">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}