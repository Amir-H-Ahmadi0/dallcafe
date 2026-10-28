'use client';

import React, { useState, useRef } from 'react';
import { MenuItem, Category } from '@/types/menu';
import { isFoodCategory } from '@/lib/category-helpers';
import {
  X,
  Check,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Sliders,
  FileText,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import Image from 'next/image';

interface ItemFormModalProps {
  isOpen: boolean;
  item: MenuItem | null;
  categories: Category[];
  allItems: MenuItem[];
  onClose: () => void;
  onSave: (item: MenuItem) => void;
  onDelete?: (itemId: string) => void;
}

type TabType = 'basic' | 'image' | 'content' | 'flavor';

export function ItemFormModal({
  isOpen,
  item,
  categories,
  allItems,
  onClose,
  onSave,
  onDelete,
}: ItemFormModalProps) {
  if (!isOpen) return null;

  return (
    <ItemFormModalContent
      key={item?.id ?? 'new-item'}
      item={item}
      categories={categories}
      allItems={allItems}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}

function ItemFormModalContent({
  item,
  categories,
  allItems,
  onClose,
  onSave,
  onDelete,
}: Omit<ItemFormModalProps, 'isOpen'>) {
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  // Form Fields
  const [titleFa, setTitleFa] = useState(item?.titleFa || '');
  const [titleEn, setTitleEn] = useState(item?.titleEn || '');
  const [categoryId, setCategoryId] = useState(item?.categoryId || categories[0]?.id || '');
  const [price, setPrice] = useState<number>(item?.price ?? 70000);
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [featured, setFeatured] = useState(!!item?.featured);
  const [temperature, setTemperature] = useState<'hot' | 'cold' | 'both'>(item?.temperature || 'hot');
  const [prepTime, setPrepTime] = useState(item?.prepTime || '۳ دقیقه');

  const isFood = isFoodCategory(categoryId, categories);

  // Image Fields
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || item?.image || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Content Fields
  const [description, setDescription] = useState(item?.description || '');
  const [ingredientsText, setIngredientsText] = useState((item?.ingredients || []).join('، '));
  const [tagsText, setTagsText] = useState((item?.tags || []).join('، '));
  const [aromaNotesText, setAromaNotesText] = useState((item?.aromaNotes || []).join('، '));

  // Flavor Profile
  const [caffeine, setCaffeine] = useState(item?.flavorProfile?.caffeine ?? 3);
  const [body, setBody] = useState(item?.flavorProfile?.body ?? 3);
  const [acidity, setAcidity] = useState(item?.flavorProfile?.acidity ?? 2);
  const [bitterness, setBitterness] = useState(item?.flavorProfile?.bitterness ?? 3);
  const [sweetness, setSweetness] = useState(item?.flavorProfile?.sweetness ?? 2);

  // Pairing
  const [pairingItemId, setPairingItemId] = useState(item?.pairingItemId || '');
  const [pairingNote, setPairingNote] = useState(item?.pairingNote || '');

  const [error, setError] = useState<string | null>(null);

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', categoryId || 'menu');

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('dall_admin_token') || ''}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setImageUrl(data.url);
      } else {
        setError(data.error || 'خطا در آپلود تصویر.');
      }
    } catch {
      setError('خطا در ارتباط با سرور هنگام آپلود فایل.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleFa.trim()) {
      setActiveTab('basic');
      setError('نام فارسی محصول الزامی است.');
      return;
    }

    if (!categoryId) {
      setActiveTab('basic');
      setError('انتخاب دسته‌بندی محصول الزامی است.');
      return;
    }

    const parseList = (str: string) =>
      str
        .split(/[,،\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

    const newItem: MenuItem = {
      id: item?.id || `item-${Date.now()}`,
      titleFa: titleFa.trim(),
      titleEn: titleEn.trim(),
      categoryId,
      price: Number(price) || 0,
      description: description.trim(),
      ingredients: parseList(ingredientsText),
      tags: parseList(tagsText),
      isAvailable,
      temperature,
      prepTime: prepTime.trim() || '۳ دقیقه',
      aromaNotes: parseList(aromaNotesText),
      imageUrl: imageUrl.trim(),
      image: imageUrl.trim(),
      featured,
      flavorProfile: isFood
        ? undefined
        : {
            caffeine,
            body,
            acidity,
            bitterness,
            sweetness,
          },
      pairingItemId: pairingItemId || undefined,
      pairingNote: pairingNote.trim() || undefined,
    };

    onSave(newItem);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div
        className="w-full max-w-2xl bg-[#08221D] border border-[#1A443A] rounded-2xl h-[92vh] sm:h-[86vh] max-h-[760px] flex flex-col shadow-2xl overflow-hidden animate-slideUp text-right"
        dir="rtl"
      >
        {/* Sticky Header */}
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#1A443A] bg-[#051A15] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#DFBA87]/15 border border-[#DFBA87]/30 flex items-center justify-center text-[#DFBA87] shrink-0">
              {item ? <Sliders className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-[#F6F4EE] leading-tight truncate max-w-[170px] sm:max-w-none">
                  {item ? item.titleFa : 'افزودن آیتم جدید'}
                </h3>
                {item && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#DFBA87]/15 text-[#DFBA87] border border-[#DFBA87]/30 font-mono">
                    {item.price.toLocaleString('fa-IR')} ت
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#A8BCB5]">
                {item ? 'ویرایش مشخصات و ترکیبات' : 'ثبت محصول جدید در منو'}
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

        {/* Tab Navigation - Always in a clean row */}
        <div className="flex border-b border-[#1A443A] bg-[#061C17] px-2 py-1.5 gap-1 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'basic'
                ? 'bg-[#DFBA87] text-[#1E170F] shadow-xs'
                : 'text-[#A8BCB5] hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>مشخصات اصلی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'image'
                ? 'bg-[#DFBA87] text-[#1E170F] shadow-xs'
                : 'text-[#A8BCB5] hover:bg-white/5'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
            <span>تصویر</span>
            {imageUrl && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'content'
                ? 'bg-[#DFBA87] text-[#1E170F] shadow-xs'
                : 'text-[#A8BCB5] hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>ترکیبات</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flavor')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'flavor'
                ? 'bg-[#DFBA87] text-[#1E170F] shadow-xs'
                : 'text-[#A8BCB5] hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>{isFood ? 'پیشنهاد همنشین' : 'طعم و همنشین'}</span>
          </button>
        </div>

        {/* Form Body Scroll Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {error && (
            <div className="p-2.5 bg-rose-950/70 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 1: BASIC INFO */}
          {/* ========================================================== */}
          {activeTab === 'basic' && (
            <div className="space-y-3 animate-fadeIn">
              {/* Product Titles & Pricing Card (2-column row on mobile) */}
              <div className="bg-[#051A15] p-3 sm:p-3.5 rounded-xl border border-[#1A443A] space-y-2.5">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1">
                      نام فارسی <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={titleFa}
                      onChange={(e) => setTitleFa(e.target.value)}
                      placeholder="مثال: اسپرسو ۷۰ ۳۰"
                      className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2.5 py-1.5 text-xs text-[#F6F4EE] outline-hidden transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1">
                      نام انگلیسی (لاتین)
                    </label>
                    <input
                      type="text"
                      value={titleEn}
                      onChange={(e) => setTitleEn(e.target.value)}
                      placeholder="Double Espresso"
                      className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2.5 py-1.5 text-xs text-[#F6F4EE] outline-hidden text-left dir-ltr transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1">
                      دسته‌بندی <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2 py-1.5 text-xs text-[#F6F4EE] outline-hidden cursor-pointer transition-colors"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#08221D] text-[#F6F4EE]">
                          {cat.nameFa}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1">
                      قیمت (تومان) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg pl-10 pr-2.5 py-1.5 text-xs text-[#F6F4EE] outline-hidden font-mono transition-colors"
                        required
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-[10px] text-[#DFBA87]">
                        تومان
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Highlights Card - Strict Row Layout on Mobile */}
              <div className="bg-[#051A15] p-3 sm:p-3.5 rounded-xl border border-[#1A443A] space-y-2.5">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {/* Stock Availability Toggle - 100% Guaranteed NOT to spill out */}
                  <div
                    onClick={() => setIsAvailable(!isAvailable)}
                    className={`p-2 sm:p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-2 transition-all select-none ${
                      isAvailable
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block text-xs font-bold leading-tight">موجودی</span>
                      <span className="text-[10px] opacity-85 block truncate mt-0.5">
                        {isAvailable ? 'موجود' : 'تمام شد'}
                      </span>
                    </div>

                    {/* Foolproof pill container: strict LTR flex layout, zero translate bugs */}
                    <div
                      dir="ltr"
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${
                        isAvailable ? 'bg-emerald-500 justify-end' : 'bg-rose-900 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </div>
                  </div>

                  {/* Featured / Barista Pick Toggle */}
                  <div
                    onClick={() => setFeatured(!featured)}
                    className={`p-2 sm:p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-2 transition-all select-none ${
                      featured
                        ? 'bg-[#DFBA87]/15 border-[#DFBA87]/60 text-[#DFBA87]'
                        : 'bg-[#08221D] border-[#1A443A] text-[#7D9990]'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block text-xs font-bold leading-tight">پیشنهاد دال</span>
                      <span className="text-[10px] opacity-85 block truncate mt-0.5">
                        {featured ? 'ویژه' : 'عادی'}
                      </span>
                    </div>
                    <Sparkles className={`w-4 h-4 shrink-0 ${featured ? 'text-[#DFBA87]' : 'text-gray-500'}`} />
                  </div>
                </div>

                {/* Prep Time */}
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1">
                    زمان تقریبی آماده‌سازی
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      placeholder="مثال: ۳ دقیقه، ۱۰ دقیقه"
                      className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg pr-7 pl-2.5 py-1.5 text-xs text-[#F6F4EE] outline-hidden"
                    />
                    <Clock className="w-3.5 h-3.5 text-[#DFBA87] absolute right-2.5 top-2.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: IMAGE */}
          {/* ========================================================== */}
          {activeTab === 'image' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="bg-[#051A15] p-1 rounded-xl border border-[#1A443A] flex gap-1">
                <button
                  type="button"
                  onClick={() => setImageMode('upload')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    imageMode === 'upload'
                      ? 'bg-[#DFBA87] text-[#1E170F]'
                      : 'text-[#A8BCB5] hover:bg-white/5'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>آپلود فایل در پوشه پروژه</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode('url')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    imageMode === 'url'
                      ? 'bg-[#DFBA87] text-[#1E170F]'
                      : 'text-[#A8BCB5] hover:bg-white/5'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>آدرس اینترنتی (URL)</span>
                </button>
              </div>

              {imageMode === 'upload' ? (
                <div className="p-4 bg-[#051A15] border border-[#1A443A] rounded-xl text-center space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="admin-file-upload-item"
                  />
                  <label
                    htmlFor="admin-file-upload-item"
                    className="cursor-pointer block border-2 border-dashed border-[#DFBA87]/40 hover:border-[#DFBA87] rounded-xl p-4 bg-[#08221D] transition-colors"
                  >
                    <Upload className="w-6 h-6 text-[#DFBA87] mx-auto mb-1.5" />
                    <span className="block text-xs font-bold text-[#F6F4EE]">
                      {isUploading ? 'در حال پردازش و ذخیره تصویر...' : 'انتخاب تصویر از گوشی یا سیستم'}
                    </span>
                    <span className="block text-[10px] text-[#A8BCB5] mt-1">
                      پشتیبانی خودکار از هاست سرورلس (Vercel) و ذخیره مستقیم تصویر
                    </span>
                  </label>
                </div>
              ) : (
                <div className="bg-[#051A15] p-3 rounded-xl border border-[#1A443A] space-y-1.5">
                  <label className="block text-[11px] font-semibold text-[#DFBA87]">
                    آدرس تصویر آنلاین (URL مستقیم)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... یا /images/menu/..."
                    className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2.5 py-1.5 text-xs text-[#F6F4EE] outline-hidden text-left dir-ltr"
                  />
                </div>
              )}

              {/* Image Preview Box */}
              <div className="bg-[#051A15] p-3 rounded-xl border border-[#1A443A] flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black/60 border border-[#1A443A] shrink-0 flex items-center justify-center">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt="پیش‌نمایش"
                      fill
                      className="object-cover"
                      sizes="64px"
                      referrerPolicy="no-referrer"
                      unoptimized={Boolean(imageUrl?.startsWith('data:'))}
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-[#7D9990]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-[#DFBA87]">
                    پیش‌نمایش تصویر محصول
                  </span>
                  <p className="text-[10px] text-[#A8BCB5] truncate mt-0.5 dir-ltr text-left">
                    {imageUrl || 'تصویری انتخاب نشده است'}
                  </p>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="mt-1 text-[11px] text-rose-300 hover:text-rose-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف تصویر</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: CONTENT & INGREDIENTS */}
          {/* ========================================================== */}
          {activeTab === 'content' && (
            <div className="space-y-3.5 animate-fadeIn w-full">
              <div className="bg-[#051A15] p-3.5 sm:p-4 rounded-xl border border-[#1A443A] space-y-3.5 w-full">
                <div>
                  <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1.5">
                    توضیحات معرفی محصول (داستان و ویژگی‌ها)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیح کوتاه درباره طعم، بافت، ویژگی‌های دانه‌ها، نحوه عصاره‌گیری و ویژگی‌های منحصر به‌فرد محصول..."
                    className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg p-3 text-xs leading-relaxed text-[#F6F4EE] outline-hidden"
                  />
                  <span className="text-[10px] text-[#A8BCB5] mt-1 block">
                    این متن در نمای جزئیات محصول در منو برای مشتری نمایش داده می‌شود.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1.5">
                    ترکیبات اصلی محصول (با کاما یا ویرگول جدا کنید)
                  </label>
                  <textarea
                    rows={2}
                    value={ingredientsText}
                    onChange={(e) => setIngredientsText(e.target.value)}
                    placeholder="مثال: قهوه ۷۰/۳۰ روبوستا-عربیکا، شیر تازه پرچرب، سیروپ کارامل دست‌ساز دال"
                    className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg p-2.5 text-xs text-[#F6F4EE] outline-hidden leading-relaxed"
                  />
                  <span className="text-[10px] text-[#A8BCB5] mt-1 block">
                    ترکیبات به صورت برچسب‌های تفکیک‌شده در مشخصات محصول درج می‌شوند.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1.5">
                    برچسب‌ها و تگ‌های سریع (با ویرگول جدا کنید)
                  </label>
                  <input
                    type="text"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="مثال: پرکافئین، ویژه دال، وگان، بدون شکر، بدون گلوتن"
                    className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-3 py-2 text-xs text-[#F6F4EE] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#DFBA87] mb-1.5">
                    نت‌های عطری و طعمی (با ویرگول جدا کنید)
                  </label>
                  <input
                    type="text"
                    value={aromaNotesText}
                    onChange={(e) => setAromaNotesText(e.target.value)}
                    placeholder="مثال: شکلات تلخ، فندق بو داده، کارامل سوخته، مرکبات"
                    className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-3 py-2 text-xs text-[#F6F4EE] outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: FLAVOR PROFILE & PAIRING */}
          {/* ========================================================== */}
          {activeTab === 'flavor' && (
            <div className="space-y-3 animate-fadeIn">
              {!isFood ? (
                <div className="bg-[#051A15] p-3 rounded-xl border border-[#1A443A] space-y-2.5">
                  <span className="text-xs font-bold text-[#DFBA87] block">
                    شناسنامه طعمی قهوه و نوشیدنی‌ها (۰ تا ۵)
                  </span>

                  <div className="space-y-2">
                    {[
                      { label: 'میزان کافئین', val: caffeine, setVal: setCaffeine },
                      { label: 'غلظت و بادی (Body)', val: body, setVal: setBody },
                      { label: 'اسیدیته (روشنایی میوه‌ای)', val: acidity, setVal: setAcidity },
                      { label: 'میزان تلخی', val: bitterness, setVal: setBitterness },
                      { label: 'شیرینی ذاتی', val: sweetness, setVal: setSweetness },
                    ].map((slider) => (
                      <div
                        key={slider.label}
                        className="bg-[#08221D] px-2.5 py-1.5 rounded-lg border border-[#1A443A] flex items-center justify-between gap-2"
                      >
                        <span className="text-xs text-[#F6F4EE] font-medium">{slider.label}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="5"
                            value={slider.val}
                            onChange={(e) => slider.setVal(Number(e.target.value))}
                            className="w-24 sm:w-32 accent-[#DFBA87] cursor-pointer"
                          />
                          <span className="w-5 text-center font-mono text-xs font-bold text-[#DFBA87]">
                            {slider.val}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-[#051A15] p-3.5 rounded-xl border border-[#1A443A] space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#DFBA87]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>دسته‌بندی کیک، عصرانه و صبحانه</span>
                  </div>
                  <p className="text-[11px] text-[#A8BCB5] leading-relaxed">
                    شناسنامه طعمی قهوه و نوشیدنی (کافئین، تلخی، اسیدیته و غلظت) مختص منوی نوشیدنی‌هاست و برای این آیتم ثبت نمی‌شود. می‌توانید در بخش زیر، یک نوشیدنی مکمل به عنوان پیشنهاد باریستا برای این آیتم انتخاب کنید.
                  </p>
                </div>
              )}

              {/* Pairing in Row */}
              <div className="bg-[#051A15] p-3 rounded-xl border border-[#1A443A] space-y-2">
                <span className="text-xs font-bold text-[#DFBA87] block">
                  پیشنهاد همنشین طعمی (Pairing)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#A8BCB5] mb-1">محصول مکمل</label>
                    <select
                      value={pairingItemId}
                      onChange={(e) => setPairingItemId(e.target.value)}
                      className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2 py-1.5 text-xs text-[#F6F4EE] outline-hidden cursor-pointer"
                    >
                      <option value="">بدون پیشنهاد</option>
                      {allItems
                        .filter((i) => i.id !== item?.id)
                        .map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.titleFa}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#A8BCB5] mb-1">علت پیشنهاد</label>
                    <input
                      type="text"
                      value={pairingNote}
                      onChange={(e) => setPairingNote(e.target.value)}
                      placeholder="مکمل شیرینی کیک"
                      className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-lg px-2 py-1.5 text-xs text-[#F6F4EE] outline-hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions - Compact and Clean */}
          <div className="pt-2.5 border-t border-[#1A443A] flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-linear-to-r from-[#DFBA87] to-[#C99C63] hover:from-[#E5C79A] text-[#1E170F] font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 active:scale-98 transition-all cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ذخیره</span>
            </button>

            {item && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                title="حذف محصول"
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
