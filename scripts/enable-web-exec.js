#!/usr/bin/env node
/**
 * Enable elevated exec for requests from the web UI (webchat channel).
 * Sets tools.elevated.allowFrom.webchat = ["*"] so JARVIS can run beast-mode, code-roach, etc. from the web.
 *
 * Run from repo root: node scripts/enable-web-exec.js
 * Restart the gateway after running.
 *
 * See docs/JARVIS_WEB_EXEC.md for why exec is blocked from web and security notes.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.clawdbot', 'clawdbot.json');

if (!fs.existsSync(configPath)) {
  console.error('Config not found:', configPath);
  console.error('Create it first (e.g. run gateway once or copy from config/railway-openclaw.json).');
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error('Could not parse clawdbot.json:', e.message);
  process.exit(1);
}

config.tools = config.tools || {};
config.tools.elevated = config.tools.elevated || { enabled: false, allowFrom: {} };
config.tools.elevated.enabled = true;
if (!config.tools.elevated.allowFrom) config.tools.elevated.allowFrom = {};
config.tools.elevated.allowFrom.webchat = ['*'];

fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
console.log('Set tools.elevated.allowFrom.webchat = ["*"] in', configPath);
console.log('Restart the gateway for the change to take effect.');
console.log('See docs/JARVIS_WEB_EXEC.md for security notes and local vs cloud gateway.');
