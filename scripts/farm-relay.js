#!/usr/bin/env node
/**
 * Simple HTTP relay so the cloud (e.g. Supabase Edge) can reach the Pixel gateway.
 * Run this on a machine that has Tailscale (e.g. a VPS). It forwards requests to
 * PIXEL_GATEWAY_URL (your Pixel's Tailscale IP, e.g. http://100.75.3.115:18789).
 *
 * Env:
 *   PIXEL_GATEWAY_URL — e.g. http://100.75.3.115:18789
 *   RELAY_PORT        — default 31879
 *
 * Then set Supabase Edge secret JARVIS_GATEWAY_URL to this machine's public URL
 * (e.g. https://your-vps.example.com:31879 or use a reverse proxy to 31879).
 *
 * Usage: node scripts/farm-relay.js
 *        PIXEL_GATEWAY_URL=http://100.75.3.115:18789 node scripts/farm-relay.js
 */

const http = require('http');
const url = require('url');

const TARGET = (process.env.PIXEL_GATEWAY_URL || '').trim();
const PORT = Number(process.env.RELAY_PORT || '31879');

if (!TARGET) {
  console.error('Set PIXEL_GATEWAY_URL (e.g. http://100.75.3.115:18789)');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url || '/');
  const path = (parsed.pathname || '/') + (parsed.search || '');
  const targetUrl = TARGET.replace(/\/$/, '') + path;
  const u = new URL(targetUrl);
  const opts = {
    hostname: u.hostname,
    port: u.port || (u.protocol === 'https:' ? 443 : 80),
    path: u.pathname + u.search,
    method: req.method,
    headers: { ...req.headers, host: u.host },
  };
  const proxy = http.request(opts, (upstream) => {
    res.writeHead(upstream.statusCode, upstream.headers);
    upstream.pipe(res);
  });
  proxy.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Relay upstream error', message: err.message }));
  });
  req.pipe(proxy);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Farm relay: forwarding to ${TARGET} on port ${PORT}`);
});
