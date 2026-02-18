#!/usr/bin/env node
/**
 * Set or clear the multi-day goal for plan-execute.
 * Plan-execute reads ~/.jarvis/autonomous-goal.txt and injects "Current multi-day goal: <goal>" into the prompt.
 *
 * Usage:
 *   node scripts/set-autonomous-goal.js "Ship Olive v2 by Friday"
 *   node scripts/set-autonomous-goal.js --clear
 *   node scripts/set-autonomous-goal.js              # print current goal (if any)
 */

const path = require('path');
const fs = require('fs');

const dir = path.join(process.env.HOME || process.env.USERPROFILE, '.jarvis');
const goalPath = path.join(dir, 'autonomous-goal.txt');
const MAX_LEN = 500;

function getGoal() {
  try {
    if (fs.existsSync(goalPath)) {
      const raw = fs.readFileSync(goalPath, 'utf8').trim();
      if (raw.length > 0) return raw.slice(0, MAX_LEN);
    }
  } catch (_) {}
  return null;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    const goal = getGoal();
    if (goal) {
      console.log('Current multi-day goal:');
      console.log(goal);
    } else {
      console.log('No goal set. Set with: node scripts/set-autonomous-goal.js "Your goal here"');
    }
    return;
  }
  if (args[0] === '--clear' || args[0] === '-c') {
    try {
      if (fs.existsSync(goalPath)) fs.unlinkSync(goalPath);
      console.log('Goal cleared.');
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
    return;
  }
  const goal = args.join(' ').trim().slice(0, MAX_LEN);
  if (!goal) {
    console.error('Provide a non-empty goal or use --clear.');
    process.exit(1);
  }
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(goalPath, goal, 'utf8');
    console.log('Goal set. Plan-execute will use:');
    console.log(goal);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

main();
