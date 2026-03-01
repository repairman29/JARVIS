#!/usr/bin/env node
/**
 * Set session.dmScope to "per-channel-peer" so Discord DMs get their own session key
 * (agent:main:DISCORD_USER_ID) with Discord delivery context. That makes the gateway
 * send replies back to the correct DM instead of losing them (e.g. sessionKey=unknown).
 *
 * Run from repo root: node scripts/enable-discord-dm-scope.js
 * Then: restart the gateway, send one DM so the gateway creates the key, then run
 *       node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID
 * to link that key to the main session (same thread).
 *
 * See DISCORD_SETUP.md § "Typing but no reply" and docs.clawd.bot/session (dmScope).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const DM_SCOPE = 'per-channel-peer';

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
    console.log('Created ~/.clawdbot');
  }
}

if (!config.session) config.session = {};
if (config.session.dmScope === DM_SCOPE) {
  console.log('session.dmScope is already "' + DM_SCOPE + '". Restart gateway, send one DM, then run add-discord-alias.js with your Discord user ID.');
  process.exit(0);
}

config.session.dmScope = DM_SCOPE;
try {
  fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
} catch (e) {
  console.error('Failed to write clawdbot.json:', e.message);
  process.exit(1);
}

console.log('Set session.dmScope to "' + DM_SCOPE + '" in ~/.clawdbot/clawdbot.json');
console.log('Next: 1) Restart the gateway. 2) Send one DM to the bot. 3) Run: node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID');
process.exit(0);
