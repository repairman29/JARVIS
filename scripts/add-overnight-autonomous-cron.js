#!/usr/bin/env node
/**
 * Add cron lines for JARVIS overnight: plan-execute (e.g. 2 AM) and heartbeat (e.g. every 6h).
 * Optionally add run-autonomous-release for one product (e.g. 3:30 AM).
 *
 * Usage:
 *   node scripts/add-overnight-autonomous-cron.js              # print lines only
 *   node scripts/add-overnight-autonomous-cron.js --add         # append to crontab
 *   node scripts/add-overnight-autonomous-cron.js --add --plan-time 3   # plan at 3 AM
 *   node scripts/add-overnight-autonomous-cron.js --add --release       # also add autonomous release
 *
 * Env (for --release): JARVIS_RELEASE_PRODUCT (e.g. olive). Set in ~/.clawdbot/.env or crontab.
 */

const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const home = process.env.HOME || process.env.USERPROFILE || '';

function parseArgs() {
  const args = process.argv.slice(2);
  const add = args.includes('--add');
  const release = args.includes('--release');
  let planTime = 2; // 2 AM
  let heartbeatInterval = 6; // every 6 hours
  const planTimeIdx = args.indexOf('--plan-time');
  if (planTimeIdx >= 0 && args[planTimeIdx + 1]) {
    planTime = parseInt(args[planTimeIdx + 1], 10) || 2;
  }
  const hbIdx = args.indexOf('--heartbeat-interval');
  if (hbIdx >= 0 && args[hbIdx + 1]) {
    heartbeatInterval = parseInt(args[hbIdx + 1], 10) || 6;
  }
  return { add, release, planTime, heartbeatInterval };
}

function main() {
  const { add, release, planTime, heartbeatInterval } = parseArgs();

  // 0 2 * * * = 2 AM daily
  const planCron = `0 ${planTime} * * * HOME=${home} cd ${repoRoot} && node scripts/jarvis-autonomous-plan-execute.js >> ${home}/.jarvis/plan-execute.log 2>&1`;
  const heartbeatCron = `0 */${heartbeatInterval} * * * HOME=${home} cd ${repoRoot} && node scripts/jarvis-autonomous-heartbeat.js >> ${home}/.jarvis/heartbeat.log 2>&1`;

  const lines = [planCron, heartbeatCron];
  if (release) {
    const product = process.env.JARVIS_RELEASE_PRODUCT || 'YOUR_REPO';
    const releaseCron = `30 ${planTime + 1} * * * HOME=${home} JARVIS_RELEASE_PRODUCT=${product} cd ${repoRoot} && node scripts/run-autonomous-release.js >> ${home}/.jarvis/autonomous-release.log 2>&1`;
    lines.push(releaseCron);
  }

  if (add) {
    try {
      let existing = '';
      try {
        existing = execSync('crontab -l', { encoding: 'utf8' });
      } catch (e) {
        if (e.status !== 1) throw e;
      }
      const alreadyPlan = existing.includes('jarvis-autonomous-plan-execute');
      const alreadyHeartbeat = existing.includes('jarvis-autonomous-heartbeat');
      const alreadyRelease = existing.includes('run-autonomous-release');
      if (alreadyPlan && alreadyHeartbeat && (!release || alreadyRelease)) {
        console.log('Overnight autonomous cron already present. Current crontab:');
        console.log(existing || '(empty)');
        return;
      }
      const toAdd = [];
      if (!alreadyPlan) toAdd.push(planCron);
      if (!alreadyHeartbeat) toAdd.push(heartbeatCron);
      if (release && !alreadyRelease) toAdd.push(lines[2]);
      const updated = (existing.trim() ? existing.trim() + '\n' : '') + toAdd.join('\n') + '\n';
      execSync('crontab -', { input: updated, encoding: 'utf8' });
      console.log('Added overnight autonomous cron.');
      if (toAdd.some((l) => l.includes('plan-execute'))) console.log('  Plan-execute: daily at', planTime + ':00 AM');
      if (toAdd.some((l) => l.includes('heartbeat'))) console.log('  Heartbeat: every', heartbeatInterval, 'hours');
      if (release && toAdd.some((l) => l.includes('run-autonomous-release'))) {
        console.log('  Autonomous release: daily at', planTime + 1, ':30 AM (set JARVIS_RELEASE_PRODUCT in env or crontab)');
      }
      console.log('Verify: crontab -l');
    } catch (e) {
      console.error('Failed to update crontab:', e.message);
      console.log('\nAdd these lines manually (crontab -e):\n');
      lines.forEach((l) => console.log(l));
      process.exit(1);
    }
    return;
  }

  console.log('JARVIS overnight autonomous — cron lines to add:\n');
  console.log('# Plan-execute daily at', planTime + ':00 AM');
  console.log(planCron);
  console.log('');
  console.log('# Heartbeat every', heartbeatInterval, 'hours');
  console.log(heartbeatCron);
  if (release) {
    console.log('');
    console.log('# Autonomous release (set JARVIS_RELEASE_PRODUCT)');
    console.log(lines[2]);
  }
  console.log('');
  console.log('To add automatically: node scripts/add-overnight-autonomous-cron.js --add');
  if (!release) console.log('To include release: node scripts/add-overnight-autonomous-cron.js --add --release');
}

main();
