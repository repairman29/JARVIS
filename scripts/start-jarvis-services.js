#!/usr/bin/env node
/**
 * Start JARVIS services (build server + gateway) if not already running.
 * Idempotent: checks health first, starts only what's down.
 * Use when you open Cursor or after a reboot (if LaunchAgents aren't installed).
 *
 * Run from repo root: node scripts/start-jarvis-services.js
 */

const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const BUILD_SERVER_PORT = Number(process.env.BUILD_SERVER_PORT || '18790');
const GATEWAY_PORT = Number(process.env.JARVIS_GATEWAY_PORT || process.env.PORT || '18789');
const WEBHOOK_TRIGGER_PORT = Number(process.env.WEBHOOK_TRIGGER_PORT || '18791');

function httpGet(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, { timeout: 3000 }, (res) => {
      resolve(res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function main() {
  const buildServerOk = await httpGet(BUILD_SERVER_PORT);
  const gatewayOk = await httpGet(GATEWAY_PORT);

  if (!buildServerOk) {
    console.log('Starting build server...');
    const buildServer = spawn(process.execPath, [path.join(__dirname, 'build-server.js')], {
      cwd: REPO_ROOT,
      detached: true,
      stdio: 'ignore',
      env: { ...process.env },
    });
    buildServer.unref();
    await new Promise((r) => setTimeout(r, 2000));
    const check = await httpGet(BUILD_SERVER_PORT);
    console.log(check ? 'Build server started.' : 'Build server may still be starting (check port ' + BUILD_SERVER_PORT + ')');
  } else {
    console.log('Build server already running.');
  }

  if (!gatewayOk) {
    console.log('Starting gateway...');
    spawn(process.execPath, [path.join(__dirname, 'start-gateway-background.js')], {
      cwd: REPO_ROOT,
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, PORT: String(GATEWAY_PORT), JARVIS_GATEWAY_PORT: String(GATEWAY_PORT) },
    }).unref();
    await new Promise((r) => setTimeout(r, 3000));
    const check = await httpGet(GATEWAY_PORT);
    console.log(check ? 'Gateway started.' : 'Gateway may still be starting (check port ' + GATEWAY_PORT + ')');
  } else {
    console.log('Gateway already running.');
  }

  const webhookOk = await httpGet(WEBHOOK_TRIGGER_PORT);
  if (!webhookOk) {
    console.log('Starting webhook trigger server...');
    spawn(process.execPath, [path.join(__dirname, 'webhook-trigger-server.js')], {
      cwd: REPO_ROOT,
      detached: true,
      stdio: 'ignore',
      env: { ...process.env },
    }).unref();
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Webhook trigger server started (port ' + WEBHOOK_TRIGGER_PORT + ').');
  } else {
    console.log('Webhook trigger server already running.');
  }

  console.log('Done. Build server:', BUILD_SERVER_PORT, '| Gateway:', GATEWAY_PORT, '| Webhook:', WEBHOOK_TRIGGER_PORT);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
