#!/usr/bin/env node
/**
 * Install the JARVIS build server as a macOS LaunchAgent so it starts at login.
 * Run from repo root: node scripts/install-build-server-launchagent.js
 *
 * After install:
 *   Restart:  launchctl kickstart -k gui/$(id -u)/com.jarvis.build-server
 *   Stop:     launchctl stop com.jarvis.build-server
 *   Check:    launchctl list | grep build-server
 *   Unload:   launchctl unload ~/Library/LaunchAgents/com.jarvis.build-server.plist
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'build-server.js');
const nodePath = process.execPath;
const label = 'com.jarvis.build-server';
const plistDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
const plistPath = path.join(plistDir, `${label}.plist`);
const logDir = path.join(os.homedir(), '.jarvis', 'logs');
const stdoutLog = path.join(logDir, 'build-server-stdout.log');
const stderrLog = path.join(logDir, 'build-server-stderr.log');

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
    console.error('This script is for macOS (LaunchAgent). On Windows use Task Scheduler.');
    process.exit(1);
  }
  if (!fs.existsSync(scriptPath)) {
    console.error('Not found:', scriptPath);
    console.error('Run from repo root: node scripts/install-build-server-launchagent.js');
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
  console.log('Loaded. Build server will start at login and is starting now.');
  console.log('Restart: launchctl kickstart -k gui/$(id -u)/com.jarvis.build-server');
  console.log('Logs:', stderrLog, stdoutLog);
}

main();
