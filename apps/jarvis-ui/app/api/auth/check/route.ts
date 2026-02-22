import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';

const COOKIE_NAME = 'jarvis-ui-session';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function base64urlDecode(str: string): Buffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (3 - (str.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

function verifySession(cookieValue: string, secret: string): boolean {
  const dot = cookieValue.indexOf('.');
  if (dot === -1) return false;
  const payloadB64 = cookieValue.slice(0, dot);
  const sigB64 = cookieValue.slice(dot + 1);
  if (!payloadB64 || !sigB64) return false;
  let timestampStr: string;
  try {
    timestampStr = base64urlDecode(payloadB64).toString('utf8');
  } catch {
    return false;
  }
  const timestamp = Number(timestampStr);
  if (!Number.isFinite(timestamp) || Date.now() - timestamp > MAX_AGE_MS || timestamp > Date.now()) {
    return false;
  }
  const hmac = createHmac('sha256', secret);
  hmac.update(timestampStr);
  const expected = hmac.digest();
  let actual: Buffer;
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

export async function GET(req: NextRequest) {
  const password = (process.env.JARVIS_UI_PASSWORD ?? '').replace(/\r\n?|\n/g, '').trim();
  if (!password) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  // Use same secret logic as login route: AUTH_SECRET || PASSWORD
  const authSecret = (process.env.JARVIS_UI_AUTH_SECRET ?? '').replace(/\r\n?|\n/g, '').trim();
  const secret = authSecret || password;
  if (!secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) {
    return NextResponse.json({ error: 'Unauthorized', reason: 'no_cookie' }, { status: 401 });
  }
  if (!verifySession(cookie, secret)) {
    return NextResponse.json({ error: 'Unauthorized', reason: 'invalid_cookie' }, { status: 401 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
