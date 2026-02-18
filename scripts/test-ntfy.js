#!/usr/bin/env node
/**
 * Test ntfy: load config, print what we'd use, send a test message.
 * Run from repo root: node scripts/test-ntfy.js
 * If you see "Test notification sent" but nothing on your phone, see docs/JARVIS_NTFY_TROUBLESHOOTING.md.
 */

const { loadEnvFile } = require('./vault.js');
const http = require('http');
const https = require('https');

loadEnvFile();
const topic = process.env.JARVIS_NTFY_TOPIC || process.env.NTFY_TOPIC || '';
const baseUrl = (process.env.JARVIS_NTFY_URL || process.env.NTFY_URL || 'https://ntfy.sh').trim().replace(/\/$/, '');

if (!topic) {
  console.error('NTFY_TOPIC is not set. Run: node scripts/set-ntfy-topic.js jarvis-reports');
  process.exit(1);
}

console.log('Topic:', topic);
console.log('Server:', baseUrl);
console.log('Sending test message...');

const url = `${baseUrl}/${encodeURIComponent(topic)}`;
const parsed = new URL(url);
const lib = parsed.protocol === 'https:' ? https : http;
const body = 'JARVIS ntfy test at ' + new Date().toISOString() + '. If you see this on your device, ntfy is working.';

const req = lib.request(
  {
    method: 'POST',
    hostname: parsed.hostname,
    port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
    path: parsed.pathname + parsed.search,
    headers: { 'X-Title': 'JARVIS test', 'Content-Length': Buffer.byteLength(body, 'utf8') },
  },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Test notification sent. Check your ntfy app (topic: ' + topic + ').');
      } else {
        console.error('Server returned', res.statusCode, data || res.statusMessage);
        process.exit(1);
      }
    });
  }
);
req.on('error', (e) => {
  console.error('Request failed:', e.message);
  process.exit(1);
});
req.setTimeout(10000, () => {
  req.destroy();
  console.error('Request timed out');
  process.exit(1);
});
req.write(body, 'utf8');
req.end();
