'use client';

import React from 'react';
import { CafeInfo } from '@/types/menu';
import { DalLogo } from './DalLogo';
import { useTheme } from './ThemeContext';

interface MobileDashboardHeaderProps {
  cafeInfo: CafeInfo;
  onOpenInfo: () => void;
}

export function MobileDashboardHeader({
  cafeInfo,
  onOpenInfo,
}: MobileDashboardHeaderProps) {
  const { theme } = useTheme();
  const isEmerald = theme === 'new-emerald';

  return (
    <header 
      className={`fixed top-0 inset-x-0 z-40 w-full border-b backdrop-blur-xl shadow-md transition-colors select-none bg-[#051A15]/95 border-[#1A443A] wood-slat-subtle`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 40,
      }}
    >
      {/* Top Bar: Cafe Identity + Live Status + Actions */}
      <div className="max-w-4xl mx-auto px-4 pt-3 pb-2.5">
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-full">
          
          {/* Cafe Monogram & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl p-1 bg-black/30 border border-white/10 shrink-0 flex items-center justify-center">
              <DalLogo size="sm" circular={true} showText={false} themeVariant={theme} className="w-full h-full" />
            </div>
            <div className="text-right">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-base font-black text-white leading-tight truncate min-w-0">
                {cafeInfo.name}
              </h1>
              </div>
              <p className="text-[10px] text-[#8EA39C] mt-0.5 truncate min-w-0">
                {cafeInfo.slogan}
              </p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
