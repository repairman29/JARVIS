#!/usr/bin/env node
/**
 * Print the crontab line for plan-execute (daily 8 AM) so you can add it manually.
 * Optionally append to crontab if --add is passed (macOS/Linux).
 *
 * Usage:
 *   node scripts/add-plan-execute-cron.js           # print line only
 *   node scripts/add-plan-execute-cron.js --add     # append to crontab (backup first)
 */

const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const home = process.env.HOME || process.env.USERPROFILE || '';
const cronLine = `0 8 * * * HOME=${home} cd ${repoRoot} && node scripts/jarvis-autonomous-plan-execute.js`;

function main() {
  if (process.argv.includes('--add')) {
    try {
      let existing = '';
      try {
        existing = execSync('crontab -l', { encoding: 'utf8' });
      } catch (e) {
        if (e.status !== 1) throw e;
      }
      if (existing.includes('jarvis-autonomous-plan-execute')) {
        console.log('Plan-execute already in crontab. Current crontab:');
        console.log(existing || '(empty)');
        return;
      }
      const updated = (existing.trim() ? existing.trim() + '\n' : '') + cronLine + '\n';
      execSync('crontab -', { input: updated, encoding: 'utf8' });
      console.log('Added plan-execute to crontab (daily 8 AM).');
      console.log('Verify: crontab -l');
    } catch (e) {
      console.error('Failed to update crontab:', e.message);
      console.log('Add this line manually:');
      console.log(cronLine);
      process.exit(1);
    }
    return;
  }
  console.log('Add plan-execute to cron (e.g. daily at 8 AM):');
  console.log('');
  console.log(cronLine);
  console.log('');
  console.log('To add automatically: node scripts/add-plan-execute-cron.js --add');
}

main();
