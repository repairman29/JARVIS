#!/usr/bin/env node
/**
 * One-time OAuth helper: get Kroger refresh_token for add-to-cart.
 * 1. Set KROGER_CLIENT_ID and KROGER_CLIENT_SECRET in .env (or export).
 * 2. In Kroger Developer Portal, add redirect URI: http://localhost:3456/callback (or use --postman and your Postman callback URL).
 * 3. Run: node skills/kroger/oauth-helper.js   OR   node skills/kroger/oauth-helper.js --postman
 * 4. Log in with your Kroger account; copy the refresh_token (from terminal or from Postman token exchange).
 * 5. Add KROGER_REFRESH_TOKEN=<that_value> to ~/.clawdbot/.env
 */

const http = require('http');
const { URL } = require('url');

const usePostman = process.argv.includes('--postman');
const PORT = Number(process.env.KROGER_OAUTH_PORT) || 3456;
const REDIRECT_URI = process.env.KROGER_REDIRECT_URI || (usePostman ? 'https://oauth.pstmn.io/v1/callback' : `http://localhost:${PORT}/callback`);
const KROGER_BASE = 'https://api.kroger.com/v1';
const AUTH_URL = `${KROGER_BASE}/connect/oauth2/authorize`;
const TOKEN_URL = `${KROGER_BASE}/connect/oauth2/token`;
const SCOPES = 'cart.basic:write profile.compact';

function loadEnv() {
  const fs = require('fs');
  const path = require('path');
  // ~/.clawdbot/.env first (real credentials), then project .env
  const candidates = [
    process.env.CLAWDBOT_ENV,
    path.join(process.env.HOME || '', '.clawdbot', '.env'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '..', '.env'),
    path.join(process.cwd(), '..', '..', '.env'),
  ].filter(Boolean);
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
  console.error('Set KROGER_CLIENT_ID and KROGER_CLIENT_SECRET in ~/.clawdbot/.env (or export them).');
  process.exit(1);
}

const state = require('crypto').randomBytes(16).toString('hex');
const authLink = `${AUTH_URL}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&state=${state}`;

if (usePostman) {
  console.log('\n--- Postman callback: authorize URL (open in browser, log in, then use the code in Postman) ---\n');
  console.log(authLink);
  console.log('\n--- In Kroger Developer Portal, set redirect URI to your Postman callback URL (e.g. https://oauth.pstmn.io/v1/callback) ---');
  console.log('\n--- In Postman: POST to token URL ---');
  console.log('  URL: ' + TOKEN_URL);
  console.log('  Auth: Basic | Username: KROGER_CLIENT_ID | Password: KROGER_CLIENT_SECRET');
  console.log('  Body (x-www-form-urlencoded): grant_type=authorization_code, code=<code from redirect>, redirect_uri=' + REDIRECT_URI);
  console.log('\n  Copy refresh_token from the response into ~/.clawdbot/.env as KROGER_REFRESH_TOKEN=...\n');
  process.exit(0);
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url || '', `http://localhost:${PORT}`);
  if (u.pathname !== '/callback') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<p>Open the link printed in the terminal to authorize Kroger.</p>');
    return;
  }
  const code = u.searchParams.get('code');
  const returnedState = u.searchParams.get('state');
  if (returnedState !== state) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Invalid state. Try again.');
    return;
  }
  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('No code in callback. Did you deny access?');
    return;
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  }).toString();
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body,
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  if (!tokenRes.ok) {
    res.end(`<pre>Token exchange failed: ${tokenRes.status}\n${JSON.stringify(tokenData, null, 2)}</pre>`);
    server.close();
    return;
  }
  const refresh = tokenData.refresh_token;
  
  // Auto-save refresh token to ~/.clawdbot/.env
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(process.env.HOME || '', '.clawdbot', '.env');
  let saved = false;
  try {
    let content = '';
    try {
      content = fs.readFileSync(envPath, 'utf8');
    } catch (_) {}
    const lines = content.split('\n');
    let found = false;
    const updated = lines.map((line) => {
      if (line.startsWith('KROGER_REFRESH_TOKEN=')) {
        found = true;
        return `KROGER_REFRESH_TOKEN=${refresh}`;
      }
      return line;
    });
    if (!found) {
      updated.push(`KROGER_REFRESH_TOKEN=${refresh}`);
    }
    fs.writeFileSync(envPath, updated.join('\n'), 'utf8');
    saved = true;
  } catch (e) {
    console.error('Failed to auto-save refresh token:', e.message);
  }
  
  if (saved) {
    res.end(
      '<h2>Success!</h2><p style="color:green;font-size:1.2em;">Refresh token automatically saved to ~/.clawdbot/.env</p><p>You can close this window. Your Kroger cart integration is ready!</p>'
    );
    console.log('\n✓ Refresh token automatically saved to ~/.clawdbot/.env\n');
    console.log('Your Kroger cart integration is ready! You can now add items to your cart.\n');
  } else {
    res.end(
      '<h2>Success</h2><p>Copy the refresh token from the terminal and add to ~/.clawdbot/.env:</p><p><code>KROGER_REFRESH_TOKEN=...</code></p>'
    );
    console.log('\n--- Add this to ~/.clawdbot/.env ---\n');
    console.log(`KROGER_REFRESH_TOKEN=${refresh}`);
    console.log('\n--- Then restart the gateway ---\n');
  }
  server.close();
});

server.listen(PORT, () => {
  console.log(`Redirect URI (add this in Kroger Developer Portal): ${REDIRECT_URI}`);
  console.log(`\nOpen this URL in your browser to log in with Kroger:\n\n${authLink}\n`);
  const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  require('child_process').exec(`${open} "${authLink}"`, () => {});
});
