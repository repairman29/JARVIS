#!/usr/bin/env node
/**
 * Add the JARVIS webhook (push → plan-execute) to all repairman29 repos via gh CLI.
 * Skips repos that already have this webhook and archived repos.
 *
 * Usage:
 *   node scripts/add-webhook-all-repos.js
 *   WEBHOOK_URL=https://your-ngrok-or-host/webhook/github node scripts/add-webhook-all-repos.js
 *
 * Env: GITHUB_WEBHOOK_SECRET from ~/.clawdbot/.env (or pass). WEBHOOK_URL defaults to ngrok if 4040 has a tunnel.
 */

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.join(process.env.HOME || process.env.USERPROFILE, '.clawdbot', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    });
  }
}
loadEnv();

const secret = process.env.GITHUB_WEBHOOK_SECRET || '';
let url = (process.env.WEBHOOK_URL || '').trim().replace(/\/$/, '');
if (!url && !process.env.WEBHOOK_URL) {
  try {
    const j = JSON.parse(execSync('curl -s http://127.0.0.1:4040/api/tunnels', { encoding: 'utf8' }));
    const t = (j.tunnels || []).find((t) => t.public_url && t.public_url.startsWith('https://'));
    if (t) url = t.public_url.replace(/\/$/, '') + '/webhook/github';
  } catch (_) {}
}
if (!url) {
  console.error('Set WEBHOOK_URL (e.g. https://your-ngrok.ngrok-free.dev/webhook/github) or run ngrok http 18791');
  process.exit(1);
}
if (!secret) {
  console.error('Set GITHUB_WEBHOOK_SECRET in ~/.clawdbot/.env');
  process.exit(1);
}

const repos = execSync('gh repo list repairman29 --limit 500 --json nameWithOwner -q ".[].nameWithOwner"', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean)
  .sort();

let added = 0;
let skipped = 0;
let failed = 0;

for (const full of repos) {
  const r = spawnSync('gh', [
    'api', `repos/${full}/hooks`, '--method', 'POST',
    '-f', 'name=web',
    '-f', `config[url]=${url}`,
    '-f', 'config[content_type]=json',
    '-f', `config[secret]=${secret}`,
    '-f', 'events[]=push',
  ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

  if (r.status === 0) {
    console.log('OK:', full);
    added++;
  } else if (r.stderr.includes('Hook already exists')) {
    console.log('SKIP (exists):', full);
    skipped++;
  } else if (r.stderr.includes('archived') || r.stderr.includes('read-only')) {
    console.log('SKIP (archived):', full);
    skipped++;
  } else {
    console.error('FAIL:', full, r.stderr.slice(0, 80));
    failed++;
  }
}

console.log('---');
console.log('Added:', added, '| Skipped:', skipped, '| Failed:', failed);
console.log('URL:', url);
