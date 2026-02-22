import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const PASSWORD = (process.env.JARVIS_UI_PASSWORD ?? '').replace(/\r\n?|\n/g, '').trim();
const AUTH_SECRET = (process.env.JARVIS_UI_AUTH_SECRET ?? '').replace(/\r\n?|\n/g, '').trim();
const COOKIE_NAME = 'jarvis-ui-session';
const MAX_AGE_DAYS = 30;

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function createSessionCookie(): string {
  const timestamp = String(Date.now());
  const secret = AUTH_SECRET || PASSWORD;
  if (!secret) return '';
  const hmac = createHmac('sha256', secret);
  hmac.update(timestamp);
  const sig = base64url(hmac.digest());
  const payload = Buffer.from(timestamp, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${payload}.${sig}`;
}

/**
 * POST /api/auth/login — always returns JSON. Cookie is set on the response.
 * The login page calls this with fetch() + credentials:'include' so the
 * browser stores the cookie, then JS navigates to /.
 */
export async function POST(req: NextRequest) {
  if (!PASSWORD) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }
  if (!AUTH_SECRET) {
    return NextResponse.json(
      { error: 'JARVIS_UI_AUTH_SECRET must be set when using password protection' },
      { status: 500 },
    );
  }

  let password = '';
  try {
    const body = await req.json();
    password = (typeof body.password === 'string' ? body.password : '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  const a = Buffer.from(PASSWORD, 'utf8');
  const b = Buffer.from(password, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const value = createSessionCookie();
  if (!value) {
    return NextResponse.json({ error: 'Cannot create session' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
  });
  return res;
}
