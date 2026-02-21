import { NextResponse } from 'next/server';

/**
 * Returns non-sensitive auth config info for debugging login issues.
 * Safe to call unauthenticated. Remove or restrict in production if desired.
 */
export async function GET() {
  const password = process.env.JARVIS_UI_PASSWORD ?? '';
  const secret = process.env.JARVIS_UI_AUTH_SECRET ?? '';
  return NextResponse.json({
    authConfigured: Boolean(password && secret),
    passwordLength: password.length,
    secretLength: secret.length,
    passwordFirstCharCode: password.length ? password.charCodeAt(0) : null,
    passwordLastCharCode: password.length ? password.charCodeAt(password.length - 1) : null,
  });
}
