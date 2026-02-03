import { NextRequest, NextResponse } from 'next/server';

const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();

/** GET /api/session?sessionId=xxx — Load session history from Edge (when using Edge backend). */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId')?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }
  if (!EDGE_URL) {
    return NextResponse.json({ messages: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const url = new URL(EDGE_URL);
  url.searchParams.set('session_id', sessionId);
  const headers: Record<string, string> = {};
  if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { messages: [], error: res.statusText },
        { status: res.status, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const data = await res.json();
    const messages = Array.isArray(data.messages) ? data.messages : [];
    return NextResponse.json({ messages }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Failed to load session';
    return NextResponse.json(
      { messages: [], error: err },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
