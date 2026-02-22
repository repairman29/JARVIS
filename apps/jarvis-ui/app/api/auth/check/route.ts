import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const unauth = requireSession(req);
  if (unauth) return unauth;
  return NextResponse.json({ ok: true }, { status: 200 });
}
