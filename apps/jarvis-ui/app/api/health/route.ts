import { NextResponse } from 'next/server';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789';
const EDGE_URL = process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '';
const TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '';

async function pingGateway(url: string): Promise<boolean> {
  const base = url.replace(/\/$/, '');
  const res = await fetch(`${base}/`, {
    method: 'GET',
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
    signal: AbortSignal.timeout(4000),
  });
  return res.ok;
}

async function pingEdge(url: string): Promise<boolean> {
  const base = url.replace(/\/$/, '');
  const res = await fetch(base, {
    method: 'GET',
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) return false;
  try {
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
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );
    }
    let ok = await pingGateway(GATEWAY_URL);
    if (!ok && GATEWAY_URL.includes('127.0.0.1')) {
      const localhostUrl = GATEWAY_URL.replace('127.0.0.1', 'localhost');
      ok = await pingGateway(localhostUrl);
    }
    return NextResponse.json(
      { ok, status: ok ? 200 : 503, gateway: GATEWAY_URL },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: message, gateway: EDGE_URL || GATEWAY_URL, hint },
      { status: 503 }
    );
  }
}
