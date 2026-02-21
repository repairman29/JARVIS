import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'jarvis-ui-session';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (3 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifySession(cookieValue: string, secret: string): Promise<boolean> {
  const dot = cookieValue.indexOf('.');
  if (dot === -1) return false;
  const payloadB64 = cookieValue.slice(0, dot);
  const sigB64 = cookieValue.slice(dot + 1);
  if (!payloadB64 || !sigB64) return false;
  let timestampStr: string;
  try {
    timestampStr = new TextDecoder().decode(base64urlDecode(payloadB64));
  } catch {
    return false;
  }
  const timestamp = Number(timestampStr);
  if (!Number.isFinite(timestamp) || Date.now() - timestamp > MAX_AGE_MS || timestamp > Date.now()) {
    return false;
  }
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(timestampStr)
  );
  const expected = new Uint8Array(sig);
  let actual: Uint8Array;
  try {
    actual = base64urlDecode(sigB64);
  } catch {
    return false;
  }
  if (expected.length !== actual.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i];
  return diff === 0;
}

function redirectToLogin(req: NextRequest, path: string): NextResponse {
  const login = new URL('/login', req.url);
  login.searchParams.set('from', path);
  const res = NextResponse.redirect(login);
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return res;
}

export async function middleware(req: NextRequest) {
  const password = process.env.JARVIS_UI_PASSWORD ?? '';
  if (!password) {
    return NextResponse.next();
  }
  const path = req.nextUrl.pathname;
  if (path === '/login' || path.startsWith('/api/auth/')) {
    return NextResponse.next();
  }
  const secret = process.env.JARVIS_UI_AUTH_SECRET ?? '';
  // When secret is missing (e.g. Vercel Edge often has no env at runtime), don't block here.
  // Let the request through; AuthGuard will call /api/auth/check (Node) where env is available.
  if (!secret) {
    return NextResponse.next();
  }
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return redirectToLogin(req, path);
  }
  const ok = await verifySession(cookie, secret);
  if (!ok) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return redirectToLogin(req, path);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon).*)'],
};
