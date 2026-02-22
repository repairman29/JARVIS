import { NextRequest, NextResponse } from 'next/server';

const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();

/** GET /api/sessions?limit=20 — List recent sessions (message count, last_at) from Edge. */
export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10) || 20)) : 20;
  if (!EDGE_URL) {
    return NextResponse.json(
      { sessions: [], message: 'Edge URL not configured (NEXT_PUBLIC_JARVIS_EDGE_URL).' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
  try {
    const res = await fetch(EDGE_URL.replace(/\/$/, ''), {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'list_sessions', limit }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { sessions: [], error: (data as { error?: string }).error || res.statusText },
        { status: res.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json(
      { sessions: (data as { sessions?: unknown[] }).sessions ?? [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Failed to load sessions';
    return NextResponse.json(
      { sessions: [], error: err },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
