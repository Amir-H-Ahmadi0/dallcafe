'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { MenuItem, Category, CafeInfo } from '@/types/menu';
import { DalLogo } from '@/components/DalLogo';
import { ItemFormModal } from './ItemFormModal';
import { CategoryModal } from './CategoryModal';
import { BulkPriceModal } from './BulkPriceModal';
import { StockQuickView } from './StockQuickView';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  LogOut,
  ExternalLink,
  Layers,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  FolderTree,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import Image from 'next/image';

interface AdminDashboardProps {
  initialCategories: Category[];
  initialItems: MenuItem[];
  initialCafeInfo: CafeInfo;
  onLogout: () => void;
}

type AdminTab = 'items' | 'stock' | 'categories' | 'bulk-price' | 'backup';

export function AdminDashboard({
  initialCategories,
  initialItems,
  initialCafeInfo,
  onLogout,
}: AdminDashboardProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [cafeInfo] = useState<CafeInfo>(initialCafeInfo);

  const [activeTab, setActiveTab] = useState<AdminTab>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Modals state
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [bulkPriceModalOpen, setBulkPriceModalOpen] = useState(false);

  // Delete Confirm Dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'item' | 'category' | 'reset';
    id?: string;
    title?: string;
  } | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeAbortCtrlRef = useRef<AbortController | null>(null);
  const latestDataRef = useRef<{ categories: Category[]; items: MenuItem[] }>({
    categories: initialCategories,
    items: initialItems,
  });

  // Keep latestDataRef current
  useEffect(() => {
    latestDataRef.current = { categories, items };
  }, [categories, items]);

  // Core background network save directly to Upstash Redis
  const executeSave = useCallback(
    async (catsToSave: Category[], itemsToSave: MenuItem[]) => {
      setSyncStatus('saving');

      // Abort previous in-flight save if still pending to prevent race conditions
      if (activeAbortCtrlRef.current) {
        activeAbortCtrlRef.current.abort();
      }
      const abortCtrl = new AbortController();
      activeAbortCtrlRef.current = abortCtrl;

      try {
        const token = localStorage.getItem('dall_admin_token') || '';
        const res = await fetch('/api/admin/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            categories: catsToSave,
            items: itemsToSave,
            cafeInfo,
          }),
          signal: abortCtrl.signal,
        });

        // Fast client cache backup
        try {
          localStorage.setItem(
            'dall_menu_client_cache',
            JSON.stringify({ categories: catsToSave, items: itemsToSave, cafeInfo })
          );
        } catch {
          // ignore quota error
        }

        if (res.ok) {
          setSyncStatus('saved');
          setHasUnsavedChanges(false);

          // Broadcast to other tabs & windows so customer view updates in real-time
          try {
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
              const channel = new BroadcastChannel('dall_menu_sync');
              channel.postMessage({ type: 'MENU_UPDATED', timestamp: Date.now() });
              channel.close();
            }
            window.dispatchEvent(new CustomEvent('dall_menu_updated'));
          } catch {}
        } else {
          const errData = await res.json().catch(() => null);
          setSyncStatus('error');
          setHasUnsavedChanges(true);
          showToast(errData?.error || errData?.message || 'خطا در ذخیره در فضای ابری.', 'error');
        }
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === 'AbortError') {
          return; // Aborted by newer request, perfectly normal
        }
        setSyncStatus('error');
        setHasUnsavedChanges(true);
      }
    },
    [cafeInfo, showToast]
  );

  // High-speed scheduler: optimistic UI updates instantly, debouncing rapid clicks
  const scheduleSave = useCallback(
    (newCategories: Category[], newItems: MenuItem[], delayMs = 300) => {
      latestDataRef.current = { categories: newCategories, items: newItems };
      setSyncStatus('saving');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      if (delayMs <= 0) {
        executeSave(newCategories, newItems);
      } else {
        saveTimeoutRef.current = setTimeout(() => {
          executeSave(newCategories, newItems);
        }, delayMs);
      }
    },
    [executeSave]
  );

  // --------------------------------------------------------------------------
  // ITEM ACTIONS (Instant Optimistic UI)
  // --------------------------------------------------------------------------
  const handleSaveItem = (itemToSave: MenuItem) => {
    let updated: MenuItem[];
    const exists = items.some((i) => i.id === itemToSave.id);

    if (exists) {
      updated = items.map((i) => (i.id === itemToSave.id ? itemToSave : i));
      showToast(`محصول «${itemToSave.titleFa}» ویرایش شد.`);
    } else {
      updated = [itemToSave, ...items];
      showToast(`محصول «${itemToSave.titleFa}» افزوده شد.`);
    }

    setItems(updated);
    setItemModalOpen(false);
    setEditingItem(null);
    scheduleSave(categories, updated, 0);
  };

  const handleDeleteItem = (itemId: string) => {
    const itemToDelete = items.find((i) => i.id === itemId);
    setDeleteConfirm({
      type: 'item',
      id: itemId,
      title: itemToDelete?.titleFa || 'این محصول',
    });
  };

  const confirmDeleteItem = (itemId: string) => {
    const updated = items.filter((i) => i.id !== itemId);
    setItems(updated);
    setDeleteConfirm(null);
    if (editingItem?.id === itemId) {
      setItemModalOpen(false);
      setEditingItem(null);
    }
    showToast('محصول حذف شد.');
    scheduleSave(categories, updated, 0);
  };

  // Toggle Single Item Availability (0ms instant toggle + debounced background sync)
  const handleToggleAvailability = (itemId: string, newStatus: boolean) => {
    const updated = items.map((i) => (i.id === itemId ? { ...i, isAvailable: newStatus } : i));
    setItems(updated);
    scheduleSave(categories, updated, 300);
  };

  // Batch Toggle Availability
  const handleBatchToggleAvailability = (itemIds: string[], newStatus: boolean) => {
    const idSet = new Set(itemIds);
    const updated = items.map((i) => (idSet.has(i.id) ? { ...i, isAvailable: newStatus } : i));
    setItems(updated);
    showToast(`موجودی ${itemIds.length} محصول به‌روز شد.`);
    scheduleSave(categories, updated, 0);
  };

  // --------------------------------------------------------------------------
  // CATEGORY ACTIONS
  // --------------------------------------------------------------------------
  const handleSaveCategory = (catToSave: Category) => {
    let updated: Category[];
    const exists = categories.some((c) => c.id === catToSave.id);

    if (exists) {
      updated = categories.map((c) => (c.id === catToSave.id ? catToSave : c));
      showToast(`دسته‌بندی «${catToSave.nameFa}» ویرایش شد.`);
    } else {
      updated = [...categories, catToSave].sort((a, b) => a.order - b.order);
      showToast(`دسته‌بندی «${catToSave.nameFa}» ایجاد شد.`);
    }

    setCategories(updated);
    setCategoryModalOpen(false);
    setEditingCategory(null);
    scheduleSave(updated, items, 0);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const catToDelete = categories.find((c) => c.id === categoryId);
    const linkedItemsCount = items.filter((i) => i.categoryId === categoryId).length;

    if (linkedItemsCount > 0) {
      showToast(
        `امکان حذف این دسته‌بندی وجود ندارد؛ زیرا هنوز ${linkedItemsCount} محصول در آن قرار دارند.`,
        'error'
      );
      return;
    }

    setDeleteConfirm({
      type: 'category',
      id: categoryId,
      title: catToDelete?.nameFa || 'این دسته‌بندی',
    });
  };

  const confirmDeleteCategory = (categoryId: string) => {
    const updated = categories.filter((c) => c.id !== categoryId);
    setCategories(updated);
    setDeleteConfirm(null);
    if (editingCategory?.id === categoryId) {
      setCategoryModalOpen(false);
      setEditingCategory(null);
    }
    showToast('دسته‌بندی حذف شد.');
    scheduleSave(updated, items, 0);
  };

  // --------------------------------------------------------------------------
  // BULK PRICE ACTION
  // --------------------------------------------------------------------------
  const handleApplyBulkPrices = (updatedItems: MenuItem[]) => {
    setItems(updatedItems);
    showToast('قیمت‌های جدید با موفقیت اعمال شدند.');
    scheduleSave(categories, updatedItems, 0);
  };

  // --------------------------------------------------------------------------
  // BACKUP & RESTORE
  // --------------------------------------------------------------------------
  const handleDownloadBackup = () => {
    const data = {
      categories,
      items,
      cafeInfo,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dall-cafe-menu-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('فایل پشتیبان منو دانلود شد.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.categories) && Array.isArray(parsed.items)) {
          setCategories(parsed.categories);
          setItems(parsed.items);
          scheduleSave(parsed.categories, parsed.items, 0);
          showToast('اطلاعات منو از فایل بازیابی شد.');
        } else {
          showToast('ساختار فایل پشتیبان معتبر نیست.', 'error');
        }
      } catch {
        showToast('خطا در خواندن فایل JSON.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefaults = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.categories && data.items) {
        setCategories(data.categories);
        setItems(data.items);
        scheduleSave(data.categories, data.items, 0);
      }
      setDeleteConfirm(null);
      showToast('منو به داده‌های اولیه بازگردانی شد.');
    } catch {
      showToast('خطا در بازنشانی منو.', 'error');
    }
  };

  // Filter items for Items Tab
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.titleFa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat =
        selectedCategoryFilter === 'all' || item.categoryId === selectedCategoryFilter;

      return matchSearch && matchCat;
    });
  }, [items, searchQuery, selectedCategoryFilter]);

  return (
    <div className="min-h-screen bg-[#051A15] text-[#F6F4EE] flex flex-col pb-20 sm:pb-24" dir="rtl">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-80 z-50 p-2.5 rounded-xl shadow-2xl border text-xs font-semibold flex items-center justify-between gap-2.5 animate-slideDown ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100'
              : 'bg-rose-950/95 border-rose-400 text-rose-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span className="truncate">{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100 text-sm">
            &times;
          </button>
        </div>
      )}

      {/* Compact Top Header (No duplicate tabs) */}
      <header className="sticky top-0 z-30 bg-[#08221D]/95 backdrop-blur-md border-b border-[#1A443A] px-3 py-2 sm:px-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 shrink-0">
              <DalLogo size="sm" showText={false} circular={true} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-black text-[#DFBA87]">
                  مدیریت کافه دال
                </h1>
                <span className="text-[9px] font-bold bg-[#DFBA87]/15 text-[#DFBA87] border border-[#DFBA87]/30 px-1.5 py-0.2 rounded">
                  ادمین
                </span>
              </div>
              <p className="text-[10px] text-[#A8BCB5]">
                {items.length} محصول &bull; {categories.length} دسته
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            {syncStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-[11px] text-[#DFBA87] bg-[#DFBA87]/10 border border-[#DFBA87]/30 px-2 py-1 rounded-lg font-medium">
                <RefreshCw className="w-3 h-3 animate-spin text-[#DFBA87]" />
                <span className="hidden sm:inline">در حال ذخیره ابری...</span>
              </span>
            )}

            {syncStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded-lg font-medium">
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">ذخیره شد</span>
              </span>
            )}

            {syncStatus === 'error' && (
              <button
                type="button"
                onClick={() => scheduleSave(categories, items, 0)}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1"
                title="خطا در ذخیره. تلاش مجدد"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>تلاش مجدد</span>
              </button>
            )}

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#A8BCB5] hover:text-white transition-colors text-[11px] flex items-center gap-1 border border-white/5"
              title="مشاهده سایت منو"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#DFBA87]" />
              <span className="hidden sm:inline">نمایش منو</span>
            </a>

            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-colors text-[11px] flex items-center gap-1"
              title="خروج"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-3 sm:px-5 pt-3.5 flex-1">
        {/* ================================================================ */}
        {/* TAB 1: ITEMS MANAGEMENT */}
        {/* ================================================================ */}
        {activeTab === 'items' && (
          <div className="space-y-3 animate-fadeIn">
            {/* Search + Add Item Bar */}
            <div className="flex gap-2 items-center justify-between">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام یا ویژگی محصول..."
                  className="w-full bg-[#08221D] border border-[#1A443A] focus:border-[#DFBA87] rounded-xl pr-9 pl-3 py-2 text-xs text-[#F6F4EE] placeholder:text-[#527067] outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-[#7D9990] absolute right-3 top-2.5" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  setItemModalOpen(true);
                }}
                className="bg-linear-to-r from-[#DFBA87] to-[#C99C63] hover:from-[#E5C79A] hover:to-[#D5A971] text-[#1E170F] font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن آیتم</span>
              </button>
            </div>

            {/* Category Filter Horizontal Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  selectedCategoryFilter === 'all'
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
                    onClick={() => setSelectedCategoryFilter(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                      selectedCategoryFilter === cat.id
                        ? 'bg-[#DFBA87] text-[#1E170F]'
                        : 'bg-[#08221D] text-[#A8BCB5] border border-[#1A443A]'
                    }`}
                  >
                    {cat.nameFa} ({count})
                  </button>
                );
              })}
            </div>

            {/* Compact Items List */}
            <div className="space-y-1.5">
              {displayedItems.length === 0 ? (
                <div className="p-8 text-center bg-[#08221D] border border-[#1A443A] rounded-xl">
                  <p className="text-xs text-[#A8BCB5]">محصولی پیدا نشد.</p>
                </div>
              ) : (
                displayedItems.map((item) => {
                  const cat = categories.find((c) => c.id === item.categoryId);
                  return (
                    <div
                      key={item.id}
                      className="bg-[#08221D] border border-[#1A443A] hover:border-[#DFBA87]/40 rounded-xl p-2.5 flex items-center justify-between gap-2.5 transition-all"
                    >
                      {/* Left: Thumbnail + Name + Price */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-black/40 shrink-0 border border-white/10">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.titleFa}
                              fill
                              className="object-cover"
                              sizes="44px"
                              referrerPolicy="no-referrer"
                              unoptimized={Boolean(item.imageUrl?.startsWith('data:'))}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center p-1">
                              <DalLogo size="sm" showText={false} circular={true} />
                            </div>
                          )}
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-rose-300 px-1 py-0.2 rounded bg-rose-950/80">
                                ناموجود
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-[#F6F4EE] truncate leading-tight">
                              {item.titleFa}
                            </h3>
                            {item.featured && (
                              <span className="text-[9px] bg-[#DFBA87]/20 text-[#DFBA87] px-1 py-0.2 rounded font-bold shrink-0">
                                ویژه
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-bold text-[#DFBA87] font-mono">
                              {item.price.toLocaleString('fa-IR')} ت
                            </span>
                            <span className="text-[9px] text-[#A8BCB5] bg-[#051A15] px-1.5 py-0.2 rounded border border-[#1A443A] truncate max-w-[100px]">
                              {cat?.nameFa || 'دسته‌بندی'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Quick stock toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(item.id, !item.isAvailable)}
                          className={`text-[10px] px-2 py-1 rounded-lg border font-bold transition-all ${
                            item.isAvailable
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          {item.isAvailable ? 'موجود' : 'ناموجود'}
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setItemModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#DFBA87] border border-white/10 text-xs transition-colors"
                          title="ویرایش محصول"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/30 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 2: STOCK CONTROL (QUICK AVAILABILITY) */}
        {/* ================================================================ */}
        {activeTab === 'stock' && (
          <div className="animate-fadeIn">
            <StockQuickView
              items={items}
              categories={categories}
              onToggleAvailability={handleToggleAvailability}
              onBatchToggleAvailability={handleBatchToggleAvailability}
            />
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {/* ================================================================ */}
        {activeTab === 'categories' && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-[#F6F4EE]">
                  مدیریت دسته‌بندی‌های منو
                </h2>
                <p className="text-[10px] text-[#A8BCB5]">
                  افزودن، ویرایش نام، آیکون و ترتیب نمایش
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryModalOpen(true);
                }}
                className="bg-[#DFBA87] hover:bg-[#E5C79A] text-[#1E170F] font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 active:scale-98 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>دسته جدید</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {categories.map((cat) => {
                const count = items.filter((i) => i.categoryId === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className="bg-[#08221D] border border-[#1A443A] rounded-xl p-3 flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#DFBA87]/15 border border-[#DFBA87]/30 flex items-center justify-center text-[#DFBA87] font-bold text-xs">
                          {cat.order}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-[#F6F4EE]">{cat.nameFa}</h3>
                          <p className="text-[10px] text-[#7D9990] font-serif italic">{cat.nameEn}</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#051A15] border border-[#1A443A] text-[#DFBA87]">
                        {count} محصول
                      </span>
                    </div>

                    {cat.description && (
                      <p className="text-[11px] text-[#A8BCB5] leading-relaxed line-clamp-1">
                        {cat.description}
                      </p>
                    )}

                    <div className="pt-2 border-t border-[#1A443A] flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#DFBA87] text-[11px] font-semibold flex items-center gap-1 border border-white/5"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>ویرایش</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs"
                        title="حذف دسته‌بندی"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 4: BULK PRICE EDITING */}
        {/* ================================================================ */}
        {activeTab === 'bulk-price' && (
          <div className="space-y-4 sm:space-y-5 animate-fadeIn max-w-2xl mx-auto">
            {/* Hero Card */}
            <div className="bg-[#08221D] border border-[#1A443A] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <TrendingUp className="w-7 h-7" />
              </div>

              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#F6F4EE]">
                  مدیریت گروهی قیمت‌ها
                </h2>
                <p className="text-[11px] sm:text-xs text-[#A8BCB5] mt-1 max-w-md mx-auto leading-relaxed">
                  افزایش یا کاهش همزمان قیمت‌ها به تفکیک دسته‌بندی با درصد دلخواه
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setBulkPriceModalOpen(true)}
                  className="bg-linear-to-r from-[#DFBA87] to-[#C99C63] hover:from-[#E5C79A] text-[#1E170F] font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 mx-auto shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>ویرایش قیمت‌ها ({items.length} محصول)</span>
                </button>
              </div>
            </div>

            {/* Quick Pricing Insights */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-[#08221D] p-3 sm:p-3.5 rounded-xl border border-[#1A443A] text-center flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] text-[#A8BCB5] block">کل محصولات</span>
                <span className="text-sm sm:text-base font-bold text-[#F6F4EE] font-mono mt-0.5 block">
                  {items.length.toLocaleString('fa-IR')}
                </span>
              </div>

              <div className="bg-[#08221D] p-3 sm:p-3.5 rounded-xl border border-[#1A443A] text-center flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] text-[#A8BCB5] block">میانگین قیمت فعلی</span>
                <span className="text-sm sm:text-base font-bold text-[#DFBA87] font-mono mt-0.5 block">
                  {(
                    Math.round(items.reduce((acc, i) => acc + i.price, 0) / (items.length || 1))
                  ).toLocaleString('fa-IR')}{' '}
                  <span className="text-[10px] font-sans">ت</span>
                </span>
              </div>

              <div className="bg-[#08221D] p-3 sm:p-3.5 rounded-xl border border-[#1A443A] text-center flex flex-col justify-center">
                <span className="text-[10px] sm:text-[11px] text-[#A8BCB5] block">دسته‌بندی‌های فعال</span>
                <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono mt-0.5 block">
                  {categories.length.toLocaleString('fa-IR')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TAB 5: BACKUP & FILES */}
        {/* ================================================================ */}
        {activeTab === 'backup' && (
          <div className="space-y-3 animate-fadeIn max-w-md mx-auto">
            <div className="bg-[#08221D] border border-[#1A443A] rounded-2xl p-4 space-y-3">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-[#F6F4EE] flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#DFBA87]" />
                  پشتیبان‌گیری و بازیابی داده‌ها
                </h3>
                <p className="text-[11px] text-[#A8BCB5] mt-0.5 leading-relaxed">
                  داده‌ها در فایل پروژه ثبت می‌شوند. از این بخش می‌توانید نسخه پشتیبان JSON دانلود کنید.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="p-3 rounded-xl bg-[#051A15] border border-[#1A443A] hover:border-[#DFBA87] flex flex-col items-center justify-center gap-1.5 text-center transition-all group"
                >
                  <Download className="w-5 h-5 text-[#DFBA87] group-hover:scale-105 transition-transform" />
                  <span className="text-[11px] font-bold text-[#F6F4EE]">دانلود بکاپ (JSON)</span>
                  <span className="text-[9px] text-[#A8BCB5]">ذخیره روی گوشی/سیستم</span>
                </button>

                <label className="p-3 rounded-xl bg-[#051A15] border border-[#1A443A] hover:border-[#DFBA87] flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-emerald-400 group-hover:scale-105 transition-transform" />
                  <span className="text-[11px] font-bold text-[#F6F4EE]">بازیابی از JSON</span>
                  <span className="text-[9px] text-[#A8BCB5]">آپلود نسخه قبلی</span>
                </label>
              </div>

              {/* Vercel Cloud Storage Info */}
              <div className="p-3 rounded-xl bg-[#051A15] border border-[#1A443A]/80 text-[11px] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#DFBA87] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ذخیره‌سازی ابری در Vercel</span>
                </div>
                <p className="text-[#A8BCB5] leading-relaxed text-[10px]">
                  در هاست سرورلس Vercel، تغییرات و تصاویر آپلودشده (Base64) بدون خطای فایل‌سیستم ذخیره می‌شوند. برای پایداری همیشگی بین تمام کاربران، می‌توانید در داشبورد ورسل بخش <strong>Storage &rarr; KV (Upstash)</strong> را متصل فرمایید که توسط سیستم به صورت خودکار پشتیبانی می‌شود.
                </p>
              </div>

              <div className="pt-3 border-t border-[#1A443A] flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-bold text-rose-300">بازنشانی پیش‌فرض</span>
                  <span className="block text-[9px] text-[#7D9990]">
                    بازگشت به منوی پیش‌فرض اولیه
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirm({
                      type: 'reset',
                      title: 'تمام تغییرات بازنشانی و منو به حالت اولیه پروژه برگردد؟',
                    })
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ریست منو</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Single, Sleek Bottom Navigation Bar (No duplicate top menu) */}
      <nav
        aria-label="ناوبری ادمین"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#08221D]/95 backdrop-blur-md border-t border-[#1A443A] px-3 py-2 flex items-center justify-around shadow-2xl max-w-xl mx-auto sm:bottom-3 sm:rounded-2xl sm:border"
      >
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'items' ? 'text-[#DFBA87] font-bold scale-105' : 'text-[#7D9990] hover:text-[#A8BCB5]'
          }`}
        >
          <Layers className="w-5 h-5 mb-1" />
          <span className="text-[11px]">آیتم‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'stock' ? 'text-[#DFBA87] font-bold scale-105' : 'text-[#7D9990] hover:text-[#A8BCB5]'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-1" />
          <span className="text-[11px]">موجودی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'categories' ? 'text-[#DFBA87] font-bold scale-105' : 'text-[#7D9990] hover:text-[#A8BCB5]'
          }`}
        >
          <FolderTree className="w-5 h-5 mb-1" />
          <span className="text-[11px]">دسته‌ها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bulk-price')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'bulk-price' ? 'text-[#DFBA87] font-bold scale-105' : 'text-[#7D9990] hover:text-[#A8BCB5]'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-1" />
          <span className="text-[11px]">قیمت گروهی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'backup' ? 'text-[#DFBA87] font-bold scale-105' : 'text-[#7D9990] hover:text-[#A8BCB5]'
          }`}
        >
          <Download className="w-5 h-5 mb-1" />
          <span className="text-[11px]">پشتیبان</span>
        </button>
      </nav>

      {/* Item Modal */}
      <ItemFormModal
        isOpen={itemModalOpen}
        item={editingItem}
        categories={categories}
        allItems={items}
        onClose={() => {
          setItemModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={categoryModalOpen}
        category={editingCategory}
        existingCategories={categories}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        onDelete={handleDeleteCategory}
      />

      {/* Bulk Price Modal */}
      <BulkPriceModal
        isOpen={bulkPriceModalOpen}
        items={items}
        categories={categories}
        onClose={() => setBulkPriceModalOpen(false)}
        onApply={handleApplyBulkPrices}
      />

      {/* Delete / Reset Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            className="w-full max-w-sm sm:max-w-md bg-[#08221D] border border-[#1A443A] rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-4 animate-scaleUp"
            dir="rtl"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#F6F4EE]">تایید عملیات حذف</h3>
              <p className="text-xs sm:text-sm text-[#A8BCB5] mt-1.5 leading-relaxed">
                {deleteConfirm.type === 'item' && `آیا از حذف آیتم «${deleteConfirm.title}» از منو مطمئن هستید؟`}
                {deleteConfirm.type === 'category' &&
                  `آیا از حذف دسته‌بندی «${deleteConfirm.title}» مطمئن هستید؟`}
                {deleteConfirm.type === 'reset' && deleteConfirm.title}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === 'item' && deleteConfirm.id) {
                    confirmDeleteItem(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'category' && deleteConfirm.id) {
                    confirmDeleteCategory(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'reset') {
                    handleResetToDefaults();
                  }
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>تایید و حذف قطعی</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-[#A8BCB5] hover:text-white transition-colors cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
