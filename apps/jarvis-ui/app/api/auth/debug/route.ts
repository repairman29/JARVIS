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
  if (!Number.isFinite(timestamp) || Date.now() - timestamp > MAX_AGE_MS || timestamp > Date.now()) return false;
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

/**
 * Returns non-sensitive auth config and session state for debugging login issues.
 * Safe to call unauthenticated. Remove or restrict in production if desired.
 */
export async function GET(req: NextRequest) {
  const password = (process.env.JARVIS_UI_PASSWORD ?? '').replace(/\r\n?|\n/g, '').trim();
  const secret = (process.env.JARVIS_UI_AUTH_SECRET ?? '').replace(/\r\n?|\n/g, '').trim();
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const hasCookie = Boolean(cookie);
  const cookieValid = Boolean(secret && cookie && verifySession(cookie, secret));
  const authConfigured = Boolean(password && secret);
  return NextResponse.json({
    authConfigured,
    passwordLength: password.length,
    secretLength: secret.length,
    hasCookie,
    cookieValid,
    hint: !authConfigured ? 'Set JARVIS_UI_PASSWORD and JARVIS_UI_AUTH_SECRET in Vercel → Settings → Environment Variables (Production), then redeploy.' : (hasCookie && !cookieValid ? 'Cookie present but invalid (wrong AUTH_SECRET or expired).' : null),
  });
}
