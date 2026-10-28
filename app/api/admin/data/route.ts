import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/admin-auth';
import { getStoredMenuData, saveStoredMenuData } from '@/lib/menu-storage';
import { Category, MenuItem, CafeInfo } from '@/types/menu';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'غیرمجاز' }, { status: 401 });
  }

  try {
    const data = await getStoredMenuData();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to get admin data:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات منو' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'دسترسی غیرمجاز. لطفاً مجدداً وارد پنل شوید.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { categories, items, cafeInfo } = body as {
      categories?: Category[];
      items?: MenuItem[];
      cafeInfo?: CafeInfo;
    };

    if (!Array.isArray(categories) || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'داده‌های ارسالی معتبر نیستند.' },
        { status: 400 }
      );
    }

    const updated = await saveStoredMenuData({
      categories,
      items,
      cafeInfo,
    });

    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'page');
      revalidatePath('/api/menu');
    } catch {
      // Ignore cache revalidation errors
    }

    return NextResponse.json({
      success: true,
      message: 'تغییرات با موفقیت در فضای ابری ذخیره شد.',
      source: updated.source,
      updatedAt: updated.updatedAt,
      data: updated,
    });
  } catch (err) {
    console.error('Failed to save menu data:', err);
    return NextResponse.json(
      { error: 'خطا در ذخیره‌سازی داده‌های منو در سرور.' },
      { status: 500 }
    );
  }
}
