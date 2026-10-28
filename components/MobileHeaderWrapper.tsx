'use client';

import { MobileDashboardHeader } from './MobileDashboardHeader';
import { useCallback } from 'react';

interface MobileHeaderWrapperProps {
  cafeInfo: any;
}

export function MobileHeaderWrapper({ cafeInfo }: MobileHeaderWrapperProps) {
  const handleOpenInfo = useCallback(() => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById('routing');
    if (el) {
      const headerOffset = window.innerWidth < 768 ? 116 : 76;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' });
    }
  }, []);

  return <MobileDashboardHeader cafeInfo={cafeInfo} onOpenInfo={handleOpenInfo} />;
}
