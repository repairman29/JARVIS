#!/usr/bin/env node
/**
 * Setup and run JARVIS with local inference (Ollama).
 * - Ensures ~/.clawdbot exists with minimal config (Ollama primary) and .env (gateway token).
 * - Verifies Ollama is reachable; optionally checks for echeo/beast-mode/code-roach on PATH.
 * - Starts the gateway (npx clawdbot gateway run).
 *
 * Run from repo root:
 *   node scripts/setup-and-run-local.js
 *   node scripts/setup-and-run-local.js --setup-only   # only setup, print run command
 *
 * Prereqs: Node.js, Ollama installed and running (ollama pull llama3.1:8b recommended).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = 'ollama/llama3.1:8b';

function log(msg, level = 'info') {
  const prefix = level === 'err' ? '⚠ ' : level === 'ok' ? '✓ ' : '';
  console.log(prefix + msg);
}

function homedir() {
  return process.env.USERPROFILE || process.env.HOME || os.homedir();
}

function clawdbotDir() {
  return path.join(homedir(), '.clawdbot');
}

function checkOllama() {
  return new Promise((resolve) => {
    const url = new URL('/api/tags', OLLAMA_URL);
    const lib = url.protocol === 'https:' ? require('https') : require('http');
    const req = lib.get(url.href, (res) => {
      let body = '';
      res.on('data', (ch) => (body += ch));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const models = (data.models || []).map((m) => m.name);
          log(`Ollama reachable at ${OLLAMA_URL}. Models: ${models.length ? models.join(', ') : 'none'}`);
          resolve({ ok: true, models });
        } catch {
          resolve({ ok: false });
        }
      });
    });
    req.on('error', () => {
      log(`Ollama not reachable at ${OLLAMA_URL}. Start Ollama (e.g. run "ollama serve" or open the Ollama app) or install from https://ollama.com`, 'err');
      resolve({ ok: false });
    });
    req.setTimeout(3000, () => {
      req.destroy();
      log(`Ollama not reachable at ${OLLAMA_URL}. Start Ollama or install from https://ollama.com`, 'err');
      resolve({ ok: false });
    });
  });
}

function ensureClawdbotConfig(repoRoot) {
  const dir = clawdbotDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created ${dir}`);
  }

  const configPath = path.join(dir, 'clawdbot.json');
  const workspaceJarvis = path.join(repoRoot, 'jarvis');

  if (fs.existsSync(configPath)) {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      log(`Existing ${configPath} is invalid JSON; skipping write.`, 'err');
      return;
    }
    // Ensure workspace points at repo jarvis if not set
    const defaults = config.agents && config.agents.defaults ? config.agents.defaults : {};
    if (!defaults.workspace && fs.existsSync(workspaceJarvis)) {
      if (!config.agents) config.agents = {};
      if (!config.agents.defaults) config.agents.defaults = {};
      config.agents.defaults.workspace = workspaceJarvis;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      log(`Updated clawdbot.json: agents.defaults.workspace = ${workspaceJarvis}`);
    } else {
      log(`Using existing ${configPath}`);
    }
    return;
  }

  const config = {
    gateway: { mode: 'local' },
    agents: {
      defaults: {
        model: { primary: DEFAULT_MODEL },
        workspace: fs.existsSync(workspaceJarvis) ? workspaceJarvis : path.join(homedir(), 'jarvis')
      }
    }
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  log(`Wrote ${configPath} with primary model ${DEFAULT_MODEL}`);
}

function ensureEnv() {
  const dir = clawdbotDir();
  const envPath = path.join(dir, '.env');
  let env = {};
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  if (!env.CLAWDBOT_GATEWAY_TOKEN) {
    env.CLAWDBOT_GATEWAY_TOKEN = crypto.randomBytes(32).toString('hex');
    const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`);
    fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
    log(`Added CLAWDBOT_GATEWAY_TOKEN to ${envPath}`);
  } else {
    log(`Using existing .env (CLAWDBOT_GATEWAY_TOKEN present)`);
  }
}

function checkToolsOnPath() {
  const tools = ['echeo', 'beast-mode', 'code-roach'];
  const missing = [];
  for (const name of tools) {
    try {
      const { execSync } = require('child_process');
      const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`;
      execSync(cmd, { stdio: 'pipe' });
    } catch {
      missing.push(name);
    }
  }
  if (missing.length) {
    log(`Optional CLIs not on PATH: ${missing.join(', ')}. Install them so JARVIS can run them via exec.`, 'err');
  } else {
    log(`Optional CLIs found on PATH: ${tools.join(', ')}`);
  }
}

async function main() {
  const setupOnly = process.argv.includes('--setup-only');
  const repoRoot = path.resolve(__dirname, '..');

  log('Setup and run JARVIS (local inference)');
  log('---');

  const ollama = await checkOllama();
  ensureClawdbotConfig(repoRoot);
  ensureEnv();
  checkToolsOnPath();

  log('---');
  if (setupOnly) {
    log('Setup done. Start the gateway with:');
    log('  npx clawdbot gateway run');
    log('Then in another terminal: npx clawdbot agent --session-id local --message "Hello" --local');
    return;
  }

  // Load .env so gateway sees CLAWDBOT_GATEWAY_TOKEN etc.
  try {
    const { loadEnvFile } = require('./vault.js');
    loadEnvFile();
  } catch (_) {}

  log('Starting gateway...');
  const child = spawn('npx', ['clawdbot', 'gateway', 'run', '--allow-unconfigured'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error('setup-and-run-local:', err.message);
  process.exit(1);
});
