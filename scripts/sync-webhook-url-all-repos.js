#!/usr/bin/env node
/**
 * Get current webhook URL (from ngrok 4040 API or WEBHOOK_URL) and update all repairman29 repo
 * webhooks to use it. Use after ngrok restarts (URL changes on free tier).
 *
 * Usage:
 *   node scripts/sync-webhook-url-all-repos.js
 *   WEBHOOK_URL=https://new-url.ngrok-free.dev/webhook/github node scripts/sync-webhook-url-all-repos.js
 *
 * Env: GITHUB_WEBHOOK_SECRET from ~/.clawdbot/.env. WEBHOOK_URL defaults to ngrok tunnel if 4040 is up.
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
if (!url) {
  try {
    const j = JSON.parse(execSync('curl -s http://127.0.0.1:4040/api/tunnels', { encoding: 'utf8' }));
    const t = (j.tunnels || []).find((t) => t.public_url && t.public_url.startsWith('https://'));
    if (t) url = t.public_url.replace(/\/$/, '') + '/webhook/github';
  } catch (_) {}
}
if (!url) {
  console.error('Set WEBHOOK_URL or run ngrok http 18791 (then this script can read URL from http://127.0.0.1:4040)');
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

let updated = 0;
let created = 0;
let skipped = 0;
let failed = 0;

for (const full of repos) {
  const listRaw = spawnSync('gh', ['api', `repos/${full}/hooks`], { encoding: 'utf8' });
  if (listRaw.status !== 0) {
    failed++;
    continue;
  }
  let hooks = [];
  try {
    hooks = JSON.parse(listRaw.stdout || '[]');
  } catch (_) {}

  const webHook = hooks.find((h) => h.config && (h.config.url || '').includes('webhook/github'));
  if (webHook) {
    const r = spawnSync('gh', [
      'api', `repos/${full}/hooks/${webHook.id}`, '--method', 'PATCH',
      '-f', `config[url]=${url}`,
      '-f', 'config[content_type]=json',
      '-f', `config[secret]=${secret}`,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (r.status === 0) {
      console.log('UPDATED:', full);
      updated++;
    } else {
      console.error('FAIL (patch):', full, r.stderr?.slice(0, 60));
      failed++;
    }
  } else {
    const r = spawnSync('gh', [
      'api', `repos/${full}/hooks`, '--method', 'POST',
      '-f', 'name=web',
      '-f', `config[url]=${url}`,
      '-f', 'config[content_type]=json',
      '-f', `config[secret]=${secret}`,
      '-f', 'events[]=push',
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (r.status === 0) {
      console.log('CREATED:', full);
      created++;
    } else if (r.stderr && (r.stderr.includes('archived') || r.stderr.includes('read-only'))) {
      skipped++;
    } else {
      console.error('FAIL (create):', full, r.stderr?.slice(0, 60));
      failed++;
    }
  }
}

console.log('---');
console.log('Updated:', updated, '| Created:', created, '| Skipped:', skipped, '| Failed:', failed);
console.log('URL:', url);
