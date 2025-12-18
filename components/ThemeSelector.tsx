import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

type ThemeType = 'theme-midnight' | 'theme-arctic' | 'theme-emerald' | 'theme-monochrome';

interface ThemeOption {
  id: ThemeType;
  name: string;
  bg: string;
  accent: string;
  isDark: boolean;
}

const themes: ThemeOption[] = [
  { id: 'theme-midnight', name: 'Midnight', bg: '#030712', accent: '#4f46e5', isDark: true },
  { id: 'theme-arctic', name: 'Arctic', bg: '#f8fafc', accent: '#2563eb', isDark: false },
  { id: 'theme-emerald', name: 'Emerald', bg: '#020617', accent: '#10b981', isDark: true },
  { id: 'theme-monochrome', name: 'Mono', bg: '#000000', accent: '#ffffff', isDark: true },
];

export const ThemeSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    return (localStorage.getItem('app_theme_variant') as ThemeType) || 'theme-midnight';
  });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply theme class to body
    themes.forEach(t => document.body.classList.remove(t.id));
    document.body.classList.add(currentTheme);
    
    // Also toggle standard 'dark' class for generic tailwind support
    const active = themes.find(t => t.id === currentTheme);
    if (active?.isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    localStorage.setItem('app_theme_variant', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="fixed top-6 right-6 z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center p-3 bg-white/10 dark:bg-slate-800/80 rounded-full border border-white/20 dark:border-slate-700 hover:scale-105 transition-all shadow-xl backdrop-blur-md overflow-hidden"
      >
        <Icons.Palette size={18} className="text-indigo-400 dark:text-indigo-300 group-hover:rotate-12 transition-transform" />
        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-3 right-0 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 animate-in slide-in-from-top-2 fade-in duration-200 backdrop-blur-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2 mb-1">Select Theme</p>
          <div className="space-y-1">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setCurrentTheme(theme.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group ${
                  currentTheme === theme.id 
                    ? 'bg-indigo-50 dark:bg-indigo-500/10' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div 
                  className="w-8 h-8 rounded-lg shadow-inner border border-black/5 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: theme.bg }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.accent }}
                  ></div>
                </div>
                <div className="flex-1 text-left">
                  <span className={`text-xs font-bold ${
                    currentTheme === theme.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {theme.name}
                  </span>
                </div>
                {currentTheme === theme.id && (
                  <Icons.Confirmed size={14} className="text-indigo-500 mr-1" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};