#!/usr/bin/env node
/**
 * Debug JARVIS health: probe Edge and local gateway using jarvis-ui env.
 * Usage: node scripts/debug-jarvis-health.js
 * Loads apps/jarvis-ui/.env and .env.local (if present).
 */

const path = require('path');
const fs = require('fs');

function loadEnv(dir) {
  const envPath = path.join(dir, '.env');
  const localPath = path.join(dir, '.env.local');
  for (const p of [envPath, localPath]) {
    if (!fs.existsSync(p)) continue;
    const content = fs.readFileSync(p, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1).replace(/\\"/g, '"');
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1).replace(/\\'/g, "'");
      process.env[key] = val;
    }
  }
}

const uiRoot = path.resolve(__dirname, '..', 'apps', 'jarvis-ui');
loadEnv(uiRoot);

const EDGE_URL = (process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const EDGE_TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();
const GATEWAY_URL = (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:18789').trim();
const GATEWAY_TOKEN = (process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '').trim();

async function main() {
  console.log('Mode:', EDGE_URL ? 'edge' : 'local');
  console.log('Edge URL:', EDGE_URL || '(not set)');
  console.log('Edge token set:', Boolean(EDGE_TOKEN));
  console.log('Gateway URL:', GATEWAY_URL);
  console.log('Gateway token set:', Boolean(GATEWAY_TOKEN));
  console.log('');

  if (EDGE_URL) {
    const base = EDGE_URL.replace(/\/$/, '');
    const headers = {};
    if (EDGE_TOKEN) headers['Authorization'] = `Bearer ${EDGE_TOKEN}`;
    try {
      const res = await fetch(base, { method: 'GET', headers, signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (_) {}
      const ok = res.ok && data && data.ok === true;
      console.log('Edge GET:', res.status, ok ? 'ok' : 'NOT ok');
      console.log('  body:', text.slice(0, 200) + (text.length > 200 ? '…' : ''));
      if (!ok) {
        if (res.status === 405) {
          console.log('  -> 405 = deployed Edge does not allow GET. Redeploy: supabase functions deploy jarvis');
        } else {
          console.log('  -> UI will show offline. Fix: check Edge URL, JARVIS_AUTH_TOKEN, or Supabase function logs.');
        }
      }
    } catch (e) {
      console.log('Edge GET: FAILED', e instanceof Error ? e.message : e);
      console.log('  -> UI will show offline. Check network, URL, or run: supabase functions deploy jarvis');
    }
    console.log('');
  }

  try {
    const res = await fetch(`${GATEWAY_URL.replace(/\/$/, '')}/`, {
      method: 'GET',
      headers: GATEWAY_TOKEN ? { Authorization: `Bearer ${GATEWAY_TOKEN}` } : {},
      signal: AbortSignal.timeout(4000),
    });
    console.log('Gateway GET:', res.status, res.ok ? 'ok' : 'NOT ok');
  } catch (e) {
    console.log('Gateway GET: FAILED', e instanceof Error ? e.message : e);
    console.log('  -> Start gateway: node scripts/start-gateway-with-vault.js');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
