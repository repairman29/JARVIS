#!/usr/bin/env node
/**
 * Ensure ~/.clawdbot config and .env, then start the gateway in the background (detached).
 * Used by Cursor/VS Code "run on folder open" task so the gateway starts when you open the repo.
 *
 * Run from repo root: node scripts/start-gateway-background.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

function homedir() {
  return process.env.USERPROFILE || process.env.HOME || os.homedir();
}

function clawdbotDir() {
  return path.join(homedir(), '.clawdbot');
}

function ensureConfigAndEnv() {
  const dir = clawdbotDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const configPath = path.join(dir, 'clawdbot.json');
  const workspaceJarvis = path.join(repoRoot, 'jarvis');

  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (_) {}
  }
  if (!config.gateway) {
    config = {
      gateway: { mode: 'local' },
      agents: {
        defaults: {
          model: { primary: 'ollama/llama3.1:8b' },
          workspace: fs.existsSync(workspaceJarvis) ? workspaceJarvis : path.join(homedir(), 'jarvis')
        }
      }
    };
  }
  const defaults = config.agents && config.agents.defaults ? config.agents.defaults : {};
  if (!defaults.workspace && fs.existsSync(workspaceJarvis)) {
    if (!config.agents) config.agents = {};
    if (!config.agents.defaults) config.agents.defaults = {};
    config.agents.defaults.workspace = workspaceJarvis;
  }
  // Termux/Android: can't write /tmp; use home/tmp for log file so gateway doesn't mkdir /tmp/clawdbot
  const homeTmp = path.join(homedir(), 'tmp');
  try {
    if (!fs.existsSync(homeTmp)) fs.mkdirSync(homeTmp, { recursive: true });
    if (!config.logging) config.logging = {};
    config.logging.file = config.logging.file || path.join(homeTmp, 'clawdbot.log');
  } catch (_) {}
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

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
  }
}

function main() {
  ensureConfigAndEnv();

  try {
    const { loadEnvFile } = require('./vault.js');
    loadEnvFile();
  } catch (_) {}

  // Termux/Android can't write /tmp; use home/tmp so clawdbot can mkdir for logs
  const env = { ...process.env };
  if (!env.TMPDIR) {
    const homeTmp = path.join(homedir(), 'tmp');
    try {
      if (!fs.existsSync(homeTmp)) fs.mkdirSync(homeTmp, { recursive: true });
      env.TMPDIR = homeTmp;
    } catch (_) {}
  }

  const child = spawn('npx', ['clawdbot', 'gateway', 'run', '--allow-unconfigured'], {
    cwd: repoRoot,
    detached: true,
    stdio: 'ignore',
    shell: true,
    env
  });
  child.unref();
  process.exit(0);
}

main();
