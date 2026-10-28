import { getStoredMenuData } from '@/lib/menu-storage';
import { AdminClientPage } from './AdminClientPage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'پنل مدیریت کافه دال | Dall Cafe Admin',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { categories, items, cafeInfo } = await getStoredMenuData();

  return (
    <AdminClientPage
      initialCategories={categories}
      initialItems={items}
      initialCafeInfo={cafeInfo}
    />
  );
}
