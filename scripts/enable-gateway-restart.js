#!/usr/bin/env node
/**
 * Set gateway.commands.restart = true and ensure tools.elevated allows Discord
 * so JARVIS can restart the gateway when you ask from Discord.
 *
 * Run from repo root: node scripts/enable-gateway-restart.js
 * Optionally: node scripts/enable-gateway-restart.js YOUR_DISCORD_USER_ID
 *
 * If JARVIS still says "restriction on restarting", add your Discord user ID to
 * tools.elevated.allowFrom.discord (this script does that when you pass it as arg).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.clawdbot', 'clawdbot.json');
const discordUserId = process.argv[2] || process.env.JARVIS_DISCORD_USER_ID;

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

// Elevated must be enabled and your Discord ID allowed so JARVIS can run restart from Discord.
// We do not set gateway.commands.restart here because some clawdbot versions reject unknown
// config keys and the CLI (clawdbot agent) would fail. If your gateway supports it, add
// "commands": { "restart": true } under "gateway" in clawdbot.json manually. See RUNBOOK.
config.tools = config.tools || {};
config.tools.elevated = config.tools.elevated || { enabled: false, allowFrom: {} };
config.tools.elevated.enabled = true;
if (!config.tools.elevated.allowFrom) config.tools.elevated.allowFrom = {};
if (!config.tools.elevated.allowFrom.discord) config.tools.elevated.allowFrom.discord = [];
if (discordUserId && /^\d{17,20}$/.test(discordUserId)) {
  if (!config.tools.elevated.allowFrom.discord.includes(discordUserId)) {
    config.tools.elevated.allowFrom.discord.push(discordUserId);
    console.log('Added Discord user ID to tools.elevated.allowFrom.discord');
  }
} else if (!config.tools.elevated.allowFrom.discord.length) {
  console.log('Tip: pass your Discord user ID so JARVIS can restart from Discord:');
  console.log('  node scripts/enable-gateway-restart.js YOUR_DISCORD_USER_ID');
  console.log('  (Discord → Developer Mode → right-click your name → Copy User ID)');
}

fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
console.log('Set tools.elevated.enabled = true and Discord allowlist in', configPath);
console.log('Restart the gateway once manually for the change to take effect.');
console.log('To allow JARVIS to restart the gateway from Discord, add "commands": { "restart": true } under "gateway" in clawdbot.json if your clawdbot version supports it (see RUNBOOK).');
