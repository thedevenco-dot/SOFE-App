import React, { createContext, useContext, useMemo, useState } from 'react';
import { palette, radius, spacing, ThemeName, themes } from '@sofe/shared';

export type ThemeTokens = (typeof themes)[ThemeName];

interface ThemeContextValue {
  themeName: ThemeName;
  theme: ThemeTokens;
  colors: ThemeTokens;
  palette: typeof palette;
  spacing: typeof spacing;
  radius: typeof radius;
  isDark: boolean;
  setThemeName: (name: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  initialTheme?: ThemeName;
  children: React.ReactNode;
}

export function ThemeProvider({ initialTheme = 'dark', children }: ThemeProviderProps) {
  const [themeName, setThemeName] = useState<ThemeName>(initialTheme);

  const value = useMemo<ThemeContextValue>(() => {
    const currentTheme = themes[themeName];
    return {
      themeName,
      theme: currentTheme,
      colors: currentTheme,
      palette,
      spacing,
      radius,
      isDark: themeName === 'dark',
      setThemeName,
      toggleTheme: () => setThemeName((prev) => (prev === 'dark' ? 'light' : 'dark')),
    };
  }, [themeName]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
