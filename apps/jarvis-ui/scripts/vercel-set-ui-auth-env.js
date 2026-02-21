#!/usr/bin/env node
/**
 * Set JARVIS UI password-protection env vars on Vercel via REST API.
 * Uses same token loading as vercel-protection-status.js.
 *
 * Usage:
 *   node apps/jarvis-ui/scripts/vercel-set-ui-auth-env.js
 *   node apps/jarvis-ui/scripts/vercel-set-ui-auth-env.js [password] [auth-secret]
 *
 * If password/auth-secret omitted, reads from env: JARVIS_UI_PASSWORD, JARVIS_UI_AUTH_SECRET.
 * Requires: VERCEL_TOKEN (or VERCEL_ACCESS_TOKEN) in env or ~/.clawdbot/.env
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_NAME = 'jarvis-ui';
const TEAM_SLUG = process.env.VERCEL_TEAM_SLUG || '';

function loadEnv() {
  const dirs = [
    path.join(os.homedir(), '.clawdbot', '.env'),
    path.join(process.cwd(), 'apps/jarvis-ui', '.env.local'),
    path.join(process.cwd(), 'apps/jarvis-ui', '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const p of dirs) {
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
}

async function getToken() {
  let t = (process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN || '').trim();
  if (!t) {
    try {
      const vaultPath = path.join(__dirname, '../../../scripts/vault.js');
      const { loadEnvFile, resolveEnv } = require(vaultPath);
      loadEnvFile();
      t = (await resolveEnv('VERCEL_TOKEN')) || (await resolveEnv('VERCEL_ACCESS_TOKEN')) || '';
      if (t) process.env.VERCEL_TOKEN = t;
    } catch {
      // ignore
    }
  }
  return (t || '').trim();
}

async function api(method, pathname, body = null, token) {
  if (!token) {
    console.error('Set VERCEL_TOKEN (or VERCEL_ACCESS_TOKEN). Create at https://vercel.com/account/tokens');
    process.exit(1);
  }
  const url = `https://api.vercel.com${pathname}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  return { ok: res.ok, status: res.status, data, text };
}

async function setEnvVar(key, value, token) {
  const query = new URLSearchParams({ upsert: 'true' });
  if (TEAM_SLUG) query.set('slug', TEAM_SLUG);
  const pathname = `/v10/projects/${encodeURIComponent(PROJECT_NAME)}/env?${query}`;
  const body = {
    key,
    value,
    type: 'plain',
    target: ['production', 'preview'],
  };
  return api('POST', pathname, body, token);
}

async function main() {
  loadEnv();
  const token = await getToken();
  if (!token) {
    console.error('Set VERCEL_TOKEN (or VERCEL_ACCESS_TOKEN) in ~/.clawdbot/.env or env. Create at https://vercel.com/account/tokens');
    process.exit(1);
  }

  const password = process.argv[2] ?? process.env.JARVIS_UI_PASSWORD ?? '';
  const authSecret = process.argv[3] ?? process.env.JARVIS_UI_AUTH_SECRET ?? '';

  if (!password || !authSecret) {
    console.error('Usage: node vercel-set-ui-auth-env.js [password] [auth-secret]');
    console.error('  Or set JARVIS_UI_PASSWORD and JARVIS_UI_AUTH_SECRET in env / .env.local');
    process.exit(1);
  }

  const query = TEAM_SLUG ? `?slug=${encodeURIComponent(TEAM_SLUG)}` : '';
  const get = await api('GET', `/v9/projects/${encodeURIComponent(PROJECT_NAME)}${query}`, null, token);
  if (!get.ok) {
    console.error('Project not found or no access:', get.status, get.text?.slice(0, 200));
    process.exit(1);
  }
  console.log('Vercel project:', get.data.name);

  console.log('Setting JARVIS_UI_PASSWORD...');
  const r1 = await setEnvVar('JARVIS_UI_PASSWORD', password, token);
  if (!r1.ok) {
    console.error('Failed:', r1.status, r1.text?.slice(0, 300));
    process.exit(1);
  }
  console.log('  OK');

  console.log('Setting JARVIS_UI_AUTH_SECRET...');
  const r2 = await setEnvVar('JARVIS_UI_AUTH_SECRET', authSecret, token);
  if (!r2.ok) {
    console.error('Failed:', r2.status, r2.text?.slice(0, 300));
    process.exit(1);
  }
  console.log('  OK');

  console.log('');
  console.log('Auth env vars are set. Redeploy the project for them to take effect (e.g. push a commit or trigger a redeploy in Vercel).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
