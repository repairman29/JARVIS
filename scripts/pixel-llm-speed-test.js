#!/usr/bin/env node
/**
 * Speed test for Pixel LLM backends. Run on the Pixel (Termux) so 127.0.0.1 is local.
 * Measures latency (ms) for a small chat completion per backend.
 *
 * Usage:
 *   node scripts/pixel-llm-speed-test.js
 *   PIXEL_LLM_SPEED_ITERATIONS=3 node scripts/pixel-llm-speed-test.js
 *
 * From Mac (run on Pixel via SSH):
 *   ssh -p 8022 u0_a310@<pixel-ip> "cd ~/JARVIS && node scripts/pixel-llm-speed-test.js"
 */

const http = require('http');

const BACKENDS = [
  { name: 'Pixel InferrLM (8888)', url: 'http://127.0.0.1:8888' },
  { name: 'iPhone adapter (8887)', url: 'http://127.0.0.1:8887' },
  { name: 'Gemini Nano (8890)', url: 'http://127.0.0.1:8890' },
];

const BODY = JSON.stringify({
  model: 'openclaw:main',
  messages: [{ role: 'user', content: 'Say exactly: ok' }],
  stream: false,
});

const ITERATIONS = Math.max(1, parseInt(process.env.PIXEL_LLM_SPEED_ITERATIONS || '2', 10));
const REQUEST_TIMEOUT_MS = 60000;

function postOne(baseUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL('/v1/chat/completions', baseUrl + '/');
    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(BODY) },
      timeout: REQUEST_TIMEOUT_MS,
    };
    const start = Date.now();
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const ms = Date.now() - start;
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        resolve({ ms, ok, status: res.statusCode });
      });
    });
    req.on('error', (e) => reject(e));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.write(BODY);
    req.end();
  });
}

async function testBackend(backend) {
  const times = [];
  let lastError = null;
  for (let i = 0; i < ITERATIONS; i++) {
    try {
      const r = await postOne(backend.url);
      if (r.ok) times.push(r.ms);
      else lastError = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastError = e;
    }
  }
  if (times.length === 0) {
    return { name: backend.name, url: backend.url, ok: false, error: (lastError && lastError.message) || 'no response' };
  }
  const sum = times.reduce((a, b) => a + b, 0);
  return {
    name: backend.name,
    url: backend.url,
    ok: true,
    ms: Math.round(sum / times.length),
    min: Math.min(...times),
    max: Math.max(...times),
    runs: times.length,
  };
}

async function main() {
  console.log('Pixel LLM speed test (run on Pixel; each backend', ITERATIONS, 'request(s))\n');
  const results = [];
  for (const backend of BACKENDS) {
    process.stdout.write(`  ${backend.name} ... `);
    const r = await testBackend(backend);
    results.push(r);
    if (r.ok) {
      console.log(`${r.ms} ms avg (min ${r.min} max ${r.max})`);
    } else {
      console.log(`failed: ${r.error}`);
    }
  }
  const ok = results.filter((r) => r.ok);
  if (ok.length > 1) {
    ok.sort((a, b) => a.ms - b.ms);
    console.log('\n  Fastest for simple reply:', ok[0].name, `(${ok[0].ms} ms)`);
  }
  if (ok.length > 0) {
    console.log('\n  Use PIXEL_LLM_ROUTE=primary and set PIXEL_LLM_PRIMARY to the fastest URL for that backend.');
    console.log('  Use PIXEL_LLM_ROUTE=chat-task to send chat (short convos) to Nano and tasks to InferrLM.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
