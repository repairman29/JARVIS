import { NextResponse } from 'next/server';

const FARM_URL = (process.env.JARVIS_FARM_URL || process.env.FARM_URL || '').trim();
const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

interface FarmNode {
  name: string;
  healthy: boolean;
  busy: boolean;
  models: string[];
  requests: number;
  errors: number;
  avgMs: number;
  uptimeMs: number;
}

interface FarmHealth {
  status: string;
  healthy: number;
  total: number;
  uptimeMs: number;
  nodes: FarmNode[];
}

async function fetchFarmHealth(): Promise<FarmHealth | null> {
  if (!FARM_URL) return null;
  try {
    const url = `${FARM_URL.replace(/\/$/, '')}/health`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return (await res.json()) as FarmHealth;
  } catch {
    return null;
  }
}

async function _fetchEdgeFarmHealth(): Promise<FarmHealth | null> {
  if (!EDGE_URL) return null;
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
    const res = await fetch(EDGE_URL.replace(/\/$/, ''), {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'farm_status' }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.farm) return data.farm as FarmHealth;
    return null;
  } catch {
    return null;
  }
}

function formatUptime(ms: number): string {
  if (ms <= 0) return 'down';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export async function GET() {
  const farm = await fetchFarmHealth();

  if (!farm) {
    return NextResponse.json(
      {
        available: false,
        farmUrl: FARM_URL ? '(configured)' : null,
        error: FARM_URL ? 'Farm unreachable' : 'JARVIS_FARM_URL not set',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const nodes = farm.nodes.map((n: FarmNode & { tier?: string; parallel?: number }) => ({
    ...n,
    tier: n.tier || 'secondary',
    parallel: n.parallel || 1,
    uptimeFormatted: formatUptime(n.uptimeMs),
    successRate: n.requests > 0 ? Math.round(((n.requests - n.errors) / n.requests) * 100) : 100,
  }));

  return NextResponse.json(
    {
      available: true,
      status: farm.status,
      healthy: farm.healthy,
      total: farm.total,
      uptimeFormatted: formatUptime(farm.uptimeMs),
      nodes,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
