#!/usr/bin/env node
/**
 * Load ~/.clawdbot config and env, then run the gateway in the foreground.
 * Used by the LaunchAgent so launchd manages one process and restart works.
 * Run from repo root (or with WorkingDirectory set to repo root).
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

function homedir() {
  return process.env.USERPROFILE || process.env.HOME || os.homedir();
}

function loadEnv() {
  const envPath = path.join(homedir(), '.clawdbot', '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

loadEnv();
try {
  const { loadEnvFile } = require('./vault.js');
  if (loadEnvFile) loadEnvFile();
} catch (_) {}

const nodeDir = path.dirname(process.execPath);
const npxPath = path.join(nodeDir, 'npx');
const pathEnv = [nodeDir, process.env.PATH].filter(Boolean).join(path.delimiter);
const child = spawn(npxPath, ['clawdbot', 'gateway', 'run', '--allow-unconfigured'], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: { ...process.env, PATH: pathEnv },
});

function shutdown() {
  child.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

child.on('exit', (code, signal) => {
  process.exit(code != null ? code : signal ? 1 : 0);
});
