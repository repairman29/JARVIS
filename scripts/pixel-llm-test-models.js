#!/usr/bin/env node
/**
 * Test each InferrLM model on the Pixel adapter: request by model id and see if it's used.
 * Run on the Pixel (Termux) so 127.0.0.1 is local.
 *
 * Usage:
 *   node scripts/pixel-llm-test-models.js
 *   PIXEL_LLM_TEST_URL=http://127.0.0.1:8888 node scripts/pixel-llm-test-models.js
 *
 * From Mac: ssh -p 8022 u0_a310@<pixel-ip> "cd ~/JARVIS && node scripts/pixel-llm-test-models.js"
 */

const http = require('http');

const BASE_URL = (process.env.PIXEL_LLM_TEST_URL || 'http://127.0.0.1:8888').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 90000;

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL + '/');
    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
      timeout: 10000,
    };
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function postCompletion(modelId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: 'Reply with only the word OK and nothing else.' }],
      stream: false,
    });
    const url = new URL('/v1/chat/completions', BASE_URL + '/');
    const opts = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: REQUEST_TIMEOUT_MS,
    };
    const start = Date.now();
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const ms = Date.now() - start;
        let json = null;
        let snippet = '';
        try {
          const raw = Buffer.concat(chunks).toString();
          json = JSON.parse(raw);
          const text = json.choices?.[0]?.message?.content;
          if (text) snippet = text.trim().slice(0, 80).replace(/\n/g, ' ');
        } catch (_) {}
        resolve({
          ms,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          snippet,
          error: json?.error?.message || (res.statusCode >= 400 ? `HTTP ${res.statusCode}` : ''),
        });
      });
    });
    req.on('error', (e) => reject(e));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Fetching /v1/models from', BASE_URL, '...\n');
  let modelsRes;
  try {
    modelsRes = await get('/v1/models');
  } catch (e) {
    console.error('Failed to fetch models:', e.message);
    process.exit(1);
  }
  const models = modelsRes?.data || [];
  if (models.length === 0) {
    console.log('No models in response.');
    process.exit(0);
  }
  const ids = models.map((m) => m.id);
  console.log('Testing', ids.length, 'model(s) with a single completion each:\n');

  const results = [];
  for (const model of models) {
    const id = model.id;
    process.stdout.write(`  ${id} ... `);
    try {
      const r = await postCompletion(id);
      results.push({ id, ...r });
      if (r.ok) {
        console.log(`${r.ms} ms  "${r.snippet || '(no content)'}"`);
      } else {
        console.log(`FAIL ${r.status} ${r.error || ''}`);
      }
    } catch (e) {
      results.push({ id, ok: false, error: e.message, ms: 0 });
      console.log(`ERROR ${e.message}`);
    }
  }

  const ok = results.filter((r) => r.ok);
  const fail = results.filter((r) => !r.ok);
  console.log('\n--- Summary ---');
  console.log('OK:', ok.length, '/', results.length);
  if (fail.length) console.log('Failed:', fail.map((r) => r.id).join(', '));
  if (ok.length > 1) {
    console.log('\nPer-request model selection appears to work: multiple models responded.');
    console.log('You can set PIXEL_LLM_PRIMARY_TASK_MODEL (and CHAT) to one of the ids above.');
  } else if (ok.length === 1) {
    console.log('\nOnly one model responded; InferrLM may be using a single default regardless of request model.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
