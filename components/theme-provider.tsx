'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {}
});

export function useTheme() {
  return useContext(ThemeContext);
}

const STORAGE_KEY = 'promptdock-theme';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light';
  }
  return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'light';
}

function storeTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function applyTheme(t: Theme) {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      storeTheme(next);
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
