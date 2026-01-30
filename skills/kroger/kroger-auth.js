#!/usr/bin/env node
/**
 * Simple Kroger OAuth helper - works with Postman callback URL
 * 
 * Usage:
 *   node skills/kroger/kroger-auth.js           # Opens browser, then prompts for code
 *   node skills/kroger/kroger-auth.js <code>    # Exchange code directly
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const KROGER_BASE = 'https://api.kroger.com/v1';
const AUTH_URL = `${KROGER_BASE}/connect/oauth2/authorize`;
const TOKEN_URL = `${KROGER_BASE}/connect/oauth2/token`;
const REDIRECT_URI = 'https://oauth.pstmn.io/v1/callback';
const SCOPES = 'cart.basic:write profile.compact';

// Load env
function loadEnv() {
  const candidates = [
    path.join(process.env.HOME || '', '.clawdbot', '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const p of candidates) {
    try {
      const content = fs.readFileSync(p, 'utf8');
      content.split('\n').forEach((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
      });
    } catch (_) {}
  }
}

loadEnv();

const clientId = process.env.KROGER_CLIENT_ID;
const clientSecret = process.env.KROGER_CLIENT_SECRET;

if (!clientId || !clientSecret || clientId.startsWith('your_')) {
  console.error('Set KROGER_CLIENT_ID and KROGER_CLIENT_SECRET in ~/.clawdbot/.env');
  process.exit(1);
}

// Save refresh token to .env
function saveRefreshToken(token) {
  const envPath = path.join(process.env.HOME || '', '.clawdbot', '.env');
  let content = '';
  try {
    content = fs.readFileSync(envPath, 'utf8');
  } catch (_) {}
  
  const lines = content.split('\n');
  let found = false;
  const updated = lines.map((line) => {
    if (line.startsWith('KROGER_REFRESH_TOKEN=')) {
      found = true;
      return `KROGER_REFRESH_TOKEN=${token}`;
    }
    return line;
  });
  if (!found) updated.push(`KROGER_REFRESH_TOKEN=${token}`);
  
  fs.writeFileSync(envPath, updated.join('\n'), 'utf8');
  return true;
}

// Exchange code for tokens
async function exchangeCode(code) {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code.trim(),
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.error || `HTTP ${res.status}`);
  }
  return data;
}

async function main() {
  const codeArg = process.argv[2];
  
  // Generate auth URL
  const state = require('crypto').randomBytes(16).toString('hex');
  const authUrl = `${AUTH_URL}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&state=${state}`;
  
  if (!codeArg) {
    console.log('\n1. Opening browser for Kroger login...\n');
    const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    require('child_process').exec(`${open} "${authUrl}"`, () => {});
    
    console.log('2. After logging in, copy the "code" value from the redirect URL');
    console.log('   (It looks like: https://oauth.pstmn.io/v1/callback?code=XXXXXX&state=...)\n');
    
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('3. Paste the code here: ', async (code) => {
      rl.close();
      await doExchange(code);
    });
  } else {
    await doExchange(codeArg);
  }
}

async function doExchange(code) {
  if (!code || code.trim().length === 0) {
    console.error('No code provided');
    process.exit(1);
  }
  
  // Extract code from URL if full URL was pasted
  if (code.includes('code=')) {
    const match = code.match(/code=([^&]+)/);
    if (match) code = match[1];
  }
  
  console.log('\nExchanging code for tokens...');
  
  try {
    const tokens = await exchangeCode(code);
    saveRefreshToken(tokens.refresh_token);
    console.log('\n✓ Success! Refresh token saved to ~/.clawdbot/.env');
    console.log('\nYour Kroger cart integration is ready. Test with:');
    console.log('  node skills/kroger/try-cart.js\n');
  } catch (e) {
    console.error('\n✗ Failed:', e.message);
    console.error('\nThe code may have expired. Try again with a fresh login.\n');
    process.exit(1);
  }
}

main().catch(console.error);
