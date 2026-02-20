import { NextResponse } from 'next/server';

const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789').trim();
const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const FARM_URL = (process.env.JARVIS_FARM_URL || process.env.FARM_URL || '').trim();

/** Public-only config for Settings UI (no secrets). */
export async function GET() {
  const hybrid = Boolean(EDGE_URL && FARM_URL);
  const mode = hybrid ? 'hybrid' : EDGE_URL ? 'edge' : 'local';
  const gatewayDisplay = hybrid
    ? 'Farm when reachable, else Edge'
    : EDGE_URL
      ? (() => {
          try {
            const u = new URL(EDGE_URL);
            return `${u.origin}${u.pathname.replace(/\/$/, '')}`;
          } catch {
            return 'Edge (configured)';
          }
        })()
      : GATEWAY_URL;
  return NextResponse.json(
    { mode, gatewayDisplay, hybrid },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
