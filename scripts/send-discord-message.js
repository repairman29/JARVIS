#!/usr/bin/env node
/**
 * Send a message to a Discord channel as JARVIS (REST API; no WebSocket).
 * Uses same token as check-discord-bot.js (Vault or ~/.clawdbot/.env).
 * Token should be for the JARVIS bot (repo JARVIS), not JARVIS ROG Ed.
 *
 * Usage:
 *   node scripts/send-discord-message.js <channel_id> <message>
 *   node scripts/send-discord-message.js --list-channels   # list channels in first guild
 *   CHANNEL_ID=123 node scripts/send-discord-message.js "Hello from script"
 */

const https = require('https');
const { loadEnvFile, resolveEnv } = require('./vault.js');

function request(method, url, token, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json',
      },
    };
    if (body) {
      const data = JSON.stringify(body);
      opts.headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = https.request(opts, (res) => {
      let out = '';
      res.on('data', (c) => (out += c));
      res.on('end', () => {
        try {
          const parsed = out ? JSON.parse(out) : null;
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(new Error(`${res.statusCode} ${out}`));
        } catch (e) {
          reject(res.statusCode >= 200 && res.statusCode < 300 ? e : new Error(`${res.statusCode} ${out}`));
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const env = loadEnvFile();
  const token =
    (await resolveEnv('DISCORD_BOT_TOKEN', env)) || process.env.DISCORD_BOT_TOKEN || env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('DISCORD_BOT_TOKEN not set. See check-discord-bot.js.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (args[0] === '--list-channels') {
    const guilds = await request('GET', 'https://discord.com/api/v10/users/@me/guilds', token);
    if (!guilds.length) {
      console.error('Bot is in no guilds.');
      process.exit(1);
    }
    const guildId = guilds[0].id;
    const channels = await request(
      'GET',
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      token
    );
    const text = channels.filter((c) => c.type === 0); // GUILD_TEXT
    console.log('JARVIS — Guild:', guilds[0].name, `(${guildId})`);
    console.log('Text channels:');
    text.forEach((c) => console.log('  ', c.id, c.name));
    return;
  }

  let channelId = process.env.CHANNEL_ID || args[0];
  let content = process.env.CHANNEL_ID ? args[0] : args[1];
  if (!channelId || !content) {
    console.error('Usage: node scripts/send-discord-message.js <channel_id> <message>');
    console.error('   or: node scripts/send-discord-message.js --list-channels');
    process.exit(1);
  }

  await request('POST', `https://discord.com/api/v10/channels/${channelId}/messages`, token, {
    content: String(content),
  });
  console.log('JARVIS: sent to channel', channelId);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
