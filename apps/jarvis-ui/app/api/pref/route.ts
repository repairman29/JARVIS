import { NextRequest, NextResponse } from 'next/server';

const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();

/** POST /api/pref — Set a JARVIS preference via Edge (persists to jarvis_prefs). Only works when using Edge backend. */
export async function POST(req: NextRequest) {
  if (!EDGE_URL) {
    return NextResponse.json(
      { error: 'Prefs require Edge backend (NEXT_PUBLIC_JARVIS_EDGE_URL)' },
      { status: 503 }
    );
  }
  let body: { key?: string; value?: unknown; scope?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!key) {
    return NextResponse.json({ error: 'key required' }, { status: 400 });
  }
  const value = body.value;
  if (value === undefined) {
    return NextResponse.json({ error: 'value required' }, { status: 400 });
  }
  const scope = typeof body.scope === 'string' ? body.scope.trim() || undefined : undefined;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;

  try {
    const res = await fetch(EDGE_URL.replace(/\/$/, ''), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'set_pref',
        key,
        value,
        scope,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { error?: string }).error || res.statusText },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    const err = e instanceof Error ? e.message : 'Failed to set pref';
    return NextResponse.json({ error: err }, { status: 502 });
  }
}
