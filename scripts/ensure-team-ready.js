#!/usr/bin/env node
/**
 * One-command bootstrap: ensure the team of AI agents is ready under JARVIS command.
 * Checks Neural Farm (localhost:4000), gateway (JARVIS_GATEWAY_PORT or 18789), runs team-status.js.
 *
 * Usage: node scripts/ensure-team-ready.js
 *
 * Env: JARVIS_GATEWAY_PORT or PORT (default 18789), NEURAL_FARM_PORT (default 4000).
 *      Set SKIP_FARM_CHECK=1 or SKIP_GATEWAY_CHECK=1 to skip those checks.
 */

const path = require('path');
const { execSync } = require('child_process');
const http = require('http');

const repoRoot = path.resolve(__dirname, '..');
const gatewayPort = Number(process.env.JARVIS_GATEWAY_PORT || process.env.PORT || '18789');
const farmPort = Number(process.env.NEURAL_FARM_PORT || '4000');
const skipFarm = process.env.SKIP_FARM_CHECK === '1';
const skipGateway = process.env.SKIP_GATEWAY_CHECK === '1';

function httpGet(port, pathname = '/') {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: pathname,
        method: 'GET',
        timeout: 3000,
      },
      (res) => resolve(res.statusCode === 200)
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

async function main() {
  console.log('JARVIS team — ensure ready\n');

  let farmUp = null;
  let gatewayUp = null;

  if (!skipFarm) {
    farmUp = await httpGet(farmPort, '/health');
    console.log('Neural Farm (localhost:' + farmPort + '):', farmUp ? 'up' : 'down');
    if (!farmUp) {
      console.log('  → Start: cd neural-farm && ./dev_farm.sh');
    }
  }

  if (!skipGateway) {
    gatewayUp = await httpGet(gatewayPort, '/');
    console.log('Gateway (localhost:' + gatewayPort + '):', gatewayUp ? 'up' : 'down');
    if (!gatewayUp) {
      console.log('  → Start: node scripts/start-gateway-with-vault.js (or start-gateway-background.js)');
    }
  }

  console.log('');
  execSync(process.execPath, [path.join(__dirname, 'team-status.js')], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  const statusPath = path.join(process.env.HOME || process.env.USERPROFILE, '.jarvis', 'team-status.json');
  let summary = 'Team status written to ' + statusPath + '.';
  try {
    const fs = require('fs');
    if (fs.existsSync(statusPath)) {
      const st = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      summary = 'Team ready: ' + (st.summary?.available ?? 0) + '/' + (st.summary?.total ?? 0) + ' agents available.';
      if (farmUp !== null) summary += ' Farm: ' + (farmUp ? 'up' : 'down') + '.';
      if (gatewayUp !== null) summary += ' Gateway: ' + (gatewayUp ? 'up' : 'down') + '.';
    }
  } catch (_) {}
  console.log('\n' + summary);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
