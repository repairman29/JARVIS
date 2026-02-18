#!/usr/bin/env node
/**
 * Bring up the full stack: Neural Farm (adapters + proxy) then JARVIS (build server, gateway, webhook).
 * Run from JARVIS repo root: node scripts/start-all.js
 *
 * Order: farm first (so gateway has an LLM), then JARVIS services.
 * Idempotent: only starts what's down. Set NEURAL_FARM_DIR to override farm path (default: ../neural-farm or ~/neural-farm).
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const FARM_DIR = process.env.NEURAL_FARM_DIR || (() => {
  const sibling = path.join(REPO_ROOT, '..', 'neural-farm');
  if (fs.existsSync(path.join(sibling, 'dev_farm.sh'))) return sibling;
  const home = path.join(os.homedir(), 'neural-farm');
  if (fs.existsSync(path.join(home, 'dev_farm.sh'))) return home;
  return null;
})();

const FARM_PROXY_PORT = 4000;
const GATEWAY_PORT = Number(process.env.JARVIS_GATEWAY_PORT || process.env.PORT || '18789');

function httpGet(port, pathname = '/') {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}${pathname}`, { timeout: 3000 }, (res) => {
      resolve(res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function run(cmd, args, cwd, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: opts.silent ? 'ignore' : 'inherit', ...opts });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

async function waitFor(port, label, maxWaitMs = 15000) {
  const step = 1000;
  for (let t = 0; t < maxWaitMs; t += step) {
    if (await httpGet(port)) return true;
    await new Promise((r) => setTimeout(r, step));
  }
  return false;
}

async function main() {
  console.log('=== Start all (farm + JARVIS) ===\n');

  // 1. Neural Farm
  if (FARM_DIR) {
    const proxyUp = await httpGet(FARM_PROXY_PORT);
    if (!proxyUp) {
      console.log('Starting Neural Farm...');
      try {
        await run('bash', ['./dev_farm.sh', '--bg'], FARM_DIR, { silent: true });
      } catch (e) {
        console.warn('dev_farm.sh --bg failed or skipped (lock?):', e.message);
      }
      const up = await waitFor(FARM_PROXY_PORT, 'Farm proxy', 20000);
      console.log(up ? '  Farm proxy: up' : '  Farm proxy: may still be starting (run ./status.sh in neural-farm)');
    } else {
      console.log('Farm already running (proxy on 4000).');
    }
  } else {
    console.log('Neural Farm not found (set NEURAL_FARM_DIR or clone next to JARVIS). Skipping farm.');
  }

  // 2. JARVIS services (build server, gateway, webhook)
  console.log('\nStarting JARVIS services...');
  const startServices = path.join(__dirname, 'start-jarvis-services.js');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [startServices], {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });

  console.log('\nDone. Check status: node scripts/operation-status.js');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
