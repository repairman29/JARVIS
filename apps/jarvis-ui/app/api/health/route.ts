import { NextResponse } from 'next/server';

const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789').trim();
const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '';
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

async function pingGateway(url: string): Promise<boolean> {
  try {
    const base = url.replace(/\/$/, '');
    const res = await fetch(`${base}/`, {
      method: 'GET',
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function pingEdge(url: string): Promise<boolean> {
  try {
    const base = url.replace(/\/$/, '');
    const headers: Record<string, string> = {};
    if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
    const res = await fetch(base, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function GET() {
  const hint = EDGE_URL
    ? 'JARVIS Edge URL is set; health checks the Edge Function.'
    : 'Start the gateway: clawdbot gateway run (or from repo root: node scripts/start-gateway-with-vault.js). Default: http://127.0.0.1:18789';
  try {
    if (EDGE_URL) {
      const ok = await pingEdge(EDGE_URL);
      return NextResponse.json(
        { ok, status: ok ? 200 : 503, gateway: EDGE_URL, mode: 'edge' },
        { headers: CACHE_HEADERS }
      );
    }
    let ok = await pingGateway(GATEWAY_URL);
    if (!ok && GATEWAY_URL.includes('127.0.0.1')) {
      ok = await pingGateway(GATEWAY_URL.replace('127.0.0.1', 'localhost'));
    }
    return NextResponse.json(
      { ok, status: ok ? 200 : 503, gateway: GATEWAY_URL },
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: message, gateway: EDGE_URL || GATEWAY_URL, hint },
      { status: 200, headers: CACHE_HEADERS }
    );
  }
}
