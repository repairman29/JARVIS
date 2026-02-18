#!/usr/bin/env node
/**
 * Install ngrok as a macOS LaunchAgent so the tunnel (port 18791 → webhook) starts at login.
 * Run from repo root: node scripts/install-ngrok-launchagent.js
 *
 * Prereq: ngrok config add-authtoken YOUR_TOKEN (one time). Get token at https://dashboard.ngrok.com/get-started/your-authtoken
 *
 * After install:
 *   Restart:  launchctl kickstart -k gui/$(id -u)/com.jarvis.ngrok
 *   Unload:   launchctl unload ~/Library/LaunchAgents/com.jarvis.ngrok.plist
 *
 * Note: Free ngrok URL changes each time it starts. After reboot run: node scripts/sync-webhook-url-all-repos.js
 * to update all GitHub webhooks with the new URL.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ngrokPath = '/opt/homebrew/bin/ngrok';
const label = 'com.jarvis.ngrok';
const plistDir = path.join(os.homedir(), 'Library', 'LaunchAgents');
const plistPath = path.join(plistDir, `${label}.plist`);
const logDir = path.join(os.homedir(), '.jarvis', 'logs');
const logPath = path.join(logDir, 'ngrok.log');

const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${label}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${ngrokPath}</string>
    <string>http</string>
    <string>18791</string>
    <string>--log=stdout</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${logPath}</string>
  <key>StandardErrorPath</key>
  <string>${logPath}</string>
</dict>
</plist>
`;

function main() {
  if (process.platform !== 'darwin') {
    console.error('This script is for macOS (LaunchAgent).');
    process.exit(1);
  }
  if (!fs.existsSync(ngrokPath)) {
    console.error('ngrok not found at', ngrokPath, '- install with: brew install ngrok');
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
  console.log('Loaded. ngrok will start at login (tunnel to port 18791).');
  console.log('After reboot, run: node scripts/sync-webhook-url-all-repos.js to update GitHub webhooks with new URL.');
  console.log('Restart: launchctl kickstart -k gui/$(id -u)/com.jarvis.ngrok');
}

main();
