import { Category } from '@/types/menu';

/**
 * Pure helper to identify whether a category is food/pastry/breakfast rather than drinks/coffee.
 * 100% safe for both Server and Client bundles (no Node.js / fs dependencies).
 */
export function isFoodCategory(categoryId: string, categories?: Category[]): boolean {
  if (!categoryId) return false;
  const id = categoryId.toLowerCase().trim();
  if (['bakery', 'breakfast', 'cake', 'food', 'dessert'].includes(id)) {
    return true;
  }
  if (categories && Array.isArray(categories)) {
    const cat = categories.find((c) => c.id === categoryId);
    if (cat) {
      const combined = ((cat.nameFa || '') + ' ' + (cat.nameEn || '')).toLowerCase();
      if (
        combined.includes('کیک') ||
        combined.includes('عصرانه') ||
        combined.includes('صبحانه') ||
        combined.includes('شیرینی') ||
        combined.includes('غذا') ||
        combined.includes('ساندویچ') ||
        combined.includes('خوراک') ||
        combined.includes('نان') ||
        combined.includes('bakery') ||
        combined.includes('breakfast')
      ) {
        return true;
      }
      const icon = (cat.iconName || '').toLowerCase();
      if (icon === 'utensils' || icon === 'sandwich') {
        return true;
      }
    }
  }
  return false;
}
