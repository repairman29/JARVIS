#!/usr/bin/env node
/**
 * Set ntfy topic for JARVIS reports (heartbeat, plan-execute). Autonomous scripts will POST
 * the report to your ntfy topic so you get push notifications (phone, desktop) without Discord.
 *
 * Usage:
 *   node scripts/set-ntfy-topic.js jarvis-reports
 *   node scripts/set-ntfy-topic.js jarvis-reports https://ntfy.your-server.com   # self-hosted
 *   node scripts/set-ntfy-topic.js   # print current and how to set
 *
 * Subscribe: install the ntfy app (ntfy.sh or your server), subscribe to the topic. No login.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ENV_DIR = path.join(os.homedir(), '.clawdbot');
const ENV_FILE = path.join(ENV_DIR, '.env');
const KEY_TOPIC = 'NTFY_TOPIC';
const KEY_URL = 'NTFY_URL';

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

function writeEnv(updates) {
  if (!fs.existsSync(ENV_DIR)) fs.mkdirSync(ENV_DIR, { recursive: true });
  const { lines } = readEnv();
  const out = lines.filter((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    return !m || (m[1] !== KEY_TOPIC && m[1] !== KEY_URL);
  });
  if (updates[KEY_TOPIC]) out.push(`${KEY_TOPIC}=${updates[KEY_TOPIC]}`);
  if (updates[KEY_URL]) out.push(`${KEY_URL}=${updates[KEY_URL]}`);
  const content = out.join('\n').replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(ENV_FILE, content.endsWith('\n') ? content : content + '\n', 'utf8');
}

const topic = process.argv[2] && process.argv[2].trim();
const baseUrl = process.argv[3] && process.argv[3].trim();

if (topic) {
  const updates = { [KEY_TOPIC]: topic };
  if (baseUrl) updates[KEY_URL] = baseUrl.replace(/\/$/, '');
  writeEnv(updates);
  console.log('Set', KEY_TOPIC, '=', topic, 'in', ENV_FILE);
  if (baseUrl) console.log('Set', KEY_URL, '=', baseUrl);
  console.log('Heartbeat and plan-execute reports will be sent to ntfy. Subscribe to the topic in the ntfy app.');
} else {
  const { values } = readEnv();
  const currentTopic = values[KEY_TOPIC];
  const currentUrl = values[KEY_URL];
  if (currentTopic) {
    console.log('Current:', KEY_TOPIC, '=', currentTopic);
    if (currentUrl) console.log('       ', KEY_URL, '=', currentUrl);
    console.log('To change: node scripts/set-ntfy-topic.js <topic> [base_url]');
  } else {
    console.log('No ntfy topic set.');
    console.log('To use ntfy for reports (no login, push to phone/desktop):');
    console.log('  1. Install ntfy app (ntfy.sh) or use your own ntfy server');
    console.log('  2. Run: node scripts/set-ntfy-topic.js <your-topic>');
    console.log('     e.g. node scripts/set-ntfy-topic.js jarvis-reports');
    console.log('  3. Subscribe to that topic in the ntfy app');
    console.log('  4. For self-hosted: node scripts/set-ntfy-topic.js jarvis-reports https://ntfy.your-server.com');
  }
}
