import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

// Normalize: trim and strip any CR/LF (env vars can get newlines from dashboard or CLI)
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
  const payload = Buffer.from(timestamp, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${payload}.${sig}`;
}

export async function POST(req: NextRequest) {
  if (!PASSWORD) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }
  if (!AUTH_SECRET && PASSWORD) {
    return NextResponse.json(
      { error: 'JARVIS_UI_AUTH_SECRET must be set when using password protection' },
      { status: 500 }
    );
  }
  let password = '';
  const contentType = (req.headers.get('content-type') ?? '').toLowerCase();
  try {
    const raw = await req.text();
    if (!raw || !raw.trim()) {
      return NextResponse.json({ error: 'Request body required' }, { status: 400 });
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(raw);
      password = (params.get('password') ?? '').trim();
    } else {
      const body = JSON.parse(raw) as { password?: string };
      password = (typeof body.password === 'string' ? body.password : '').trim();
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON or body' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }
  const a = Buffer.from(PASSWORD, 'utf8');
  const b = Buffer.from(password, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    const res = NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    // Debug: help diagnose mismatch (expected length vs received length; remove in production if desired)
    res.headers.set('X-Auth-Expected-Len', String(a.length));
    res.headers.set('X-Auth-Received-Len', String(b.length));
    return res;
  }
  const value = createSessionCookie();
  if (!value) {
    return NextResponse.json({ error: 'Cannot create session' }, { status: 500 });
  }
  const res = NextResponse.json({ ok: true });
  const maxAge = MAX_AGE_DAYS * 24 * 60 * 60;
  res.cookies.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return res;
}
