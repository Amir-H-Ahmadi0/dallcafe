'use client';

import { MobileBottomNav, NavSection } from './MobileBottomNav';
import { useCallback } from 'react';

export function BottomNavWrapper() {
  const handleSectionSelect = useCallback((section: NavSection) => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(section);
    if (el) {
      const headerOffset = window.innerWidth < 768 ? 116 : 76;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
    }
  }, []);

  return <MobileBottomNav onSelectSection={handleSectionSelect} />;
}
