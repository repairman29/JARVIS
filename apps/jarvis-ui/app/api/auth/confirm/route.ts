import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const COOKIE_NAME = 'jarvis-ui-session';
const MAX_AGE_DAYS = 30;
const CONFIRM_TTL_MS = 2 * 60 * 1000; // 2 min

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Buffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (3 - (str.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

/**
 * GET ?t=TOKEN — One-time token from login. Verifies token, sets session cookie, returns 200.
 * Cookie is set in THIS response so the browser has it before we redirect to /.
 */
export async function GET(req: NextRequest) {
  const secret = (process.env.JARVIS_UI_AUTH_SECRET ?? process.env.JARVIS_UI_PASSWORD ?? '')
    .replace(/\r\n?|\n/g, '')
    .trim();
  const origin = req.headers.get('x-forwarded-proto')
    ? `${req.headers.get('x-forwarded-proto')}://${req.headers.get('x-forwarded-host') || req.headers.get('host')}`
    : new URL(req.url).origin;
  const loginError = () => NextResponse.redirect(`${origin}/login?error=confirm_failed&debug=1`, 302);

  if (!secret) {
    return loginError();
  }

  const t = req.nextUrl.searchParams.get('t') ?? '';
  const dot = t.indexOf('.');
  if (dot === -1) return loginError();
  const payloadB64 = t.slice(0, dot);
  const sigB64 = t.slice(dot + 1);
  let payload: string;
  try {
    payload = base64urlDecode(payloadB64).toString('utf8');
  } catch {
    return loginError();
  }
  if (!payload.startsWith('confirm:')) return loginError();
  const timestamp = Number(payload.slice(8));
  if (!Number.isFinite(timestamp) || Date.now() - timestamp > CONFIRM_TTL_MS || timestamp > Date.now()) {
    return loginError();
  }
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expected = hmac.digest();
  let actual: Buffer;
  try {
    actual = base64urlDecode(sigB64);
  } catch {
    return loginError();
  }
  if (expected.length !== actual.length) return loginError();
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
  if (diff !== 0) return loginError();

  const timestampStr = String(Date.now());
  const hmac2 = createHmac('sha256', secret);
  hmac2.update(timestampStr);
  const sig = base64url(hmac2.digest());
  const sessionPayload = Buffer.from(timestampStr, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const sessionValue = `${sessionPayload}.${sig}`;

  const nextPath = req.nextUrl.searchParams.get('next') || '/';
  const target = nextPath.startsWith('/') ? nextPath : '/';
  const redirectUrl = `${origin}${target}`;
  const res = NextResponse.redirect(redirectUrl, 302);
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  // Omit domain so the cookie is host-only; some browsers/proxies mishandle explicit domain on redirect.
  res.cookies.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
  });
  return res;
}
