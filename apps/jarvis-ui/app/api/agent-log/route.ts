import { NextRequest, NextResponse } from 'next/server';

const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();

/** GET /api/agent-log?limit=30 — Recent proactive loop / audit log entries from Edge. */
export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10) || 30)) : 30;
  if (!EDGE_URL) {
    return NextResponse.json(
      { entries: [], message: 'Edge URL not configured (NEXT_PUBLIC_JARVIS_EDGE_URL).' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
  try {
    const res = await fetch(EDGE_URL.replace(/\/$/, ''), {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'get_agent_log', limit }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { entries: [], error: (data as { error?: string }).error || res.statusText },
        { status: res.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json(
      { entries: (data as { entries?: unknown[] }).entries ?? [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Failed to load agent log';
    return NextResponse.json(
      { entries: [], error: err },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
