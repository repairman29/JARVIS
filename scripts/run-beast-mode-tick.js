#!/usr/bin/env node
/**
 * JARVIS drives BEAST MODE: run one heartbeat tick (task gen, reset stale, QA/Integration/etc).
 * Use from cron or agent loop so BEAST MODE pipeline is driven by JARVIS.
 *
 * Env:
 *   BEAST_MODE_SCRIPTS  — path to BEAST-MODE/scripts (e.g. ../BEAST-MODE/scripts or ~/BEAST-MODE/scripts)
 *   Or run from repo root with BEAST-MODE as sibling: BEAST_MODE_SCRIPTS is optional if ../BEAST-MODE/scripts exists.
 *
 * Usage:
 *   node scripts/run-beast-mode-tick.js
 *   BEAST_MODE_SCRIPTS=/path/to/BEAST-MODE/scripts node scripts/run-beast-mode-tick.js
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const defaultPath = path.join(repoRoot, '..', 'BEAST-MODE', 'scripts');
const scriptsDir = process.env.BEAST_MODE_SCRIPTS || defaultPath;
const heartbeatScript = path.join(scriptsDir, 'heartbeat-agent.js');

function run() {
  if (!fs.existsSync(heartbeatScript)) {
    console.error('[run-beast-mode-tick] BEAST MODE scripts not found at', scriptsDir, '(set BEAST_MODE_SCRIPTS)');
    return 1;
  }
  try {
    execSync(`node "${heartbeatScript}"`, {
      cwd: scriptsDir,
      stdio: 'inherit',
      timeout: 120000,
      env: { ...process.env },
    });
    return 0;
  } catch (e) {
    console.error('[run-beast-mode-tick]', e.message || e);
    return e.status ?? 1;
  }
}

const code = run();
process.exit(code);
