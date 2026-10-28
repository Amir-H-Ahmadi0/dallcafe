'use client';

import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
  theme: 'new-emerald';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'new-emerald',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'new-emerald');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'new-emerald' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
