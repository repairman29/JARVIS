#!/usr/bin/env node
/**
 * Watchdog for JARVIS local services: check Ollama and gateway; restart gateway if down.
 * Run once: node scripts/watchdog-jarvis-local.js
 * Run every 5 min (loop): node scripts/watchdog-jarvis-local.js --loop
 * Run as scheduled task: use --loop with a wrapper that exits after one cycle, or run without --loop from cron/Task Scheduler every 5 min.
 *
 * Writes last state to ~/.jarvis/health/watchdog.json (optional).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const GATEWAY_PORT = Number(process.env.JARVIS_GATEWAY_PORT || process.env.PORT || '18789');
const GATEWAY_URL = `http://127.0.0.1:${GATEWAY_PORT}`;
const LOOP_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const REPO_ROOT = path.resolve(__dirname, '..');
const HEALTH_DIR = path.join(os.homedir(), '.jarvis', 'health');
const SNAPSHOT_PATH = path.join(HEALTH_DIR, 'watchdog.json');

function homedir() {
  return process.env.USERPROFILE || process.env.HOME || os.homedir();
}

function httpGet(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? require('https') : require('http');
    const req = lib.get(url, (res) => {
      let body = '';
      res.on('data', (ch) => (body += ch));
      res.on('end', () => resolve({ ok: res.statusCode < 400, status: res.statusCode, body }));
    });
    req.on('error', () => resolve({ ok: false }));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve({ ok: false });
    });
  });
}

async function checkOllama() {
  const res = await httpGet(`${OLLAMA_URL}/api/tags`);
  return res.ok;
}

async function checkGateway() {
  const res = await httpGet(`${GATEWAY_URL}/`);
  return res.ok;
}

function startGateway() {
  const child = spawn('node', [path.join(__dirname, 'start-gateway-background.js')], {
    cwd: REPO_ROOT,
    detached: true,
    stdio: 'ignore',
    shell: false,
    env: { ...process.env }
  });
  child.unref();
}

function writeSnapshot(state) {
  try {
    if (!fs.existsSync(HEALTH_DIR)) fs.mkdirSync(HEALTH_DIR, { recursive: true });
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify({ ...state, at: new Date().toISOString() }, null, 2), 'utf8');
  } catch (_) {}
}

async function runOnce(loop) {
  const ollamaOk = await checkOllama();
  const gatewayOk = await checkGateway();

  const state = {
    ollama: ollamaOk ? 'ok' : 'down',
    gateway: gatewayOk ? 'ok' : 'down',
    restarted: false
  };

  if (!ollamaOk && !loop) {
    console.warn('Ollama not reachable at', OLLAMA_URL, '— start Ollama (e.g. open the Ollama app)');
  }

  if (!gatewayOk) {
    console.warn('Gateway not reachable at', GATEWAY_URL, '— starting gateway in background');
    startGateway();
    state.restarted = true;
  }

  writeSnapshot(state);
  const line = `Ollama: ${state.ollama} | Gateway: ${state.gateway}${state.restarted ? ' (restarted)' : ''}`;
  if (loop) {
    console.log(new Date().toISOString(), line);
  } else {
    console.log(line);
  }
  return state;
}

async function main() {
  const loop = process.argv.includes('--loop');

  if (loop) {
    console.log('Watchdog running every 5 min (Ollama + gateway). Ctrl+C to stop.');
    while (true) {
      await runOnce(true);
      await new Promise((r) => setTimeout(r, LOOP_INTERVAL_MS));
    }
  }

  await runOnce(false);
}

main().catch((err) => {
  console.error('watchdog:', err.message);
  process.exit(1);
});
