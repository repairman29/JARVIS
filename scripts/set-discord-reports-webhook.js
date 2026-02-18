#!/usr/bin/env node
/**
 * Set Discord webhook URL for JARVIS reports (heartbeat, plan-execute, safety net, pipeline).
 * Writes JARVIS_ALERT_WEBHOOK_URL to ~/.clawdbot/.env so autonomous scripts and heartbeat-brief
 * post to your Discord channel.
 *
 * Usage:
 *   node scripts/set-discord-reports-webhook.js "https://discord.com/api/webhooks/123/abc..."
 *   node scripts/set-discord-reports-webhook.js   # prints current and how to set
 *
 * Get a webhook: Discord → Channel → Edit Channel → Integrations → Webhooks → New Webhook → Copy URL.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ENV_DIR = path.join(os.homedir(), '.clawdbot');
const ENV_FILE = path.join(ENV_DIR, '.env');
const KEY = 'JARVIS_ALERT_WEBHOOK_URL';
const KEY_ALT = 'DISCORD_WEBHOOK_URL';

function readEnv() {
  if (!fs.existsSync(ENV_FILE)) return { lines: [], values: {} };
  const raw = fs.readFileSync(ENV_FILE, 'utf8');
  const lines = raw.split(/\r?\n/);
  const values = {};
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) values[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return { lines, values };
}

function writeEnv(webhookUrl) {
  if (!fs.existsSync(ENV_DIR)) fs.mkdirSync(ENV_DIR, { recursive: true });
  const { lines, values } = readEnv();
  const out = lines.filter((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    return !m || (m[1] !== KEY && m[1] !== KEY_ALT);
  });
  out.push(`${KEY}=${webhookUrl}`);
  const content = out.join('\n').replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(ENV_FILE, content.endsWith('\n') ? content : content + '\n', 'utf8');
}

const url = process.argv[2] && process.argv[2].trim();

if (url) {
  if (!url.startsWith('https://discord.com/api/webhooks/')) {
    console.error('URL should look like: https://discord.com/api/webhooks/<id>/<token>');
    process.exit(1);
  }
  writeEnv(url);
  console.log('Set JARVIS_ALERT_WEBHOOK_URL in', ENV_FILE);
  console.log('Heartbeat, plan-execute, and safety-net reports will post to that Discord channel.');
} else {
  const { values } = readEnv();
  const current = values[KEY] || values[KEY_ALT];
  if (current) {
    console.log('Current webhook (set):', current.replace(/\/[^/]+$/, '/...'));
    console.log('To change: node scripts/set-discord-reports-webhook.js "https://discord.com/api/webhooks/..."');
  } else {
    console.log('No Discord reports webhook set.');
    console.log('To enable reports in Discord:');
    console.log('  1. Discord → your server → channel → Edit Channel → Integrations → Webhooks → New Webhook');
    console.log('  2. Copy the webhook URL');
    console.log('  3. Run: node scripts/set-discord-reports-webhook.js "https://discord.com/api/webhooks/..."');
    console.log('');
    console.log('Scripts that will post there: jarvis-autonomous-heartbeat.js, jarvis-autonomous-plan-execute.js, heartbeat-brief.js, run-team-pipeline.js --webhook, safety-net alerts.');
  }
}
