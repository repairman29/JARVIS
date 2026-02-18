#!/usr/bin/env node
/**
 * Guided Notion integration setup: open My Integrations in your browser, then save the token to ~/.clawdbot/.env.
 * JARVIS cannot create the account or integration for you—Notion requires you to log in and click through.
 *
 * Usage: node scripts/setup-notion-integration.js
 *        node scripts/setup-notion-integration.js "ntn_xxxx"   # or pass token as first arg
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const NOTION_MY_INTEGRATIONS = 'https://www.notion.so/my-integrations';

function getEnvPath() {
  const candidates = [
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.clawdbot', '.env') : null,
    process.env.HOME ? path.join(process.env.HOME, '.clawdbot', '.env') : null,
    path.join(os.homedir(), '.clawdbot', '.env'),
  ].filter(Boolean);
  return candidates.find((c) => fs.existsSync(c)) || path.join(os.homedir(), '.clawdbot', '.env');
}

function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  require('child_process').spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve((answer || '').trim());
    });
  });
}

function writeNotionKey(envPath, token) {
  const dir = path.dirname(envPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  let text = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const key = 'NOTION_API_KEY';
  const line = `${key}=${token}\n`;
  if (new RegExp(`^\\s*${key}\\s*=`, 'm').test(text)) {
    text = text.replace(new RegExp(`^\\s*${key}\\s*=.*$`, 'm'), `${key}=${token}`);
  } else {
    text = text.trimEnd() + (text ? '\n' : '') + line;
  }
  fs.writeFileSync(envPath, text, 'utf8');
}

async function main() {
  let token = process.argv[2] && process.argv[2].trim();
  if (token) {
    console.log('Using token from command line.');
  } else {
    console.log('Notion integration setup (you do the browser steps; this script saves the token).\n');
    console.log('1. Opening My Integrations in your browser…');
    openUrl(NOTION_MY_INTEGRATIONS);
    console.log('2. In the browser: sign in to Notion if needed → + New integration → name it (e.g. JARVIS) → select workspace → Create.');
    console.log('3. On the integration page: ⋯ menu → Copy internal integration token.\n');
    token = await prompt('Paste the token here (starts with ntn_ or secret_): ');
  }
  if (!token) {
    console.error('No token provided. Run again and paste the token, or: node scripts/setup-notion-integration.js "ntn_xxxx"');
    process.exit(1);
  }
  const envPath = getEnvPath();
  writeNotionKey(envPath, token);
  console.log('\nSaved NOTION_API_KEY to', envPath);
  console.log('Next: Share pages with your integration (each page → ⋯ → Add connections → your integration).');
  console.log('Then restart the gateway so it picks up the key.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
