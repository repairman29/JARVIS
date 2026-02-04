#!/usr/bin/env node
/**
 * Remove gateway.commands from ~/.clawdbot/clawdbot.json so clawdbot CLI accepts the config.
 * Some clawdbot versions reject unknown keys; gateway.commands is not in the schema.
 * Run from repo root: node scripts/fix-clawdbot-config.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.clawdbot', 'clawdbot.json');
if (!fs.existsSync(configPath)) {
  console.log('No config at', configPath);
  process.exit(0);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (e) {
  console.error('Could not parse config:', e.message);
  process.exit(1);
}

if (!config.gateway || !config.gateway.commands) {
  console.log('Config has no gateway.commands; nothing to remove.');
  process.exit(0);
}

delete config.gateway.commands;
if (Object.keys(config.gateway).length === 0) delete config.gateway;

fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
console.log('Removed gateway.commands from', configPath);
console.log('CLI (clawdbot agent) should work now. To allow JARVIS to restart gateway from Discord, add "commands": { "restart": true } under "gateway" only if your clawdbot version supports it.');