'use client';

import React from 'react';
import { FlavorProfile } from '@/types/menu';
import { Zap, Droplets, Sparkles, Coffee, Heart } from 'lucide-react';
import { useTheme } from './ThemeContext';

export const RELEVANT_FLAVOR_CATEGORIES = [
  'espresso',
  'hot-bar',
  'tea',
  'cold-bar',
  'brew',
  'specialty',
  'tea-herbal',
];

export function isFlavorProfileCategory(categoryId?: string): boolean {
  if (!categoryId) return false;
  return RELEVANT_FLAVOR_CATEGORIES.includes(categoryId.toLowerCase());
}

interface FlavorProfileBarProps {
  profile?: FlavorProfile;
  compact?: boolean;
}

interface MetricConfig {
  key: keyof FlavorProfile;
  labelFa: string;
  labelEn: string;
  icon: React.ComponentType<{ className?: string }>;
  getDescriptor: (val: number) => string;
}

const METRICS: MetricConfig[] = [
  {
    key: 'caffeine',
    labelFa: 'میزان کافئین',
    labelEn: 'Caffeine',
    icon: Zap,
    getDescriptor: (v) => {
      if (v <= 0) return 'بدون کافئین';
      if (v <= 2) return 'ملایم';
      if (v === 3) return 'متوسط';
      if (v === 4) return 'بالا';
      return 'بسیار پرانرژی';
    },
  },
  {
    key: 'body',
    labelFa: 'بافت و غلظت',
    labelEn: 'Body & Texture',
    icon: Droplets,
    getDescriptor: (v) => {
      if (v <= 1) return 'سبک و زلال';
      if (v <= 2) return 'روان و سبک';
      if (v === 3) return 'متوسط و یکنواخت';
      if (v === 4) return 'غلیظ و سنگین';
      return 'بسیار متراکم و مخملی';
    },
  },
  {
    key: 'acidity',
    labelFa: 'اسیدیته و طراوت',
    labelEn: 'Acidity',
    icon: Sparkles,
    getDescriptor: (v) => {
      if (v <= 1) return 'بسیار کم و لطیف';
      if (v <= 2) return 'کم‌اسید و شکلاتی';
      if (v === 3) return 'متعادل و مرکباتی';
      if (v === 4) return 'زنده و میوه‌ای';
      return 'طعم‌یاد شفاف میوه‌ای';
    },
  },
  {
    key: 'bitterness',
    labelFa: 'تلخی اصیل',
    labelEn: 'Bitterness',
    icon: Coffee,
    getDescriptor: (v) => {
      if (v <= 0) return 'نامحسوس';
      if (v <= 2) return 'ملایم و شیرین';
      if (v === 3) return 'شکلات تلخ ملایم';
      if (v === 4) return 'تلخ بارز و عمیق';
      return 'تلخی غلیظ و ماندگار';
    },
  },
  {
    key: 'sweetness',
    labelFa: 'شیرینی ذاتی',
    labelEn: 'Sweetness',
    icon: Heart,
    getDescriptor: (v) => {
      if (v <= 0) return 'خشک و بدون شیرینی';
      if (v <= 2) return 'شیرینی طبیعی ملایم';
      if (v === 3) return 'عسلی و متوازن';
      if (v === 4) return 'شیرین و کاراملی';
      return 'شیرین و دسرگونه';
    },
  },
];

