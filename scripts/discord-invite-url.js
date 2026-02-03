#!/usr/bin/env node
/**
 * Print the Discord bot invite URL for the bot whose token is in ~/.clawdbot/.env
 * (DISCORD_BOT_TOKEN) or Vault. Open the URL in a browser to add the bot to a server.
 *
 * Run: node scripts/discord-invite-url.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadEnvFile, resolveEnv } = require('./vault.js');

async function main() {
  const env = loadEnvFile();
  const token =
    (await resolveEnv('DISCORD_BOT_TOKEN', env)) ||
    process.env.DISCORD_BOT_TOKEN ||
    env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('DISCORD_BOT_TOKEN not set. See check-discord-bot.js.');
    process.exit(1);
  }
  const b64 = token.split('.')[0];
  const clientId = Buffer.from(b64, 'base64').toString('utf8');
  // View Channel (1024) + Send Messages (2048) + Read Message History (65536) + Embed Links (16384) + Attach Files (32768) + Use Slash Commands (2147483648)
  const perms = String(1024 + 2048 + 65536 + 16384 + 32768 + 2147483648);
  const url =
    'https://discord.com/oauth2/authorize?client_id=' +
    clientId +
    '&permissions=' +
    perms +
    '&integration_type=0&scope=bot%20applications.commands';
  console.log('Invite this bot to a server (open in browser):');
  console.log(url);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
