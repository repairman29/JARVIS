#!/usr/bin/env node
/**
 * Send an audit event to the JARVIS Edge function (writes to jarvis_audit_log).
 * Use from scripts, cron, or after exec to record who ran what when.
 *
 * Usage:
 *   node scripts/audit-log.js <event_action> [details...]
 *   node scripts/audit-log.js exec "npm run build" --channel webchat --actor cron
 *
 * Env: JARVIS_EDGE_URL (or NEXT_PUBLIC_JARVIS_EDGE_URL from .env), JARVIS_AUTH_TOKEN for Bearer auth.
 * Run from repo root. See docs/JARVIS_AUDIT_LOG.md.
 */

const https = require('https');
const http = require('http');

function loadEnv() {
  const path = require('path');
  const fs = require('fs');
  const envPath = path.join(process.env.HOME || process.env.USERPROFILE, '.clawdbot', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  }
}

loadEnv();

const EDGE_URL = (process.env.JARVIS_EDGE_URL || process.env.NEXT_PUBLIC_JARVIS_EDGE_URL || '').trim();
const TOKEN = (process.env.JARVIS_AUTH_TOKEN || '').trim();

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) return null;
  const eventAction = args[0];
  const detailParts = [];
  let channel = null;
  let sessionId = null;
  let actor = null;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--channel' && args[i + 1]) {
      channel = args[++i];
    } else if (args[i] === '--session' && args[i + 1]) {
      sessionId = args[++i];
    } else if (args[i] === '--actor' && args[i + 1]) {
      actor = args[++i];
    } else if (!args[i].startsWith('--')) {
      detailParts.push(args[i]);
    }
  }
  const detailsStr = detailParts.join(' ').trim() || null;
  const details = detailsStr ? { cmd: detailsStr, raw: detailsStr } : null;
  return { eventAction, details, channel, session_id: sessionId, actor };
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const isHttps = u.protocol === 'https:';
    const data = JSON.stringify(body);
    const opts = {
      hostname: u.hostname,
      port: u.port || (isHttps ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    if (TOKEN) opts.headers['Authorization'] = `Bearer ${TOKEN}`;
    const mod = isHttps ? https : http;
    const req = mod.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ ok: true });
        else reject(new Error(buf || res.statusMessage));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function main() {
  const parsed = parseArgs();
  if (!parsed || !parsed.eventAction) {
    console.error('Usage: node scripts/audit-log.js <event_action> [details] [--channel CH] [--session ID] [--actor WHO]');
    console.error('  e.g. node scripts/audit-log.js exec "npm run build" --channel webchat --actor cron');
    process.exit(1);
  }
  if (!EDGE_URL) {
    console.error('Set JARVIS_EDGE_URL or NEXT_PUBLIC_JARVIS_EDGE_URL (e.g. in ~/.clawdbot/.env)');
    process.exit(1);
  }
  const body = {
    action: 'audit_log',
    event_action: parsed.eventAction,
    details: parsed.details ?? null,
    channel: parsed.channel || null,
    session_id: parsed.session_id || null,
    actor: parsed.actor || null,
  };
  post(EDGE_URL.replace(/\/$/, ''), body)
    .then(() => console.log('Audit log ok'))
    .catch((e) => {
      console.error('Audit log failed:', e.message);
      process.exit(1);
    });
}

main();
