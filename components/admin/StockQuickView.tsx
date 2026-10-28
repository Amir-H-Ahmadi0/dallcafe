'use client';

import React, { useState, useMemo } from 'react';
import { MenuItem, Category } from '@/types/menu';
import {
  Search,
  CheckCircle2,
  XCircle,
  PackageCheck,
  PackageX,
  Filter,
} from 'lucide-react';
import Image from 'next/image';
import { DalLogo } from '@/components/DalLogo';

interface StockQuickViewProps {
  items: MenuItem[];
  categories: Category[];
  onToggleAvailability: (itemId: string, newStatus: boolean) => void;
  onBatchToggleAvailability: (itemIds: string[], newStatus: boolean) => void;
}

export function StockQuickView({
  items,
  categories,
  onToggleAvailability,
  onBatchToggleAvailability,
}: StockQuickViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search.trim() ||
        item.titleFa.toLowerCase().includes(search.toLowerCase()) ||
        item.titleEn.toLowerCase().includes(search.toLowerCase());

      const matchCat = selectedCategory === 'all' || item.categoryId === selectedCategory;

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'available' && item.isAvailable) ||
        (statusFilter === 'unavailable' && !item.isAvailable);

      return matchSearch && matchCat && matchStatus;
    });
  }, [items, search, selectedCategory, statusFilter]);

  const totalAvailable = useMemo(() => items.filter((i) => i.isAvailable).length, [items]);
  const totalUnavailable = items.length - totalAvailable;

  return (
    <div className="space-y-3">
      {/* Compact Overview Stats Bar */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'available' ? 'all' : 'available')}
          className={`p-2.5 rounded-xl border text-right flex items-center justify-between transition-all ${
            statusFilter === 'available'
              ? 'bg-emerald-950/70 border-emerald-400 ring-1 ring-emerald-400'
              : 'bg-[#08221D] border-[#1A443A] hover:border-emerald-500/40'
          }`}
        >
          <div>
            <span className="block text-[10px] text-[#A8BCB5]">آیتم‌های موجود</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {totalAvailable.toLocaleString('fa-IR')} <span className="text-[10px] font-sans">محصول</span>
            </span>
          </div>
          <PackageCheck className="w-5 h-5 text-emerald-400" />
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'unavailable' ? 'all' : 'unavailable')}
          className={`p-2.5 rounded-xl border text-right flex items-center justify-between transition-all ${
            statusFilter === 'unavailable'
              ? 'bg-rose-950/70 border-rose-400 ring-1 ring-rose-400'
              : 'bg-[#08221D] border-[#1A443A] hover:border-rose-500/40'
          }`}
        >
          <div>
            <span className="block text-[10px] text-[#A8BCB5]">اتمام موجودی</span>
            <span className="text-base font-black text-rose-400 font-mono">
              {totalUnavailable.toLocaleString('fa-IR')} <span className="text-[10px] font-sans">محصول</span>
            </span>
          </div>
          <PackageX className="w-5 h-5 text-rose-400" />
        </button>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی سریع محصول برای تغییر موجودی..."
            className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-xl pr-9 pl-3 py-2 text-xs text-[#F6F4EE] placeholder:text-[#527067] outline-hidden"
          />
          <Search className="w-3.5 h-3.5 text-[#7D9990] absolute right-3 top-2.5" />
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#DFBA87] text-[#1E170F]'
                : 'bg-[#08221D] text-[#A8BCB5] border border-[#1A443A]'
            }`}
          >
            همه ({items.length})
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.categoryId === cat.id).length;
            return (
              <button
                type="button"
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#DFBA87] text-[#1E170F]'
                    : 'bg-[#08221D] text-[#A8BCB5] border border-[#1A443A]'
                }`}
              >
                {cat.nameFa} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch Operations Bar */}
      {filteredItems.length > 0 && (
        <div className="flex items-center justify-between text-[11px] bg-[#051A15] p-2 rounded-xl border border-[#1A443A]">
          <span className="text-[#A8BCB5] flex items-center gap-1">
            <Filter className="w-3 h-3 text-[#DFBA87]" />
            نمایش {filteredItems.length} محصول
          </span>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                const ids = filteredItems.map((i) => i.id);
                onBatchToggleAvailability(ids, true);
              }}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30"
            >
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>موجود کردن همه</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const ids = filteredItems.map((i) => i.id);
                onBatchToggleAvailability(ids, false);
              }}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30"
            >
              <XCircle className="w-2.5 h-2.5" />
              <span>ناموجود کردن همه</span>
            </button>
          </div>
        </div>
      )}

      {/* Stock Items List */}
      <div className="space-y-1.5">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center bg-[#08221D] border border-[#1A443A] rounded-xl">
            <p className="text-xs text-[#A8BCB5]">محصولی با این مشخصات یافت نشد.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const cat = categories.find((c) => c.id === item.categoryId);
            return (
              <div
                key={item.id}
                className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  item.isAvailable
                    ? 'bg-[#08221D] border-[#1A443A] hover:border-[#DFBA87]/40'
                    : 'bg-[#150a0a] border-rose-900/60'
                }`}
              >
                {/* Product Thumbnail & Details */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/40 shrink-0 border border-white/10">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.titleFa}
                        fill
                        className="object-cover"
                        sizes="48px"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-1.5">
                        <DalLogo size="sm" showText={false} circular={true} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#F6F4EE] truncate leading-snug">
                      {item.titleFa}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[#DFBA87] font-semibold bg-[#DFBA87]/10 px-1.5 py-0.5 rounded-md border border-[#DFBA87]/20">
                        {cat?.nameFa || 'دسته‌بندی'}
                      </span>
                      <span className="text-xs text-[#A8BCB5] font-mono">
                        {item.price.toLocaleString('fa-IR')} ت
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sleek Toggle Button */}
                <button
                  type="button"
                  onClick={() => onToggleAvailability(item.id, !item.isAvailable)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 active:scale-95 cursor-pointer shadow-sm ${
                    item.isAvailable
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-900/90 hover:bg-rose-800 text-rose-200 border border-rose-500/40'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.isAvailable ? 'bg-white animate-pulse' : 'bg-rose-300'
                    }`}
                  />
                  <span>{item.isAvailable ? 'موجود' : 'اتمام موجودی'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
