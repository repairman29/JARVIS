#!/usr/bin/env node
/**
 * Load test for Neural Farm - sends concurrent requests to test parallel processing.
 * Usage: node load-test-farm.js [--requests=10] [--concurrency=4]
 */

const http = require('http');

const FARM_URL = process.env.FARM_URL || 'http://127.0.0.1:8899';
const args = process.argv.slice(2);
const TOTAL_REQUESTS = parseInt(args.find(a => a.startsWith('--requests='))?.split('=')[1] || '10');
const CONCURRENCY = parseInt(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '4');

const prompts = [
  'What is 2 + 2?',
  'Name a color.',
  'What day comes after Monday?',
  'Capital of France?',
  'Is water wet?',
];

function sendRequest(id) {
  return new Promise((resolve) => {
    const start = Date.now();
    const prompt = prompts[id % prompts.length];
    const body = JSON.stringify({
      model: 'auto',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
    });
    
    const u = new URL(`${FARM_URL}/v1/chat/completions`);
    const opts = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const elapsed = Date.now() - start;
        const ok = res.statusCode === 200;
        let content = '';
        try {
          const json = JSON.parse(data);
          content = json.choices?.[0]?.message?.content?.slice(0, 50) || '';
        } catch {}
        resolve({ id, ok, status: res.statusCode, elapsed, content: content.replace(/\n/g, ' ') });
      });
    });
    
    req.on('error', (e) => {
      resolve({ id, ok: false, status: 0, elapsed: Date.now() - start, error: e.message });
    });
    
    req.setTimeout(60000, () => {
      req.destroy();
      resolve({ id, ok: false, status: 0, elapsed: Date.now() - start, error: 'timeout' });
    });
    
    req.write(body);
    req.end();
  });
}

async function runLoadTest() {
  console.log(`Load Test: ${TOTAL_REQUESTS} requests, ${CONCURRENCY} concurrent`);
  console.log(`Target: ${FARM_URL}`);
  console.log('---');
  
  const results = [];
  const queue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);
  const active = new Set();
  
  const processQueue = async () => {
    while (queue.length > 0 || active.size > 0) {
      while (queue.length > 0 && active.size < CONCURRENCY) {
        const id = queue.shift();
        active.add(id);
        sendRequest(id).then(result => {
          active.delete(id);
          results.push(result);
          const status = result.ok ? '✓' : '✗';
          console.log(`[${results.length}/${TOTAL_REQUESTS}] ${status} #${result.id} ${result.elapsed}ms ${result.content || result.error || ''}`);
        });
      }
      await new Promise(r => setTimeout(r, 100));
    }
  };
  
  const startTime = Date.now();
  await processQueue();
  const totalTime = Date.now() - startTime;
  
  console.log('---');
  const successful = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);
  const avgTime = successful.length ? Math.round(successful.reduce((a, r) => a + r.elapsed, 0) / successful.length) : 0;
  
  console.log(`Total: ${results.length} requests in ${totalTime}ms`);
  console.log(`Success: ${successful.length}, Failed: ${failed.length}`);
  console.log(`Avg response time: ${avgTime}ms`);
  console.log(`Throughput: ${(results.length / (totalTime / 1000)).toFixed(2)} req/s`);
}

runLoadTest().catch(console.error);
