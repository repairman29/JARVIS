import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

// Normalize: trim and strip any CR/LF (env vars can get newlines from dashboard or CLI)
const PASSWORD = (process.env.JARVIS_UI_PASSWORD ?? '').replace(/\r\n?|\n/g, '').trim();
const AUTH_SECRET = (process.env.JARVIS_UI_AUTH_SECRET ?? '').replace(/\r\n?|\n/g, '').trim();
const COOKIE_NAME = 'jarvis-ui-session';
const MAX_AGE_DAYS = 30;

function getOrigin(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || (req.url.startsWith('https') ? 'https' : 'http');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host;
  return `${proto}://${host}`;
}

function redirectToLogin(req: NextRequest, params: string): NextResponse {
  return NextResponse.redirect(getOrigin(req) + '/login' + params, 302);
}

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
  const contentType = (req.headers.get('content-type') ?? '').toLowerCase();
  const isForm = contentType.includes('application/x-www-form-urlencoded');
  let redirectTo = '';

  if (!PASSWORD) {
    if (isForm) return redirectToLogin(req, '?error=unavailable');
    return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
  }
  if (!AUTH_SECRET && PASSWORD) {
    if (isForm) return redirectToLogin(req, '?error=unavailable');
    return NextResponse.json(
      { error: 'JARVIS_UI_AUTH_SECRET must be set when using password protection' },
      { status: 500 }
    );
  }

  let password = '';
  try {
    const raw = await req.text();
    if (!raw || !raw.trim()) {
      return NextResponse.json({ error: 'Request body required' }, { status: 400 });
    }
    if (isForm) {
      const params = new URLSearchParams(raw);
      password = (params.get('password') ?? '').trim();
      const from = params.get('from') ?? '';
      if (from.startsWith('/')) redirectTo = from;
    } else {
      const body = JSON.parse(raw) as { password?: string; from?: string };
      password = (typeof body.password === 'string' ? body.password : '').trim();
      const from = typeof body.from === 'string' ? body.from : '';
      if (from.startsWith('/')) redirectTo = from;
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
    if (redirectTo) {
      return redirectToLogin(req, `?from=${encodeURIComponent(redirectTo)}&error=invalid`);
    }
    const res = NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    res.headers.set('X-Auth-Expected-Len', String(a.length));
    res.headers.set('X-Auth-Received-Len', String(b.length));
    return res;
  }
  const value = createSessionCookie();
  if (!value) {
    if (isForm) return redirectToLogin(req, '?error=unavailable');
    return NextResponse.json({ error: 'Cannot create session' }, { status: 500 });
  }
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
  };
  if (redirectTo) {
    // 200 + HTML redirect so the browser reliably leaves the login page (some browsers/proxies don't follow 302 with Set-Cookie).
    const url = getOrigin(req) + redirectTo;
    const urlEscaped = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${urlEscaped}"><title>Signing in…</title></head><body>Signing in…</body></html>`;
    const res = new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
    res.cookies.set(COOKIE_NAME, value, cookieOpts);
    return res;
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, value, cookieOpts);
  return res;
}
