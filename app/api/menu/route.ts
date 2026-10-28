import { NextResponse } from 'next/server';
import { getStoredMenuData } from '@/lib/menu-storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    const data = await getStoredMenuData(true);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err) {
    console.error('Failed to get menu data:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve menu data' },
      { status: 500 }
    );
  }
}
