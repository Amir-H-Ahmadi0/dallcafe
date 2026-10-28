'use client';

import React from 'react';
import { DalLogo } from './DalLogo';
import { useTheme } from './ThemeContext';
import { CafeInfo } from '@/types/menu';
import { Instagram, Phone } from 'lucide-react';
import Link from 'next/link';
import { getPhoneLink, getPhoneNumbers } from '@/lib/phone-numbers';

interface FooterProps {
  cafeInfo: CafeInfo;
}

export function Footer({ cafeInfo }: FooterProps) {
  const { theme } = useTheme();
  const isEmerald = theme === 'new-emerald';

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 78;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      window.history.pushState(null, '', `#${targetId}`);
    }
  };

  return (
    <footer className={`border-t pt-10 pb-10 sm:pb-10 text-xs transition-colors duration-300 bg-[#051A15] border-[#1A443A] text-[#A8BCB5]`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        <div className={`flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#1A443A]`}>
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 shrink-0 aspect-square flex items-center justify-center">
              <DalLogo 
                size="sm" 
                showText={false} 
                circular={true}
                themeVariant={theme} 
                className="w-full h-full"
              />
            </div>
            <div>
              <div className="text-base font-bold text-[#F6F4EE]">
                کافه دال
              </div>
              <div className={`text-[11px] font-medium ${
                isEmerald ? 'text-[#DFBA87]' : 'text-[#C48B4C]'
              }`}>
                {cafeInfo.slogan} · {cafeInfo.sloganEn}
              </div>
            </div>
          </div>

          {/* Quick Footer Navigation Links with Smooth Scroll */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium">
            <a 
              href="#menu" 
              onClick={(e) => handleSmoothScroll(e, 'menu')}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
            >
              منوی آنلاین
            </a>
            <a 
              href="#about" 
              onClick={(e) => handleSmoothScroll(e, 'about')}
              className="px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
            >
              درباره دال
            </a>
            <a 
              href="#routing" 
              onClick={(e) => handleSmoothScroll(e, 'routing')}
              className="px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
            >
              مسیریابی و آدرس
            </a>
            <a 
              href="#contact" 
              onClick={(e) => handleSmoothScroll(e, 'contact')}
              className="px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer"
            >
              تماس و ساعت کاری
            </a>
          </div>
        </div>

        {/* Social Media & Customer Connection Row */}
        <div className={`py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-b border-[#1A443A]/70`}>
          <div className="flex items-center gap-2 text-right">
            <span className={`text-[11px] sm:text-xs font-bold ${isEmerald ? 'text-[#DFBA87]' : 'text-[#C48B4C]'}`}>
              شبکه‌های اجتماعی و ارتباط مستقیم:
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#A8BCB5]/75 hidden sm:inline">
              پاسخگویی، اعلام منوی روز و همراهی با شما
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            {/* Instagram */}
            {cafeInfo.instagram && (
              <a
                href={`https://instagram.com/${cafeInfo.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-bold transition-all duration-200 active:scale-95 ${
                  isEmerald
                    ? 'bg-[#08221D] hover:bg-[#DFBA87] text-[#CAD6D2] hover:text-[#1E170F] border-[#1E483D] hover:border-[#DFBA87]'
                    : 'bg-[#10221E] hover:bg-[#C48B4C] text-[#CCD7D2] hover:text-[#1B1107] border-[#2C443E] hover:border-[#C48B4C]'
                }`}
                title="صفحه رسمی اینستاگرام کافه دال"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>اینستاگرام</span>
                <span className="font-mono text-[10px] opacity-75 dir-ltr">@{cafeInfo.instagram.replace('@', '')}</span>
              </a>
            )}

            {/* Phone */}
            {getPhoneNumbers(cafeInfo.phone).map((phone) => (
              <a
                key={phone}
                href={getPhoneLink(phone)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-200 active:scale-95 ${
                  isEmerald
                    ? 'bg-[#08221D] hover:bg-[#0E2F26] text-[#CAD6D2] hover:text-white border-[#1E483D] hover:border-[#DFBA87]'
                    : 'bg-[#10221E] hover:bg-[#162E28] text-[#CCD7D2] hover:text-white border-[#2C443E] hover:border-[#C48B4C]'
                }`}
                title="تماس تلفنی با کافه دال"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{phone}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A8BCB5]/75">
          <div className="text-center sm:text-right">
            تمامی حقوق مادی و معنوی برای «کافه دال» محفوظ است{' '}
            <Link href="/admin" className="hover:text-[#DFBA87] transition-colors" title="ورود مدیریت">
              © 1405 - 1406
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span>جایی برای مکث · اصفهان</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
