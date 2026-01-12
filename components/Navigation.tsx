import React from 'react';
import { NavItem } from '../types';
import { PageType } from '../App';

const links: NavItem[] = [
  { label: 'Home', href: 'home' },
  { label: 'Now', href: 'now' },
  { label: 'Blog', href: 'blog' },
  { label: 'About', href: 'about' },
];

interface NavigationProps {
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  snowEnabled: boolean;
  onToggleSnow: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate, snowEnabled, onToggleSnow }) => {
  return (
    <nav className="fixed top-0 left-0 w-full p-8 md:p-12 z-40 flex justify-between items-start text-saka-ink">
      <div
        onClick={() => onNavigate('home')}
        className="text-xl font-medium tracking-widest uppercase opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
      >
        Yujun.
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-12 text-sm font-light tracking-widest">
        {/* Snow Toggle */}
        <button
          onClick={onToggleSnow}
          className={`opacity-70 hover:opacity-100 transition-opacity ${snowEnabled ? 'text-saka-ink' : 'text-saka-ink/50'}`}
          title={snowEnabled ? "Stop Snow" : "Let it Snow"}
        >
          ❄
        </button>

        {links.map((link) => (
          <a
            key={link.label}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(link.href as PageType);
            }}
            className={`group relative overflow-hidden pb-1 cursor-pointer ${currentPage === link.href ? 'opacity-100' : 'opacity-70'}`}
          >
            <span className="block transition-transform duration-500 group-hover:-translate-y-full">
              {link.label}
            </span>
            <span className="absolute top-0 left-0 block translate-y-full transition-transform duration-500 group-hover:translate-y-0 italic">
              {link.label}
            </span>
            <span className={`absolute bottom-0 left-0 h-[1px] w-full origin-right bg-current transition-transform duration-500 ${currentPage === link.href ? 'scale-x-100' : 'scale-x-0 group-hover:origin-left group-hover:scale-x-100'}`} />
          </a>
        ))}
      </div>
    </nav>
  );
};