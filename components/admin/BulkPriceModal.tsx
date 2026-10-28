'use client';

import React, { useState, useMemo } from 'react';
import { MenuItem, Category } from '@/types/menu';
import {
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Percent,
} from 'lucide-react';

interface BulkPriceModalProps {
  isOpen: boolean;
  items: MenuItem[];
  categories: Category[];
  onClose: () => void;
  onApply: (updatedItems: MenuItem[]) => void;
}

export function BulkPriceModal({
  isOpen,
  items,
  categories,
  onClose,
  onApply,
}: BulkPriceModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [direction, setDirection] = useState<'increase' | 'decrease'>('increase');
  const [percent, setPercent] = useState<number>(10);
  const [showConfirm, setShowConfirm] = useState(false);

  // Filter affected items
  const affectedItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter((item) => item.categoryId === selectedCategory);
  }, [items, selectedCategory]);

  // Calculate new prices (pure percentage, no rounding)
  const previewItems = useMemo(() => {
    return affectedItems.map((item) => {
      const multiplier = direction === 'increase' ? 1 + percent / 100 : 1 - percent / 100;
      const rawNewPrice = Math.max(0, Math.round(item.price * multiplier));

      return {
        ...item,
        originalPrice: item.price,
        newPrice: rawNewPrice,
        diff: rawNewPrice - item.price,
      };
    });
  }, [affectedItems, direction, percent]);

  // Statistics
  const avgOldPrice = useMemo(() => {
    if (previewItems.length === 0) return 0;
    const sum = previewItems.reduce((acc, curr) => acc + curr.originalPrice, 0);
    return Math.round(sum / previewItems.length);
  }, [previewItems]);

  const avgNewPrice = useMemo(() => {
    if (previewItems.length === 0) return 0;
    const sum = previewItems.reduce((acc, curr) => acc + curr.newPrice, 0);
    return Math.round(sum / previewItems.length);
  }, [previewItems]);

  if (!isOpen) return null;

  const handleConfirmApply = () => {
    const updatedMap = new Map<string, number>();
    previewItems.forEach((p) => {
      updatedMap.set(p.id, p.newPrice);
    });

    const newAllItems = items.map((item) => {
      if (updatedMap.has(item.id)) {
        return {
          ...item,
          price: updatedMap.get(item.id)!,
        };
      }
      return item;
    });

    onApply(newAllItems);
    setShowConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div
        className="w-full max-w-2xl bg-[#08221D] border border-[#1A443A] rounded-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#1A443A] bg-[#051A15] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#F6F4EE] leading-tight">
                ویرایش گروهی قیمت‌ها
              </h3>
              <p className="text-[10px] text-[#A8BCB5]">
                افزایش یا کاهش همزمان قیمت‌ها به صورت درصدی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#A8BCB5] hover:text-white transition-all shrink-0 cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {/* Card 1: Scope & Direction in clean 2-column row */}
          <div className="bg-[#051A15] p-3 sm:p-3.5 rounded-xl border border-[#1A443A] space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Scope Selection */}
              <div>
                <label className="text-[11px] font-semibold text-[#DFBA87] flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>دسته‌بندی هدف</span>
                  </span>
                  <span className="text-[10px] text-[#A8BCB5]">
                    {affectedItems.length} محصول
                  </span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2.5 py-1.5 text-xs text-[#F6F4EE] outline-hidden cursor-pointer"
                >
                  <option value="all">تمام محصولات منو ({items.length})</option>
                  {categories.map((cat) => {
                    const count = items.filter((i) => i.categoryId === cat.id).length;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.nameFa} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Direction (Increase / Decrease) */}
              <div>
                <label className="text-[11px] font-semibold text-[#DFBA87] flex items-center gap-1 mb-1">
                  <Percent className="w-3.5 h-3.5" />
                  <span>جهت تغییر قیمت</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection('increase')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      direction === 'increase'
                        ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500 shadow-xs'
                        : 'bg-[#08221D] text-[#A8BCB5] border-[#1A443A]'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>افزایش (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirection('decrease')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      direction === 'decrease'
                        ? 'bg-rose-600/30 text-rose-200 border-rose-500 shadow-xs'
                        : 'bg-[#08221D] text-[#A8BCB5] border-[#1A443A]'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    <span>کاهش (-)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Percentage Presets & Slider */}
            <div className="pt-1 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#DFBA87] font-semibold">درصد تغییر:</span>
                <span className="font-mono font-bold text-xs text-[#DFBA87] bg-[#08221D] px-2 py-0.5 rounded border border-[#1A443A]">
                  {direction === 'increase' ? '+' : '-'}{percent}٪
                </span>
              </div>

              {/* Comfortable 4-column quick presets */}
              <div className="grid grid-cols-4 gap-1.5">
                {[5, 10, 15, 20].map((val) => (
                  <button
                    type="button"
                    key={val}
                    onClick={() => setPercent(val)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      percent === val
                        ? 'bg-[#DFBA87] text-[#1E170F] shadow-xs'
                        : 'bg-[#08221D] text-[#A8BCB5] border border-[#1A443A] hover:border-[#DFBA87]/40'
                    }`}
                  >
                    {val}٪
                  </button>
                ))}
              </div>

              {/* Slider & Input */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={percent}
                  onChange={(e) => setPercent(Number(e.target.value))}
                  className="flex-1 accent-[#DFBA87] cursor-pointer"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={percent}
                  onChange={(e) => setPercent(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-14 bg-[#08221D] border border-[#1A443A] rounded-lg px-2 py-1 text-xs text-center font-bold text-[#DFBA87] outline-hidden font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Stat Summary Banner */}
          <div className="grid grid-cols-3 gap-2 bg-[#051A15] p-2.5 rounded-xl border border-[#1A443A] text-center">
            <div className="p-1.5 rounded-lg bg-[#08221D]">
              <span className="text-[10px] text-[#A8BCB5] block">تعداد محصولات</span>
              <span className="text-xs font-bold text-[#F6F4EE] font-mono mt-0.5 block">
                {previewItems.length}
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-[#08221D]">
              <span className="text-[10px] text-[#A8BCB5] block">میانگین فعلی</span>
              <span className="text-xs font-bold text-[#A8BCB5] font-mono mt-0.5 block line-through">
                {avgOldPrice.toLocaleString('fa-IR')} ت
              </span>
            </div>

            <div className="p-1.5 rounded-lg bg-[#08221D] border border-[#DFBA87]/30">
              <span className="text-[10px] text-[#DFBA87] block">میانگین جدید</span>
              <span className="text-xs font-bold text-[#DFBA87] font-mono mt-0.5 block">
                {avgNewPrice.toLocaleString('fa-IR')} ت
              </span>
            </div>
          </div>

          {/* Card 3: Preview List */}
          <div className="bg-[#051A15] border border-[#1A443A] rounded-xl overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-[#1A443A] bg-[#061C17] flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#DFBA87]">پیش‌نمایش تغییر قیمت محصولات</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                direction === 'increase' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
              }`}>
                {direction === 'increase' ? '+' : '-'}{percent}٪
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto divide-y divide-white/5 p-1">
              {previewItems.map((p) => (
                <div
                  key={p.id}
                  className="p-2 sm:p-2.5 flex items-center justify-between gap-2 hover:bg-white/2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-[#F6F4EE] block text-xs truncate">
                      {p.titleFa}
                    </span>
                    <span className="text-[10px] text-[#7D9990] line-through font-mono">
                      {p.originalPrice.toLocaleString('fa-IR')} ت
                    </span>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="font-bold text-[#DFBA87] font-mono text-xs block">
                      {p.newPrice.toLocaleString('fa-IR')} ت
                    </span>
                    <span
                      className={`text-[10px] font-mono block ${
                        p.diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {p.diff > 0 ? `+${p.diff.toLocaleString('fa-IR')}` : p.diff.toLocaleString('fa-IR')} ت
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#1A443A] bg-[#051A15] shrink-0">
          {!showConfirm ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="flex-1 bg-linear-to-r from-[#DFBA87] to-[#C99C63] hover:from-[#E5C79A] text-[#1E170F] font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 active:scale-98 transition-all cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ذخیره قیمت‌ها</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="bg-white/5 hover:bg-white/10 text-[#A8BCB5] hover:text-white py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                انصراف
              </button>
            </div>
          ) : (
            <div className="space-y-2 animate-fadeIn">
              <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  تغییر قیمت <strong>{previewItems.length}</strong> محصول به میزان <strong>{percent}٪</strong> اعمال شود؟
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تایید و ذخیره</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-[#A8BCB5] cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
