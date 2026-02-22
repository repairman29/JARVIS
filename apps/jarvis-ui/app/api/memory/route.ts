import { NextRequest, NextResponse } from 'next/server';

const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();

/** GET /api/memory?q=...&limit=10&session_id=... — Search past memories via Edge (match_jarvis_memory_chunks). */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  const limit = req.nextUrl.searchParams.get('limit');
  const sessionId = req.nextUrl.searchParams.get('session_id')?.trim() || undefined;
  if (!q) {
    return NextResponse.json({ error: 'query (q) required', results: [] }, { status: 400 });
  }
  if (!EDGE_URL) {
    return NextResponse.json(
      { results: [], message: 'Edge URL not configured (NEXT_PUBLIC_JARVIS_EDGE_URL).' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
  const body: Record<string, unknown> = { action: 'memory_search', query: q };
  if (limit) body.limit = Math.min(20, Math.max(1, parseInt(limit, 10) || 10));
  if (sessionId) body.session_id = sessionId;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
  try {
    const res = await fetch(EDGE_URL.replace(/\/$/, ''), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { results: [], error: (data as { error?: string }).error || res.statusText },
        { status: res.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json(
      { results: (data as { results?: unknown[] }).results ?? [], message: (data as { message?: string }).message },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Memory search failed';
    return NextResponse.json(
      { results: [], error: err },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
