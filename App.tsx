import React, { useState, useEffect } from 'react';
import { OrganicBackground } from './components/OrganicBackground';
import { NoiseOverlay } from './components/NoiseOverlay';
import { Navigation } from './components/Navigation';
import { About } from './components/About';
import { Blog } from './components/Blog';
import { PlaylistItem } from './types';

// Mock Data representing the "List" style from the reference image
const playList: PlaylistItem[] = [
  { id: '1', title: 'Merry Christmas Mr. Lawrence', originalTitle: '戦場のメリークリスマス', duration: '04:38' },
  { id: '2', title: 'Energy Flow', originalTitle: 'エナジー・フロー', duration: '04:34' },
  { id: '3', title: 'Aqua', originalTitle: 'アクア', duration: '04:20' },
  { id: '4', title: 'Blu', originalTitle: 'ブルー', duration: '05:03' },
  { id: '5', title: 'Andata', originalTitle: 'アンダタ', duration: '04:40' },
  { id: '6', title: 'Tong Poo', originalTitle: '東風', duration: '05:15' },
];

export type PageType = 'home' | 'blog' | 'about';

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [isScrolling, setIsScrolling] = useState(false);

  const pages: PageType[] = ['home', 'blog', 'about'];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isScrolling) return;
      
      const currentIndex = pages.indexOf(currentPage);
      let nextIndex = currentIndex;

      if (e.deltaY > 0) {
        // Scroll down - next page
        nextIndex = Math.min(currentIndex + 1, pages.length - 1);
      } else if (e.deltaY < 0) {
        // Scroll up - previous page
        nextIndex = Math.max(currentIndex - 1, 0);
      }

      if (nextIndex !== currentIndex) {
        setIsScrolling(true);
        setCurrentPage(pages[nextIndex]);
        setTimeout(() => setIsScrolling(false), 800);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentPage, isScrolling]);

  return (
    <div className={`relative min-h-screen w-full font-serif text-saka-highlight overflow-hidden transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>

      {/* 1. Background Layer: Gradients */}
      <OrganicBackground />

      {/* 2. Texture Layer: Noise/Grain (The Soul) */}
      <NoiseOverlay />

      {/* 3. Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">

        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />

        {currentPage === 'about' ? (
          <About />
        ) : currentPage === 'blog' ? (
          <Blog />
        ) : (
          <main className="flex-grow flex flex-col md:flex-row items-end justify-between px-8 md:px-20 pb-32 pt-20 w-full max-w-7xl mx-auto">

          {/* Left Side: Main Title (Japanese/Chinese Style) */}
          <div className="mb-16 md:mb-0 w-full md:w-auto select-none pointer-events-none">
            <h1 className="text-4xl md:text-6xl font-bold text-saka-ink mix-blend-color-burn opacity-80 mb-4 tracking-wide leading-tight">
              {/* Yujun <br /> Pan */}
            </h1>
            <h2 className="text-2xl md:text-3xl text-saka-ink opacity-60 font-light tracking-widest mix-blend-multiply">
              因爲我的骨頭也是藍的。
            </h2>
            <div className="mt-8 h-px w-24 bg-saka-ink opacity-40"></div>
            <p className="mt-6 text-sm md:text-base text-saka-ink opacity-70 max-w-xs leading-loose font-serif italic">
              "Because my bones are blue too."
            </p>
          </div>

          {/* Right Side: The List (Interactive) */}
          <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-6 text-saka-highlight mix-blend-overlay md:pr-0 md:mr-0 md:absolute md:right-8 md:bottom-32">
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
        <footer className="absolute bottom-6 left-8 text-[10px] md:text-xs text-saka-highlight/40 tracking-[0.2em] font-sans mix-blend-overlay uppercase">
          © {new Date().getFullYear()} Yujun. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}