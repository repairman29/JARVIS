import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789').trim();
const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const FARM_URL = (process.env.JARVIS_FARM_URL || process.env.FARM_URL || '').trim();
const TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '';
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

const FARM_PROBE_TIMEOUT_MS = 2500;

async function pingGateway(url: string, timeoutMs = 4000): Promise<boolean> {
  try {
    const base = url.replace(/\/$/, '');
    const res = await fetch(`${base}/`, {
      method: 'GET',
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      signal: AbortSignal.timeout(timeoutMs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function pingEdge(
  url: string
): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const base = url.replace(/\/$/, '');
    const headers: Record<string, string> = {};
    if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
    const res = await fetch(base, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(4000),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
    const ok = res.ok && data.ok === true;
    return {
      ok,
      status: res.status,
      error: ok ? undefined : res.ok ? 'Response missing ok: true' : `Edge returned ${res.status}`,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Request failed';
    const error = message.includes('abort') || message.includes('timeout') ? 'Health check timed out (4s)' : message;
    return { ok: false, error };
  }
}

export async function GET(req: NextRequest) {
  const unauth = requireSession(req);
  if (unauth) return unauth;

  const hint = EDGE_URL
    ? FARM_URL
      ? 'Hybrid: Farm when reachable, else Edge.'
      : 'JARVIS Edge URL is set; health checks the Edge Function.'
    : 'Start the gateway: clawdbot gateway run (or from repo root: node scripts/start-gateway-with-vault.js). Default: http://127.0.0.1:18789';
  try {
    // Hybrid: Edge + Farm URL set → try farm first
    if (EDGE_URL && FARM_URL) {
      const farmReachable = await pingGateway(FARM_URL, FARM_PROBE_TIMEOUT_MS);
      if (farmReachable) {
        return NextResponse.json(
          {
            ok: true,
            status: 200,
            gateway: FARM_URL,
            mode: 'farm',
          },
          { headers: CACHE_HEADERS }
        );
      }
      const result = await pingEdge(EDGE_URL);
      return NextResponse.json(
        {
          ok: result.ok,
          status: result.ok ? 200 : 503,
          gateway: EDGE_URL,
          mode: 'edge',
          ...(result.error && {
            error:
              result.status === 405
                ? 'Edge returned 405 (GET not allowed). Redeploy: supabase functions deploy jarvis'
                : result.error,
            statusCode: result.status,
          }),
        },
        { headers: CACHE_HEADERS }
      );
    }

    if (EDGE_URL) {
      const result = await pingEdge(EDGE_URL);
      return NextResponse.json(
        {
          ok: result.ok,
          status: result.ok ? 200 : 503,
          gateway: EDGE_URL,
          mode: 'edge',
          ...(result.error && {
            error:
              result.status === 405
                ? 'Edge returned 405 (GET not allowed). Redeploy: supabase functions deploy jarvis'
                : result.error,
            statusCode: result.status,
          }),
        },
        { headers: CACHE_HEADERS }
      );
    }
    let ok = await pingGateway(GATEWAY_URL);
    if (!ok && GATEWAY_URL.includes('127.0.0.1')) {
      ok = await pingGateway(GATEWAY_URL.replace('127.0.0.1', 'localhost'));
    }
    return NextResponse.json(
      { ok, status: ok ? 200 : 503, gateway: GATEWAY_URL, mode: 'local' },
      { headers: CACHE_HEADERS }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: message, gateway: EDGE_URL || FARM_URL || GATEWAY_URL, hint },
      { status: 200, headers: CACHE_HEADERS }
    );
  }
}
