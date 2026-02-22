import { NextResponse } from 'next/server';

// Auth is handled entirely by AuthGuard (client) → /api/auth/check (Node).
// Middleware on Vercel Edge was rejecting valid cookies due to env-var normalization
// differences between Edge and Node runtimes. Keeping middleware minimal.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon).*)'],
};
