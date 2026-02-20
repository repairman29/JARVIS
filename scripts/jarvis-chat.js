#!/usr/bin/env node
/**
 * Lightweight chat client: send prompts from your Mac to JARVIS on the Pixel (over WiFi).
 * No npm deps. Uses the Pixel's chat server (port 18888) or gateway (18789).
 *
 * One-shot:   node scripts/jarvis-chat.js "what's the weather"
 *             jarvis-chat "remind me to call mom"
 * Interactive: node scripts/jarvis-chat.js
 *             jarvis-chat
 *
 * Pixel IP: JARVIS_PIXEL_IP env, or .pixel-ip in repo root, or first arg: jarvis-chat 192.168.1.50 "hello"
 */

const http = require('http');
const readline = require('readline');

const CHAT_PORT = Number(process.env.JARVIS_CHAT_PORT || process.env.JARVIS_PIXEL_PORT || '18888');
const CHAT_TIMEOUT_MS = Number(process.env.JARVIS_CHAT_TIMEOUT_MS || '90000'); // 90s; chat should be fast (Nano) when router + bridge are on
const DEFAULT_IP = '192.168.86.209';

function getPixelIP() {
  if (process.env.JARVIS_PIXEL_IP) return process.env.JARVIS_PIXEL_IP.trim();
  const path = require('path');
  const fs = require('fs');
  const root = path.resolve(__dirname, '..');
  const cache = path.join(root, '.pixel-ip');
  if (fs.existsSync(cache)) {
    const ip = fs.readFileSync(cache, 'utf8').trim().replace(/\r\n/g, '');
    if (ip) return ip;
  }
  return DEFAULT_IP;
}

function chat(host, message, stream = false) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'openclaw:main',
      messages: [{ role: 'user', content: message }],
      stream: false,
      user: 'jarvis-chat-mac',
    });
    const opts = {
      hostname: host,
      port: CHAT_PORT,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-openclaw-agent-id': 'main',
      },
      timeout: CHAT_TIMEOUT_MS,
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (ch) => { data += ch; });
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
          if (content != null) return resolve(content);
          const err = (j.error && j.error.message) || data || 'No reply';
          reject(new Error(err));
        } catch (e) {
          reject(new Error(data || e.message));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout after ' + (CHAT_TIMEOUT_MS / 1000) + 's')); });
    req.write(body);
    req.end();
  });
}

function main() {
  const args = process.argv.slice(2);
  let host = getPixelIP();
  let oneShot = null;

  if (args.length >= 1 && !args[0].startsWith('-')) {
    if (args[0].match(/^\d+\.\d+\.\d+\.\d+$/)) {
      host = args[0];
      if (args[1] != null) oneShot = args.slice(1).join(' ').trim();
    } else {
      oneShot = args.join(' ').trim();
    }
  }

  if (oneShot) {
    chat(host, oneShot)
      .then((reply) => { console.log(reply); })
      .catch((err) => { console.error('Error:', err.message); process.exit(1); });
    return;
  }

  // Interactive
  console.log(`JARVIS on Pixel (${host}:${CHAT_PORT}). Type a message and press Enter. Empty line or Ctrl+C to exit.\n`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  function prompt() {
    rl.question('You: ', (line) => {
      const msg = (line || '').trim();
      if (!msg) { rl.close(); return; }
      console.log('JARVIS: ');
      chat(host, msg)
        .then((reply) => {
          console.log(reply);
          console.log('');
          prompt();
        })
        .catch((err) => {
          console.error(err.message);
          console.log('');
          prompt();
        });
    });
  }
  prompt();
}

main();
