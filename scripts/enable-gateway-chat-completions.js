#!/usr/bin/env node
/**
 * Ensure the Clawdbot gateway has chat completions enabled so heartbeat, plan-execute,
 * and chat UIs can POST to /v1/chat/completions. Merges gateway.http.endpoints.chatCompletions.enabled: true.
 *
 * Run from repo root (Mac or Pixel): node scripts/enable-gateway-chat-completions.js
 * On Pixel: run before or with start-jarvis-pixel.sh so autonomous scripts work.
 *
 * See apps/jarvis-ui/README.md § Enable Chat API.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');

let config = {};
if (fs.existsSync(CLAWDBOT_JSON)) {
  try {
    config = JSON.parse(fs.readFileSync(CLAWDBOT_JSON, 'utf8'));
  } catch (e) {
    console.error('Could not parse clawdbot.json:', e.message);
    process.exit(1);
  }
} else {
  if (!fs.existsSync(CLAWDBOT_DIR)) {
    fs.mkdirSync(CLAWDBOT_DIR, { recursive: true });
  }
}

if (!config.gateway) config.gateway = {};
if (!config.gateway.http) config.gateway.http = {};
if (!config.gateway.http.endpoints) config.gateway.http.endpoints = {};
if (config.gateway.http.endpoints.chatCompletions && config.gateway.http.endpoints.chatCompletions.enabled === true) {
  console.log('Chat completions already enabled in ~/.clawdbot/clawdbot.json');
  process.exit(0);
}

config.gateway.http.endpoints.chatCompletions = { enabled: true };
try {
  fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
} catch (e) {
  console.error('Failed to write clawdbot.json:', e.message);
  process.exit(1);
}

console.log('Enabled gateway chat completions in ~/.clawdbot/clawdbot.json. Restart the gateway for it to take effect.');
