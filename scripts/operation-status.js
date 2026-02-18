#!/usr/bin/env node
/**
 * One-place status for the whole operation: neural farm, gateway, build server, last reports.
 * Run: node scripts/operation-status.js   (human-readable)
 *      node scripts/operation-status.js --json
 *
 * Env: JARVIS_GATEWAY_PORT (default 18789), BUILD_SERVER_PORT (18790).
 * Farm is always checked at http://127.0.0.1:4000 (neural farm proxy).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const FARM_URL = 'http://127.0.0.1:4000';
const GATEWAY_PORT = Number(process.env.JARVIS_GATEWAY_PORT || process.env.PORT || '18789');
const BUILD_SERVER_PORT = Number(process.env.BUILD_SERVER_PORT || '18790');
const WEBHOOK_TRIGGER_PORT = Number(process.env.WEBHOOK_TRIGGER_PORT || '18791');
const REPORTS_DIR = path.join(os.homedir(), '.jarvis', 'reports');
const LATEST_PATH = path.join(REPORTS_DIR, 'latest.txt');

function httpCheck(url, pathname = '/') {
  return new Promise((resolve) => {
    const urlObj = new URL(pathname, url);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || 80,
        path: urlObj.pathname || '/',
        method: 'GET',
        timeout: 4000,
      },
      (res) => resolve(res.statusCode < 400)
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function statSafe(p) {
  try {
    if (fs.existsSync(p)) return fs.statSync(p);
  } catch (_) {}
  return null;
}

async function main() {
  const json = process.argv.includes('--json');

  // Farm: use / or /v1/models (quick); LiteLLM /health runs full backend checks and can timeout
  const [farmOk, gatewayOk, buildServerOk, webhookOk] = await Promise.all([
    httpCheck(FARM_URL, '/').catch(() => false),
    httpCheck(`http://127.0.0.1:${GATEWAY_PORT}`, '/').catch(() => false),
    httpCheck(`http://127.0.0.1:${BUILD_SERVER_PORT}`, '/').catch(() => false),
    httpCheck(`http://127.0.0.1:${WEBHOOK_TRIGGER_PORT}`, '/health').catch(() => false),
  ]);

  const latestStat = statSafe(LATEST_PATH);
  const lastReportMtime = latestStat ? latestStat.mtime : null;
  const lastReportAge = lastReportMtime ? Math.round((Date.now() - lastReportMtime.getTime()) / 1000) : null;

  const status = {
    farm: farmOk ? 'up' : 'down',
    gateway: gatewayOk ? 'up' : 'down',
    buildServer: buildServerOk ? 'up' : 'down',
    webhookTrigger: webhookOk ? 'up' : 'down',
    lastReport: lastReportMtime ? lastReportMtime.toISOString() : null,
    lastReportAgeSeconds: lastReportAge,
  };

  if (json) {
    console.log(JSON.stringify(status, null, 2));
    process.exit(
      farmOk && gatewayOk && buildServerOk ? 0 : 1
    );
  }

  const lines = [
    `Farm (4000):       ${farmOk ? 'up' : 'down'}`,
    `Gateway (${GATEWAY_PORT}):   ${gatewayOk ? 'up' : 'down'}`,
    `Build server (${BUILD_SERVER_PORT}): ${buildServerOk ? 'up' : 'down'}`,
    `Webhook (${WEBHOOK_TRIGGER_PORT}):   ${webhookOk ? 'up' : 'down'}`,
    `Last report:       ${lastReportMtime ? lastReportMtime.toISOString() + (lastReportAge != null ? ` (${lastReportAge}s ago)` : '') : 'none'}`,
  ];
  console.log(lines.join('\n'));
  process.exit(farmOk && gatewayOk && buildServerOk ? 0 : 1);
}

main().catch((e) => {
  console.error('operation-status:', e.message);
  process.exit(1);
});
