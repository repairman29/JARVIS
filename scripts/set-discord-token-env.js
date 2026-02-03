#!/usr/bin/env node
/**
 * Set DISCORD_BOT_TOKEN in ~/.clawdbot/.env to the given token.
 * Use this when you have the new JARVIS bot token and want it to take effect
 * immediately (scripts and gateway prefer .env over Vault for Discord).
 *
 * Usage: node scripts/set-discord-token-env.js "<your_new_bot_token>"
 * Then:  node scripts/check-discord-bot.js
 *        node scripts/start-gateway-with-vault.js  # restart gateway
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function getEnvPath() {
  const candidates = [
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.clawdbot', '.env') : null,
    process.env.HOME ? path.join(process.env.HOME, '.clawdbot', '.env') : null,
    path.join(os.homedir(), '.clawdbot', '.env')
  ].filter(Boolean);
  return candidates.find((c) => fs.existsSync(c)) || path.join(os.homedir(), '.clawdbot', '.env');
}

const token = process.argv[2];
if (!token || token.trim() === '') {
  console.error('Usage: node scripts/set-discord-token-env.js "<your_new_bot_token>"');
  process.exit(1);
}

const envPath = getEnvPath();
const dir = path.dirname(envPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let text = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const key = 'DISCORD_BOT_TOKEN';
const line = `${key}=${token.trim()}\n`;

if (new RegExp(`^\\s*${key}\\s*=`, 'm').test(text)) {
  text = text.replace(new RegExp(`^\\s*${key}\\s*=.*$`, 'm'), `${key}=${token.trim()}`);
} else {
  text = text.trimEnd() + (text ? '\n' : '') + line;
}

fs.writeFileSync(envPath, text, 'utf8');
console.log('Updated', key, 'in', envPath);
console.log('Run: node scripts/check-discord-bot.js');
console.log('Then restart gateway: node scripts/start-gateway-with-vault.js');
