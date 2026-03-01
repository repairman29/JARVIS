#!/usr/bin/env node
/**
 * Add a Discord user ID as a session-store alias so JARVIS can reply in DMs.
 * Run: node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID
 * Get your Discord user ID: Discord → Developer Mode on → right-click your name in the DM → Copy User ID.
 */

const fs = require('fs');
const path = require('path');

const discordId = process.argv[2];
if (!discordId || !/^\d{17,20}$/.test(discordId)) {
  console.error('Usage: node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID');
  console.error('Get your ID: Discord → Developer Mode → right-click your name in the DM → Copy User ID.');
  process.exit(1);
}

const sessionsPath = path.join(process.env.USERPROFILE || process.env.HOME, '.clawdbot', 'agents', 'main', 'sessions', 'sessions.json');
if (!fs.existsSync(sessionsPath)) {
  console.error('Session store not found:', sessionsPath);
  process.exit(1);
}

const keyMain = 'agent:main:main';
const keyAlias = `agent:main:${discordId}`;

let data;
try {
  data = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
} catch (e) {
  console.error('Failed to read sessions.json:', e.message);
  process.exit(1);
}

if (!data[keyMain]) {
  console.error('No "agent:main:main" entry in sessions.json. Start the gateway and chat once, then run this again.');
  process.exit(1);
}

// If alias already exists (e.g. gateway created it when user DMed with dmScope per-channel-peer),
// merge: use main's session so they share the same thread, keep alias's delivery context (Discord).
if (data[keyAlias]) {
  const existing = data[keyAlias];
  data[keyAlias] = {
    ...existing,
    sessionId: data[keyMain].sessionId,
    sessionFile: data[keyMain].sessionFile,
  };
  try {
    fs.writeFileSync(sessionsPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write sessions.json:', e.message);
    process.exit(1);
  }
  console.log('Updated alias agent:main:' + discordId + ' to use main session (same thread); kept Discord delivery context.');
  console.log('Restart the gateway and send another DM to the bot.');
  process.exit(0);
}

data[keyAlias] = { ...data[keyMain] };
try {
  fs.writeFileSync(sessionsPath, JSON.stringify(data, null, 2), 'utf8');
} catch (e) {
  console.error('Failed to write sessions.json:', e.message);
  process.exit(1);
}

console.log('Added session alias agent:main:' + discordId);
console.log('Restart the gateway and send another DM to the bot.');
process.exit(0);
