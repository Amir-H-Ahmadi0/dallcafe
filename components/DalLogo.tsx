'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from './ThemeContext';

interface DalLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  circular?: boolean;
  lightMode?: boolean;
  themeVariant?: 'new-emerald';
}

export function DalLogo({
  className = '',
  size = 'md',
  showText = true,
  circular = true,
  lightMode = false,
  themeVariant,
}: DalLogoProps) {
  const { theme } = useTheme();
  const activeTheme = themeVariant || theme || 'new-emerald';
  const isNewTheme = activeTheme === 'new-emerald';

  const pixelSizes = {
    xs: 28,
    sm: 40,
    md: 52,
    lg: 84,
    xl: 128,
  };

  const px = pixelSizes[size] || 52;
  const hasExplicitWidth = className.includes('w-');
  const hasExplicitHeight = className.includes('h-');

  const goldPrimary = isNewTheme ? '#DFBA87' : '#C48B4C';
  const circleBgCenter = isNewTheme ? '#0E2F26' : '#142924';
  const circleBgMid = isNewTheme ? '#08221D' : '#0B1E1B';
  const circleBgEdge = isNewTheme ? '#051915' : '#071513';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 aspect-square ${className}`}
      style={{
        width: hasExplicitWidth ? undefined : px,
        height: hasExplicitHeight ? undefined : px,
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    >
      {/* Theme-matched circular background */}
      <div
        className="absolute inset-0 rounded-full overflow-hidden z-0"
        style={{
          background: `radial-gradient(circle at 40% 38%, ${circleBgCenter}, ${circleBgMid} 65%, ${circleBgEdge} 100%)`,
        }}
      />

      {/* Logo image - full resolution, fills circle */}
      <Image
        src="/dall.png"
        alt="لوگوی کافه دال"
        className="w-full h-full object-cover block shrink-0 rounded-full z-10"
        fill
        sizes="(max-width: 640px) 40px, 128px"
        priority
        quality={100}
      />

      {/* Circular border ring on top of image, matching site main accent color */}
      <div
        className="absolute inset-0 rounded-full border-1 z-20"
        style={{
          borderColor: goldPrimary,
        }}
      />
    </div>
  );
}
