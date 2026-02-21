#!/usr/bin/env node
/**
 * Full flow: set JARVIS UI auth env vars on Vercel, trigger production redeploy, wait until ready.
 * State is logged to ~/.jarvis/logs/vercel-ui-auth-setup.log (one JSON object per line).
 *
 * Usage:
 *   node apps/jarvis-ui/scripts/vercel-ui-auth-full.js
 *   node apps/jarvis-ui/scripts/vercel-ui-auth-full.js [password] [auth-secret]
 *
 * Reads JARVIS_UI_PASSWORD / JARVIS_UI_AUTH_SECRET from env or .env.local if args omitted.
 * Requires: VERCEL_TOKEN (or VERCEL_ACCESS_TOKEN).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_NAME = 'jarvis-ui';
const TEAM_SLUG = process.env.VERCEL_TEAM_SLUG || '';
const LOG_DIR = path.join(os.homedir(), '.jarvis', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'vercel-ui-auth-setup.log');
const POLL_INTERVAL_MS = 8000;
const POLL_MAX_WAIT_MS = 600000; // 10 min

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

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function logState(entry) {
  ensureLogDir();
  const line = JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n';
  fs.appendFileSync(LOG_FILE, line);
  return entry;
}

function readLastState() {
  if (!fs.existsSync(LOG_FILE)) return null;
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
  if (lines.length === 0) return null;
  try {
    return JSON.parse(lines[lines.length - 1]);
  } catch {
    return null;
  }
}

function out(msg, data = null) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
  if (data != null) console.log(JSON.stringify(data, null, 2));
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadEnv();
  const token = await getToken();
  if (!token) {
    console.error('Set VERCEL_TOKEN (or VERCEL_ACCESS_TOKEN) in ~/.clawdbot/.env or env.');
    process.exit(1);
  }

  const password = process.argv[2] ?? process.env.JARVIS_UI_PASSWORD ?? '';
  const authSecret = process.argv[3] ?? process.env.JARVIS_UI_AUTH_SECRET ?? '';

  if (!password || !authSecret) {
    console.error('Usage: node vercel-ui-auth-full.js [password] [auth-secret]');
    console.error('  Or set JARVIS_UI_PASSWORD and JARVIS_UI_AUTH_SECRET in env / .env.local');
    process.exit(1);
  }

  const last = readLastState();
  out('Starting vercel-ui-auth-full', { lastStep: last?.step ?? 'none', logFile: LOG_FILE });

  // --- Step 1: Get project ---
  const query = TEAM_SLUG ? `?slug=${encodeURIComponent(TEAM_SLUG)}` : '';
  const getProject = await api('GET', `/v9/projects/${encodeURIComponent(PROJECT_NAME)}${query}`, null, token);
  if (!getProject.ok) {
    logState({ step: 'error', phase: 'get_project', status: getProject.status, message: getProject.text?.slice(0, 200) });
    console.error('Project not found or no access:', getProject.status, getProject.text?.slice(0, 200));
    process.exit(1);
  }
  const projectId = getProject.data.id;
  out('Project resolved', { name: getProject.data.name, projectId });
  logState({ step: 'project_resolved', projectId, name: getProject.data.name });

  // --- Step 2: Set env vars ---
  out('Setting JARVIS_UI_PASSWORD...');
  const r1 = await setEnvVar('JARVIS_UI_PASSWORD', password, token);
  if (!r1.ok) {
    logState({ step: 'error', phase: 'set_password', status: r1.status });
    console.error('Failed:', r1.status, r1.text?.slice(0, 300));
    process.exit(1);
  }
  out('  OK');
  logState({ step: 'env_password_set' });

  out('Setting JARVIS_UI_AUTH_SECRET...');
  const r2 = await setEnvVar('JARVIS_UI_AUTH_SECRET', authSecret, token);
  if (!r2.ok) {
    logState({ step: 'error', phase: 'set_secret', status: r2.status });
    console.error('Failed:', r2.status, r2.text?.slice(0, 300));
    process.exit(1);
  }
  out('  OK');
  logState({ step: 'env_secret_set' });

  // --- Step 3: List latest production deployment ---
  const listQuery = new URLSearchParams({
    projectId,
    target: 'production',
    limit: '1',
  });
  if (TEAM_SLUG) listQuery.set('slug', TEAM_SLUG);
  const list = await api('GET', `/v6/deployments?${listQuery}`, null, token);
  if (!list.ok || !Array.isArray(list.data?.deployments) || list.data.deployments.length === 0) {
    logState({ step: 'error', phase: 'list_deployments', status: list.status });
    console.error('No production deployment found. Deploy once from Vercel or push a commit, then run this again.');
    process.exit(1);
  }
  const previousDeploymentId = list.data.deployments[0].uid;
  out('Latest production deployment', { uid: previousDeploymentId });
  logState({ step: 'latest_deployment_found', previousDeploymentId });

  // --- Step 4: Trigger redeploy (preserve monorepo root so Next.js is found) ---
  const deployQuery = TEAM_SLUG ? `?slug=${encodeURIComponent(TEAM_SLUG)}` : '';
  const createBody = {
    name: PROJECT_NAME,
    project: PROJECT_NAME,
    deploymentId: previousDeploymentId,
    target: 'production',
    projectSettings: {
      rootDirectory: 'apps/jarvis-ui',
    },
  };
  const create = await api('POST', `/v13/deployments${deployQuery}`, createBody, token);
  if (!create.ok) {
    logState({ step: 'error', phase: 'create_deployment', status: create.status, message: create.text?.slice(0, 300) });
    console.error('Redeploy failed:', create.status, create.text?.slice(0, 400));
    process.exit(1);
  }
  const newDeploymentId = create.data?.id ?? create.data?.uid;
  if (!newDeploymentId) {
    console.error('Redeploy response missing deployment id:', create.data);
    process.exit(1);
  }
  out('Redeploy triggered', { deploymentId: newDeploymentId, url: create.data?.url });
  logState({ step: 'deployment_triggered', deploymentId: newDeploymentId, url: create.data?.url });

  // --- Step 5: Poll until ready ---
  const startPoll = Date.now();
  let ready = false;
  let finalState = null;
  while (Date.now() - startPoll < POLL_MAX_WAIT_MS) {
    await sleep(POLL_INTERVAL_MS);
    const getQuery = TEAM_SLUG ? `?slug=${encodeURIComponent(TEAM_SLUG)}` : '';
    const getDep = await api('GET', `/v13/deployments/${newDeploymentId}${getQuery}`, null, token);
    if (!getDep.ok) {
      out('Poll failed', { status: getDep.status });
      continue;
    }
    const state = getDep.data?.readyState ?? getDep.data?.state;
    const status = getDep.data?.status;
    out('Deployment status', { readyState: state, status });
    if (state === 'READY') {
      ready = true;
      finalState = getDep.data;
      break;
    }
    if (state === 'ERROR' || state === 'CANCELED') {
      logState({ step: 'deployment_failed', deploymentId: newDeploymentId, readyState: state, errorMessage: getDep.data?.errorMessage });
      console.error('Deployment ended with state:', state, getDep.data?.errorMessage ?? '');
      process.exit(1);
    }
  }

  if (!ready) {
    logState({ step: 'deployment_timeout', deploymentId: newDeploymentId });
    console.error('Deployment did not become READY within', POLL_MAX_WAIT_MS / 60000, 'minutes. Check Vercel dashboard.');
    process.exit(1);
  }

  const alias = (finalState?.alias || finalState?.aliasAssigned) ?? finalState?.url;
  logState({ step: 'deployment_ready', deploymentId: newDeploymentId, url: finalState?.url, alias });
  out('Deployment ready', { url: finalState?.url, alias });
  out('Auth is live. Visit the site and log in with your password.');
}

main().catch((e) => {
  console.error(e);
  try {
    logState({ step: 'error', phase: 'main', message: e.message });
  } catch {
    // ignore
  }
  process.exit(1);
});
