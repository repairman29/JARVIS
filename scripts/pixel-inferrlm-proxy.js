#!/usr/bin/env node
/**
 * Pass-through proxy: listen on ADAPTER_PORT (default 8888), forward to InferrLM (PIXEL_LLM_URL, default 127.0.0.1:8889).
 * Use when the Python inferrlm_adapter returns empty completion content; this proxy forwards the response body unchanged.
 *
 * Run on Pixel (Termux): node scripts/pixel-inferrlm-proxy.js
 * Env: ADAPTER_PORT (default 8888), PIXEL_LLM_URL (default http://127.0.0.1:8889)
 */

const http = require('http');

const ADAPTER_PORT = Number(process.env.ADAPTER_PORT || '8888');
const TARGET = (process.env.PIXEL_LLM_URL || process.env.JARVIS_PIXEL_LLM_URL || 'http://127.0.0.1:8889').replace(/\/$/, '');
const TIMEOUT_MS = Number(process.env.PIXEL_INFERRLM_PROXY_TIMEOUT_MS || '120000');

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost/');
  const path = url.pathname + url.search;
  const chunks = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    const targetUrl = new URL(path, TARGET + '/');
    const opts = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || 80,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: { ...req.headers, host: targetUrl.host },
      timeout: TIMEOUT_MS,
    };
    const proxy = http.request(opts, (pres) => {
      res.writeHead(pres.statusCode, pres.headers);
      pres.pipe(res);
    });
    proxy.on('error', (e) => {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'InferrLM unreachable: ' + e.message } }));
      }
    });
    proxy.on('timeout', () => {
      proxy.destroy();
      if (!res.headersSent) {
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { message: 'InferrLM timeout' } }));
      }
    });
    if (body.length) proxy.write(body);
    proxy.end();
  });
});

server.listen(ADAPTER_PORT, '127.0.0.1', () => {
  console.log('InferrLM proxy: %s -> %s (port %d)', '127.0.0.1:' + ADAPTER_PORT, TARGET, ADAPTER_PORT);
});
