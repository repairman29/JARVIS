import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'jarvis-ui-session';

function loginUrl(req: NextRequest): string {
  try {
    const u = new URL(req.url);
    return new URL('/login', u.origin).toString();
  } catch {
    return '/login';
  }
}

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(loginUrl(req));
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
