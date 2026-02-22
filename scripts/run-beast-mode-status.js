#!/usr/bin/env node
/**
 * JARVIS: print BEAST MODE pipeline status (queue, milestone).
 * Use from chat/UI so JARVIS can exec this and report to the user.
 *
 * Env: BEAST_MODE_SCRIPTS (optional, default ../BEAST-MODE/scripts)
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const defaultPath = path.join(repoRoot, '..', 'BEAST-MODE', 'scripts');
const scriptsDir = process.env.BEAST_MODE_SCRIPTS || defaultPath;
const statusScript = path.join(scriptsDir, 'beast-mode-status.js');

if (!fs.existsSync(statusScript)) {
  console.log('BEAST MODE status: scripts not found at', scriptsDir, '(set BEAST_MODE_SCRIPTS).');
  process.exit(0);
}

try {
  execSync(`node "${statusScript}"`, {
    cwd: scriptsDir,
    stdio: 'inherit',
    timeout: 15000,
    env: { ...process.env },
  });
} catch (e) {
  console.error('Status failed:', e.message || e);
  process.exit(1);
}
