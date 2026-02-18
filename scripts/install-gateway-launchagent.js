#!/usr/bin/env node
/**
 * Install the JARVIS gateway as a macOS LaunchAgent so it starts at login and can be restarted with launchctl.
 * Uses this repo's gateway-run-wrapper.js (loads ~/.clawdbot/.env then runs the gateway in the foreground so launchctl can restart it).
 *
 * Run from repo root: node scripts/install-gateway-launchagent.js
 *
 * After install:
 *   Start now:    launchctl start com.clawdbot.gateway
 *   Restart:      launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway
 *   Stop:         launchctl stop com.clawdbot.gateway
 *   Check:        launchctl list | grep clawdbot
 *   Unload:       launchctl unload ~/Library/LaunchAgents/com.clawdbot.gateway.plist
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'gateway-run-wrapper.js');
const nodePath = process.execPath;
const label = 'com.clawdbot.gateway';
const plistDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
const plistPath = path.join(plistDir, `${label}.plist`);
const logDir = path.join(os.homedir(), '.jarvis', 'logs');
const stdoutLog = path.join(logDir, 'gateway-stdout.log');
const stderrLog = path.join(logDir, 'gateway-stderr.log');

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
    console.error('This script is for macOS (LaunchAgent). On Windows use Task Scheduler; see docs/JARVIS_AUTO_START_AND_WATCHDOG.md');
    process.exit(1);
  }
  if (!fs.existsSync(scriptPath)) {
    console.error('Not found:', scriptPath);
    console.error('Run from repo root: node scripts/install-gateway-launchagent.js');
    process.exit(1);
  }
  if (!fs.existsSync(plistDir)) {
    fs.mkdirSync(plistDir, { recursive: true });
  }
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  fs.writeFileSync(plistPath, plistContent, 'utf8');
  console.log('Wrote', plistPath);
  try {
    execSync(`launchctl unload "${plistPath}"`, { stdio: 'ignore' });
  } catch (_) {}
  execSync(`launchctl load "${plistPath}"`, { stdio: 'inherit' });
  console.log('Loaded. Gateway will start at login and is starting now.');
  console.log('Restart later: launchctl kickstart -k gui/$(id -u)/com.clawdbot.gateway');
  console.log('Logs:', stderrLog, stdoutLog);
}

main();
