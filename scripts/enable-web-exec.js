#!/usr/bin/env node
/**
 * Enable elevated exec for requests from the web UI (webchat channel).
 * Sets tools.elevated.allowFrom.webchat = ["*"] in:
 *   - ~/.clawdbot/clawdbot.json (local gateway)
 *   - config/railway-openclaw.json (cloud gateway; redeploy Railway to apply)
 * So JARVIS can run beast-mode, set-focus-repo, etc. from the web for both local and cloud.
 *
 * Run from repo root: node scripts/enable-web-exec.js
 * Then: restart local gateway; redeploy Railway if you use cloud.
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

// Also set in cloud config (Railway uses config/railway-openclaw.json at deploy)
const repoRoot = path.resolve(__dirname, '..');
const railwayConfigPath = path.join(repoRoot, 'config', 'railway-openclaw.json');
if (fs.existsSync(railwayConfigPath)) {
  let railway = JSON.parse(fs.readFileSync(railwayConfigPath, 'utf8'));
  railway.tools = railway.tools || {};
  railway.tools.elevated = railway.tools.elevated || { enabled: false, allowFrom: {} };
  railway.tools.elevated.enabled = true;
  if (!railway.tools.elevated.allowFrom) railway.tools.elevated.allowFrom = {};
  railway.tools.elevated.allowFrom.webchat = ['*'];
  fs.writeFileSync(railwayConfigPath, JSON.stringify(railway, null, 2), 'utf8');
  console.log('Set tools.elevated.allowFrom.webchat = ["*"] in', railwayConfigPath);
  console.log('Redeploy Railway (e.g. railway up or push to main) for cloud gateway to allow web exec.');
}

console.log('Restart the local gateway for the change to take effect.');
console.log('See docs/JARVIS_WEB_EXEC.md for security notes and local vs cloud gateway.');
