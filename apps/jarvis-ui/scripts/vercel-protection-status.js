#!/usr/bin/env node
/**
 * Check (and optionally enable) Vercel Deployment Protection for jarvis-ui via REST API.
 * Protection (Vercel Authentication) is dashboard-first; this script reads status and
 * tries to enable via PATCH when VERCEL_TOKEN is set.
 *
 * Usage:
 *   node apps/jarvis-ui/scripts/vercel-protection-status.js           # show status
 *   node apps/jarvis-ui/scripts/vercel-protection-status.js --enable  # try enable for production
 *
 * Requires: VERCEL_TOKEN in env or ~/.clawdbot/.env (or Vault). Create at https://vercel.com/account/tokens
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_NAME = 'jarvis-ui';
// Personal (Pro) account: leave unset. Team: set VERCEL_TEAM_SLUG e.g. jeff-adkins-projects
const TEAM_SLUG = process.env.VERCEL_TEAM_SLUG || '';

function loadEnv() {
  const dirs = [
    path.join(os.homedir(), '.clawdbot', '.env'),
    path.join(process.cwd(), 'apps/jarvis-ui', '.env.local'),
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
    const { loadEnvFile, resolveEnv } = require(path.join(__dirname, '../../../scripts/vault.js'));
    loadEnvFile();
    t = (await resolveEnv('VERCEL_TOKEN')) || (await resolveEnv('VERCEL_ACCESS_TOKEN')) || '';
    if (t) process.env.VERCEL_TOKEN = t;
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

async function main() {
  loadEnv();
  const token = await getToken();
  if (!token) {
    console.error('Set VERCEL_TOKEN (or VERCEL_ACCESS_TOKEN) in ~/.clawdbot/.env or in Vault (env/clawdbot/VERCEL_TOKEN). Create at https://vercel.com/account/tokens');
    process.exit(1);
  }
  const enable = process.argv.includes('--enable');

  const query = TEAM_SLUG ? `?slug=${encodeURIComponent(TEAM_SLUG)}` : '';
  const getUrl = `/v9/projects/${encodeURIComponent(PROJECT_NAME)}${query}`;

  const get = await api('GET', getUrl, null, token);
  if (!get.ok) {
    if (get.status === 404) {
      console.log('Project not found. If you use a team, set VERCEL_TEAM_SLUG.');
    }
    console.error('GET project failed:', get.status, get.text?.slice(0, 300));
    process.exit(1);
  }

  const project = get.data;
  const sso = project.ssoProtection || {};
  const deploymentType = sso.deploymentType || 'none';

  console.log('Vercel project:', project.name);
  console.log('SSO / Deployment Protection:', deploymentType);
  const dashPath = TEAM_SLUG ? `${TEAM_SLUG}/${project.name}` : project.name;
  console.log('Dashboard: https://vercel.com/' + dashPath + '/settings/deployment-protection');
  console.log('');

  if (deploymentType === 'preview' || deploymentType === 'none') {
    console.log('Production (jarvis-ui-xi.vercel.app) is currently PUBLIC (no login required).');
    console.log('To protect via dashboard: Settings → Deployment Protection → set Production to "Vercel Authentication".');
  } else {
    console.log('Production has protection enabled (login required).');
  }

  if (enable) {
    console.log('');
    console.log('Attempting to enable Vercel Authentication for production via API...');
    const patchQuery = TEAM_SLUG ? `?slug=${encodeURIComponent(TEAM_SLUG)}` : '';
    const patch = await api('PATCH', `/v9/projects/${encodeURIComponent(PROJECT_NAME)}${patchQuery}`, {
      ssoProtection: { deploymentType: 'production' },
    }, token);
    if (patch.ok) {
      console.log('PATCH succeeded. ssoProtection updated.');
      const newSso = (patch.data && patch.data.ssoProtection) || {};
      console.log('New deploymentType:', newSso.deploymentType || 'unknown');
    } else {
      console.error('PATCH failed:', patch.status, patch.text?.slice(0, 400));
      console.log('Enable protection manually: Vercel Dashboard →', project.name, '→ Settings → Deployment Protection.');
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
