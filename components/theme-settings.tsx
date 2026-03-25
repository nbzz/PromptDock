'use client';

import { useEffect, useRef } from 'react';
import { useTheme, type Theme } from './theme-provider';

const THEME_OPTIONS: { value: Theme; label: string; icon: string; desc: string }[] = [
  { value: 'light', label: '浅色', icon: '☀️', desc: '始终使用浅色主题' },
  { value: 'dark', label: '深色', icon: '🌙', desc: '始终使用深色主题' },
  { value: 'system', label: '跟随系统', icon: '💻', desc: '自动跟随系统深色/浅色模式' }
];

interface ThemeSettingsProps {
  onClose: () => void;
}

export function ThemeSettings({ onClose }: ThemeSettingsProps) {
  const { theme, setTheme } = useTheme();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  function handleSelect(value: Theme) {
    setTheme(value);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        ref={panelRef}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-soft dark:border-dark-border dark:bg-dark-slate"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-dark-ink">
            主题设置
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="关闭"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                theme === option.value
                  ? 'border-accent bg-teal-50 dark:border-dark-accent dark:bg-dark-accent/10'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-dark-border dark:bg-dark-slate hover:dark:bg-slate-800/50'
              }`}
            >
              <span className="text-xl">{option.icon}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  theme === option.value
                    ? 'text-teal-900 dark:text-dark-accent'
                    : 'text-slate-900 dark:text-dark-ink'
                }`}>
                  {option.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{option.desc}</p>
              </div>
              {theme === option.value && (
                <svg className="text-accent dark:text-dark-accent" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