export function FlavorProfileBar({ profile, compact = false }: FlavorProfileBarProps) {
  const { theme } = useTheme();
  const isEmerald = theme === 'new-emerald';

  if (!profile) return null;

  // Check if at least one metric is defined
  const hasValues = METRICS.some((m) => profile[m.key] !== undefined && profile[m.key] !== null);
  if (!hasValues) return null;

  const activeColor = 'bg-[#DFBA87]';
  const activeTextColor = isEmerald ? 'text-accent' : 'text-[#DBA366]';
  const inactiveDot = 'bg-[#F6F4EE]/25';

  const toPersianDigits = (n: number) =>
    n.toString().replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  if (compact) {
    // Compact preview for product card: show caffeine and body
    const caffeineVal = profile.caffeine ?? 0;
    const bodyVal = profile.body ?? 0;

    return (
      <div className="flex items-center gap-2.5 text-caption-sm text-subtle mt-1 select-none">
        {/* Caffeine compact */}
        <div className="flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-amber-400/90" />
          <span className="font-medium text-caption-sm text-main">کافئین:</span>
          <div
            className="flex items-center gap-1"
            dir="ltr"
            role="progressbar"
            aria-label="میزان کافئین"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={caffeineVal}
          >
            {[1, 2, 3, 4, 5].map((dot) => (
              <span
                key={dot}
                aria-hidden="true"
                className={`w-2.5 h-2.5 rounded-full border border-white/25 transition-colors ${
                  dot > 5 - caffeineVal ? activeColor : inactiveDot
                }`}
              />
            ))}
            <span className={`text-caption font-bold ${activeTextColor}`}>
              {toPersianDigits(caffeineVal)}/۵
            </span>
          </div>
        </div>

        {/* Separator dot */}
        <span className="text-white/20">·</span>

        {/* Body compact */}
        <div className="flex items-center gap-1">
          <Droplets className="w-2.5 h-2.5 text-accent/90" />
          <span className="font-medium text-caption-sm text-main">غلظت:</span>
          <div
            className="flex items-center gap-1"
            dir="ltr"
            role="progressbar"
            aria-label="غلظت"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={bodyVal}
          >
            {[1, 2, 3, 4, 5].map((dot) => (
              <span
                key={dot}
                aria-hidden="true"
                className={`w-2.5 h-2.5 rounded-full border border-white/25 transition-colors ${
                  dot > 5 - bodyVal ? activeColor : inactiveDot
                }`}
              />
            ))}
            <span className={`text-caption font-bold ${activeTextColor}`}>
              {toPersianDigits(bodyVal)}/۵
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full detailed flavor profile for ItemDetailModal
  return (
    <div 
      className={`p-4 rounded-2xl border space-y-3 transition-colors select-none ${
        isEmerald 
          ? 'bg-[#081F19]/90 border-[#1B4B3F]' 
          : 'bg-[#0E2521]/90 border-[#224039]'
      }`}
      dir="rtl"
    >
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          <Sparkles className={`w-3 h-3 ${activeTextColor}`} />
          <span className="text-caption font-black text-main">
            پروفایل طعمی و شاخص‌های تخصصی
          </span>
        </div>
        <span className="text-caption-sm font-mono text-subtle tracking-en">
          Flavor Profile
        </span>
      </div>

      <div className="space-y-2.5 pt-0.5">
        {METRICS.map((metric) => {
          const value = profile[metric.key] ?? 0;
          const Icon = metric.icon;
          const descriptor = metric.getDescriptor(value);

          return (
            <div key={metric.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-body-sm">
                <div className="flex items-center gap-1.5 text-soft">
                  <Icon className="w-3 h-3 text-subtle" />
                  <span className="font-bold">{metric.labelFa}</span>
                  <span className="text-caption-sm text-subtle font-mono tracking-tight hidden sm:inline">
                    ({metric.labelEn})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-caption-sm font-medium text-main">
                    {descriptor}
                  </span>
                  <span className={`text-caption font-bold ${activeTextColor}`}>
                    {toPersianDigits(value)}/۵
                  </span>
                </div>
              </div>

              {/* 5-step Segmented Progress Bar */}
              <div className="grid grid-cols-5 gap-1.5 h-2 w-full bg-[#F6F4EE]/15 p-0.5 rounded-full" dir="ltr">
                {[1, 2, 3, 4, 5].map((step) => {
                  const isFilled = step > 5 - value;
                  return (
                    <div
                      key={step}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFilled ? activeColor : inactiveDot
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
