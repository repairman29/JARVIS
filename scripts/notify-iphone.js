#!/usr/bin/env node
/**
 * Send push notifications to iPhone (or any device) via ntfy.sh.
 * Works on Mac (testing) and Pixel/Termux.
 *
 * Usage:
 *   node scripts/notify-iphone.js "Title" "Message body"
 *   node scripts/notify-iphone.js --priority high "Gateway Down" "The gateway is not responding"
 *   node scripts/notify-iphone.js --tags "robot" "JARVIS" "Task completed"
 *
 * As module:
 *   const { notify } = require('./notify-iphone.js')
 *   await notify('JARVIS Alert', 'Heartbeat failed', { priority: 'high', tags: 'warning' })
 *
 * Env:
 *   JARVIS_NTFY_TOPIC — ntfy topic (default: jarvis-repairman29-alerts)
 *   JARVIS_NTFY_URL  — ntfy base URL (default: https://ntfy.sh)
 *   JARVIS_CLICK_URL — URL to open when notification is tapped (e.g. gateway web UI)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const DEFAULT_TOPIC = 'jarvis-repairman29-alerts';
const VALID_PRIORITIES = ['min', 'low', 'default', 'high', 'urgent'];

function parseArgs(argv = process.argv.slice(2)) {
  const args = { title: '', message: '', priority: 'default', tags: '', click: '' };
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--priority' && argv[i + 1]) {
      args.priority = argv[++i];
    } else if (arg === '--tags' && argv[i + 1]) {
      args.tags = argv[++i];
    } else if (arg === '--click' && argv[i + 1]) {
      args.click = argv[++i];
    } else if (!arg.startsWith('--')) {
      positional.push(arg);
    }
  }

  if (positional.length >= 2) {
    args.title = positional[0];
    args.message = positional.slice(1).join(' ');
  } else if (positional.length === 1) {
    args.title = 'JARVIS';
    args.message = positional[0];
  }

  return args;
}

/**
 * Send a push notification via ntfy.sh.
 * @param {string} title - Notification title
 * @param {string} message - Message body
 * @param {object} opts - Optional: { priority, tags, click }
 * @returns {Promise<number>} HTTP status code
 */
async function notify(title, message, opts = {}) {
  const topic = (process.env.JARVIS_NTFY_TOPIC || process.env.NTFY_TOPIC || DEFAULT_TOPIC).trim();
  const baseUrl = (process.env.JARVIS_NTFY_URL || process.env.NTFY_URL || 'https://ntfy.sh').trim().replace(/\/$/, '');
  const clickUrl = opts.click || process.env.JARVIS_CLICK_URL || process.env.JARVIS_GATEWAY_URL || process.env.NEXT_PUBLIC_GATEWAY_URL || '';

  let priority = (opts.priority || 'default').toLowerCase();
  if (!VALID_PRIORITIES.includes(priority)) {
    priority = 'default';
  }

  const headers = {
    'Title': String(title || 'JARVIS').slice(0, 255),
    'Priority': priority,
  };
  if (opts.tags) {
    headers['Tags'] = String(opts.tags).slice(0, 255);
  }
  if (clickUrl) {
    headers['Click'] = String(clickUrl).trim();
  }

  const body = String(message || '').slice(0, 4000);
  const url = `${baseUrl}/${encodeURIComponent(topic)}`;
  const parsed = new URL(url);
  const lib = parsed.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        method: 'POST',
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(body, 'utf8'),
        },
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.statusCode));
      }
    );
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('ntfy timeout'));
    });
    req.write(body, 'utf8');
    req.end();
  });
}

function main() {
  const args = parseArgs();

  if (!args.title && !args.message) {
    console.error('Usage: node scripts/notify-iphone.js [--priority min|low|default|high|urgent] [--tags "tag1,tag2"] [--click URL] "Title" "Message"');
    process.exit(1);
  }

  notify(args.title, args.message, {
    priority: args.priority,
    tags: args.tags || undefined,
    click: args.click || undefined,
  })
    .then((code) => {
      if (code >= 200 && code < 300) {
        console.log('Notification sent.');
      } else {
        console.error('ntfy returned', code);
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('ntfy failed:', err.message);
      process.exit(1);
    });
}

if (require.main === module) {
  main();
} else {
  module.exports = { notify, parseArgs };
}
