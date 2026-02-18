#!/usr/bin/env node
/**
 * Install the JARVIS webhook trigger server as a macOS LaunchAgent so it starts at login.
 * Run from repo root: node scripts/install-webhook-trigger-launchagent.js
 *
 * After install:
 *   Restart:  launchctl kickstart -k gui/$(id -u)/com.jarvis.webhook-trigger
 *   Unload:   launchctl unload ~/Library/LaunchAgents/com.jarvis.webhook-trigger.plist
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'webhook-trigger-server.js');
const nodePath = process.execPath;
const label = 'com.jarvis.webhook-trigger';
const plistDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
const plistPath = path.join(plistDir, `${label}.plist`);
const logDir = path.join(os.homedir(), '.jarvis', 'logs');
const stdoutLog = path.join(logDir, 'webhook-trigger-stdout.log');
const stderrLog = path.join(logDir, 'webhook-trigger-stderr.log');

const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${nodePath}</string>
    <string>${scriptPath}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${repoRoot}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${stdoutLog}</string>
  <key>StandardErrorPath</key>
  <string>${stderrLog}</string>
</dict>
</plist>
`;

function main() {
  if (process.platform !== 'darwin') {
    console.error('This script is for macOS (LaunchAgent).');
    process.exit(1);
  }
  if (!fs.existsSync(scriptPath)) {
    console.error('Not found:', scriptPath);
    process.exit(1);
  }
  if (!fs.existsSync(plistDir)) fs.mkdirSync(plistDir, { recursive: true });
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(plistPath, plistContent, 'utf8');
  console.log('Wrote', plistPath);
  try {
    execSync(`launchctl unload "${plistPath}"`, { stdio: 'ignore' });
  } catch (_) {}
  execSync(`launchctl load "${plistPath}"`, { stdio: 'inherit' });
  console.log('Loaded. Webhook trigger server will start at login (port 18791).');
  console.log('Restart: launchctl kickstart -k gui/$(id -u)/com.jarvis.webhook-trigger');
}

main();
