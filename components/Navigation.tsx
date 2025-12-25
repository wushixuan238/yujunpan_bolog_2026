import React from 'react';
import { NavItem } from '../types';

const links: NavItem[] = [
  { label: 'Home', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'About', href: '#' },
];

export const Navigation: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 w-full p-8 md:p-12 z-40 flex justify-between items-start mix-blend-difference text-saka-highlight">
      <div className="text-xl font-medium tracking-widest uppercase opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
        Yujun.
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-12 text-sm font-light tracking-widest">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="group relative overflow-hidden pb-1"
          >
            <span className="block transition-transform duration-500 group-hover:-translate-y-full">
              {link.label}
            </span>
            <span className="absolute top-0 left-0 block translate-y-full transition-transform duration-500 group-hover:translate-y-0 italic">
              {link.label}
            </span>
            <span className="absolute bottom-0 left-0 h-[1px] w-full origin-right scale-x-0 bg-current transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100" />
          </a>
        ))}
      </div>
    </nav>
  );
};