'use client';

import React, { useState } from 'react';
import { Category } from '@/types/menu';
import {
  X,
  Check,
  FolderPlus,
  Edit3,
  Trash2,
  Coffee,
  Flame,
  CupSoda,
  Sparkles,
  Utensils,
  Sandwich,
  Cake,
  Cookie,
  Heart,
  Layers,
  Wine,
} from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  category: Category | null;
  existingCategories: Category[];
  onClose: () => void;
  onSave: (category: Category) => void;
  onDelete?: (categoryId: string) => void;
}

const AVAILABLE_ICONS = [
  { id: 'Coffee', label: 'قهوه و بار', icon: Coffee },
  { id: 'Flame', label: 'بار گرم', icon: Flame },
  { id: 'CupSoda', label: 'بار سرد', icon: CupSoda },
  { id: 'Sparkles', label: 'ویژه‌ها', icon: Sparkles },
  { id: 'Utensils', label: 'کیک و قنادی', icon: Utensils },
  { id: 'Sandwich', label: 'صبحانه', icon: Sandwich },
  { id: 'Cake', label: 'دسر', icon: Cake },
  { id: 'Cookie', label: 'کوکی', icon: Cookie },
  { id: 'Layers', label: 'ترکیبی', icon: Layers },
  { id: 'Wine', label: 'ماکتیل', icon: Wine },
  { id: 'Heart', label: 'محبوب', icon: Heart },
];

export function CategoryModal({
  isOpen,
  category,
  existingCategories,
  onClose,
  onSave,
  onDelete,
}: CategoryModalProps) {
  if (!isOpen) return null;

  return (
    <CategoryModalContent
      key={category?.id ?? 'new-category'}
      category={category}
      existingCategories={existingCategories}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}

function CategoryModalContent({
  category,
  existingCategories,
  onClose,
  onSave,
  onDelete,
}: Omit<CategoryModalProps, 'isOpen'>) {
  const [nameFa, setNameFa] = useState(category?.nameFa || '');
  const [nameEn, setNameEn] = useState(category?.nameEn || '');
  const [id, setId] = useState(category?.id || '');
  const [iconName, setIconName] = useState(category?.iconName || 'Coffee');
  const [description, setDescription] = useState(category?.description || '');
  const [order, setOrder] = useState<number>(category?.order ?? existingCategories.length + 1);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFa.trim()) {
      setError('لطفاً نام فارسی دسته‌بندی را وارد کنید.');
      return;
    }

    const safeId = id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') || `cat-${Date.now()}`;

    // Check duplicate ID if new
    if (!category && existingCategories.some((c) => c.id === safeId)) {
      setError('این شناسه لاتین از قبل وجود دارد. لطفاً شناسه دیگری وارد کنید.');
      return;
    }

    onSave({
      id: safeId,
      nameFa: nameFa.trim(),
      nameEn: nameEn.trim() || nameFa.trim(),
      iconName,
      description: description.trim(),
      order: Number(order) || 1,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div
        className="w-full max-w-lg bg-[#08221D] border border-[#1A443A] rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#1A443A] flex items-center justify-between bg-[#051A15] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DFBA87]/15 border border-[#DFBA87]/30 flex items-center justify-center text-[#DFBA87] shrink-0">
              {category ? <Edit3 className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#F6F4EE] leading-tight">
                {category ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی'}
              </h3>
              <p className="text-[10px] text-[#A8BCB5]">
                {category ? category.nameFa : 'تنظیم نام، آیکون و اولویت'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1">
          {error && (
            <div className="p-2.5 bg-rose-950/70 border border-rose-500/40 rounded-xl text-xs text-rose-200">
              {error}
            </div>
          )}

          {/* Names in Row */}
          <div className="bg-[#051A15] p-3 rounded-xl border border-[#1A443A] space-y-2.5">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1">
                  نام فارسی <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={nameFa}
                  onChange={(e) => setNameFa(e.target.value)}
                  placeholder="بار سرد"
                  className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2.5 py-1.5 text-xs text-[#F6F4EE] outline-hidden transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1">
                  نام لاتین
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Cold Bar"
                  className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2.5 py-1.5 text-xs text-[#F6F4EE] outline-hidden text-left dir-ltr transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1">
                  شناسه لاتین (ID)
                </label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={!!category}
                  placeholder="cold-bar"
                  className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2.5 py-1.5 text-xs text-[#F6F4EE] outline-hidden text-left dir-ltr disabled:opacity-50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1">
                  ترتیب نمایش
                </label>
                <input
                  type="number"
                  min="1"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2.5 py-1.5 text-xs text-[#F6F4EE] outline-hidden text-center font-mono transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Icon Selector Grid */}
          <div className="bg-[#051A15] p-3 rounded-xl border border-[#1A443A] space-y-2">
            <label className="block text-[11px] font-semibold text-[#DFBA87]">
              آیکون دسته‌بندی
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = iconName === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setIconName(item.id)}
                    className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#DFBA87] text-[#1E170F] font-bold border-[#DFBA87] shadow-xs'
                        : 'bg-[#08221D] text-[#A8BCB5] border-[#1A443A] hover:border-[#DFBA87]/40'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#1E170F]' : 'text-[#DFBA87]'}`} />
                    <span className="truncate text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="bg-[#051A15] p-3 rounded-xl border border-[#1A443A] space-y-1">
            <label className="block text-[11px] font-semibold text-[#DFBA87]">
              توضیحات کوتاه
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیح کوتاه درباره این بخش از منو..."
              className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg p-2.5 text-xs leading-relaxed text-[#F6F4EE] outline-hidden transition-colors"
            />
          </div>

          {/* Sticky Actions */}
          <div className="pt-2.5 border-t border-[#1A443A] flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-linear-to-r from-[#DFBA87] to-[#C99C63] hover:from-[#E5C79A] text-[#1E170F] font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ذخیره</span>
            </button>

            {category && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(category.id)}
                className="bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="حذف دسته‌بندی"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="bg-white/5 hover:bg-white/10 text-[#A8BCB5] hover:text-white py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
            >
              انصراف
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
