#!/usr/bin/env node
/**
 * Start the JARVIS build server in the background (detached).
 * Run from repo root: node scripts/start-build-server-background.js
 * Server listens on BUILD_SERVER_PORT or 18790. See docs/JARVIS_BUILD_SERVER.md.
 */

const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const child = spawn(
  process.execPath,
  [path.join(__dirname, 'build-server.js')],
  {
    cwd: repoRoot,
    detached: true,
    stdio: 'ignore',
    env: { ...process.env },
  }
);
child.unref();
console.log('Build server started in background (port', process.env.BUILD_SERVER_PORT || '18790', ')');
console.log('Check: curl -s http://127.0.0.1:18790/health');
