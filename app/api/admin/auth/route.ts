import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  AUTH_COOKIE_NAME,
  generateToken,
  isAuthorized,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = generateToken(username);
      const res = NextResponse.json({
        success: true,
        message: 'ورود با موفقیت انجام شد',
        token,
      });

      // Set HTTP-only cookie
      res.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return res;
    }

    return NextResponse.json(
      {
        success: false,
        message: 'نام کاربری یا کلمه عبور وارد شده اشتباه است.',
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'خطای پردازش درخواست ورود' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const authorized = isAuthorized(req);
  return NextResponse.json({ authenticated: authorized });
}

export async function DELETE() {
  const res = NextResponse.json({ success: true, message: 'خروج موفقیت‌آمیز' });
  res.cookies.delete(AUTH_COOKIE_NAME);
  return res;
}
