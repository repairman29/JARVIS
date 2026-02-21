import { NextResponse } from 'next/server';

const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789').trim();
const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const FARM_URL = (process.env.JARVIS_FARM_URL || process.env.FARM_URL || '').trim();
const TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '';
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();

const FARM_PROBE_MS = 2500;
const PING_TIMEOUT_MS = 4000;

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

async function pingGateway(url: string, timeoutMs = PING_TIMEOUT_MS): Promise<{ ok: boolean; error?: string }> {
  try {
    const base = url.replace(/\/$/, '');
    const res = await fetch(`${base}/`, {
      method: 'GET',
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { ok: res.ok, ...(res.ok ? {} : { error: `HTTP ${res.status}` }) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed';
    const error = msg.includes('abort') || msg.includes('timeout') ? 'Timeout' : msg;
    return { ok: false, error };
  }
}

async function pingEdge(url: string): Promise<{ ok: boolean; error?: string; status?: number }> {
  try {
    const base = url.replace(/\/$/, '');
    const headers: Record<string, string> = {};
    if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
    const res = await fetch(base, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(PING_TIMEOUT_MS),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
    const ok = res.ok && data.ok === true;
    return {
      ok,
      status: res.status,
      ...(ok ? {} : { error: res.ok ? 'Response missing ok: true' : `HTTP ${res.status}` }),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Request failed';
    const error = msg.includes('abort') || msg.includes('timeout') ? 'Timeout' : msg;
    return { ok: false, error };
  }
}

/** Returns aggregated status for the monitoring dashboard: health outcome + per-backend probes (no secrets). */
export async function GET() {
  const checkedAt = new Date().toISOString();

  type Backend = 'farm' | 'edge' | 'local';
  const backends: Record<string, { label: string; configured: boolean; ok?: boolean; error?: string; urlHint?: string }> = {
    farm: {
      label: 'Farm (Pixel / relay)',
      configured: Boolean(FARM_URL),
      urlHint: FARM_URL ? (() => {
        try { return new URL(FARM_URL).origin; } catch { return '(set)'; }
      })() : undefined,
    },
    edge: {
      label: 'Edge (Supabase)',
      configured: Boolean(EDGE_URL),
      urlHint: EDGE_URL ? (() => {
        try { return new URL(EDGE_URL).origin; } catch { return '(set)'; }
      })() : undefined,
    },
    local: {
      label: 'Local gateway',
      configured: true,
      urlHint: GATEWAY_URL.startsWith('http') ? GATEWAY_URL : undefined,
    },
  };

  const [farmResult, edgeResult, localResult] = await Promise.all([
    FARM_URL ? pingGateway(FARM_URL, FARM_PROBE_MS) : Promise.resolve({ ok: false, error: 'Not configured' }),
    EDGE_URL ? pingEdge(EDGE_URL) : Promise.resolve({ ok: false, error: 'Not configured' }),
    pingGateway(GATEWAY_URL).then((r) => (!r.ok && GATEWAY_URL.includes('127.0.0.1') ? pingGateway(GATEWAY_URL.replace('127.0.0.1', 'localhost')) : Promise.resolve(r))),
  ]);

  backends.farm.ok = farmResult.ok;
  if (!farmResult.ok) backends.farm.error = farmResult.error;
  backends.edge.ok = edgeResult.ok;
  if (!edgeResult.ok) backends.edge.error = edgeResult.error;
  backends.local.ok = localResult.ok;
  if (!localResult.ok) backends.local.error = localResult.error;

  let active: Backend = 'local';
  if (EDGE_URL && FARM_URL) {
    active = farmResult.ok ? 'farm' : edgeResult.ok ? 'edge' : 'local';
  } else if (EDGE_URL) {
    active = edgeResult.ok ? 'edge' : 'local';
  } else {
    active = localResult.ok ? 'local' : 'local';
  }
  const chatOk = active === 'farm' ? farmResult.ok : active === 'edge' ? edgeResult.ok : localResult.ok;

  return NextResponse.json(
    {
      checkedAt,
      active,
      chatOk,
      backends,
      hint: EDGE_URL && FARM_URL
        ? 'Chat uses Farm when reachable, else Edge.'
        : EDGE_URL
          ? 'Chat uses Edge when reachable.'
          : 'Chat uses local gateway.',
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
