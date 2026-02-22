import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';

const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789').trim();
const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();
const GATEWAY_TOKEN = (process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '').trim();

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/** Probes Edge and/or gateway and returns detailed results (no secrets). Use for debugging "offline" UI. */
export async function GET(req: NextRequest) {
  const unauth = requireSession(req);
  if (unauth) return unauth;

  const results: Record<string, { status?: number; ok?: boolean; error?: string; bodyPreview?: string }> = {};

  if (EDGE_URL) {
    const base = EDGE_URL.replace(/\/$/, '');
    try {
      const headers: Record<string, string> = {};
      if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
      const res = await fetch(base, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(6000),
      });
      const text = await res.text();
      const bodyPreview = text.length > 120 ? `${text.slice(0, 120)}…` : text;
      let ok = false;
      try {
        const data = text ? JSON.parse(text) : null;
        ok = data != null && data.ok === true;
      } catch {
        // ok stays false
      }
      results.edge = {
        status: res.status,
        ok,
        bodyPreview,
      };
      if (!res.ok) results.edge.error = `HTTP ${res.status}`;
      else if (!ok) results.edge.error = 'Response missing ok: true';
    } catch (e) {
      results.edge = {
        error: e instanceof Error ? e.message : 'Request failed',
        bodyPreview: '',
      };
    }
  }

  try {
    const base = GATEWAY_URL.replace(/\/$/, '');
    const headers: Record<string, string> = {};
    if (GATEWAY_TOKEN) headers['Authorization'] = `Bearer ${GATEWAY_TOKEN}`;
    const res = await fetch(`${base}/`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(4000),
    });
    const text = await res.text();
    const bodyPreview = text.length > 120 ? `${text.slice(0, 120)}…` : text;
    results.gateway = {
      status: res.status,
      ok: res.ok,
      bodyPreview,
    };
    if (!res.ok) results.gateway.error = `HTTP ${res.status}`;
  } catch (e) {
    results.gateway = {
      error: e instanceof Error ? e.message : 'Request failed',
      bodyPreview: '',
    };
  }

  let edgeUrlDisplay: string | null = null;
  try {
    if (EDGE_URL) edgeUrlDisplay = new URL(EDGE_URL).origin + new URL(EDGE_URL).pathname;
  } catch {
    edgeUrlDisplay = EDGE_URL || null;
  }
  return NextResponse.json(
    {
      mode: EDGE_URL ? 'edge' : 'local',
      edgeUrl: edgeUrlDisplay,
      gatewayUrl: GATEWAY_URL,
      edgeTokenSet: Boolean(EDGE_TOKEN),
      gatewayTokenSet: Boolean(GATEWAY_TOKEN),
      results,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
