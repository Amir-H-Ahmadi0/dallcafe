import { NextRequest } from 'next/server';

export const ADMIN_USERNAME = 'hameddallcafe';
export const ADMIN_PASSWORD = 'hameddallcafe2006@@@';
export const AUTH_COOKIE_NAME = 'dall_admin_token';
const AUTH_SECRET = 'dall_secret_salt_2026';

export function generateToken(username: string): string {
  const timestamp = Date.now();
  const raw = `${username}:${timestamp}:${AUTH_SECRET}`;
  return Buffer.from(raw).toString('base64');
}

export function verifyToken(token: string | null | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [user, , secret] = decoded.split(':');
    return user === ADMIN_USERNAME && secret === AUTH_SECRET;
  } catch {
    return false;
  }
}

export function isAuthorized(req: NextRequest | Request): boolean {
  try {
    // 1. Check NextRequest cookies object if present
    if ('cookies' in req && req.cookies && typeof req.cookies.get === 'function') {
      const cookie = req.cookies.get(AUTH_COOKIE_NAME)?.value;
      if (verifyToken(cookie)) return true;
    }

    // 2. Check standard cookie header
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
      if (match && verifyToken(decodeURIComponent(match[1]))) return true;
    }

    // 3. Check Authorization header (Bearer token)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      if (verifyToken(token)) return true;
    }
  } catch {
    return false;
  }

  return false;
}
