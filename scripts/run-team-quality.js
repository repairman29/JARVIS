#!/usr/bin/env node
/**
 * Orchestration: run BEAST MODE quality only (single agent in the team).
 * Target repo from products.json (first) or JARVIS_FOCUS_REPO or argument.
 *
 * Usage:
 *   node scripts/run-team-quality.js
 *   node scripts/run-team-quality.js BEAST-MODE
 *   JARVIS_FOCUS_REPO=olive node scripts/run-team-quality.js
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');

function getFocusRepo() {
  if (process.argv[2]) return process.argv[2];
  if (process.env.JARVIS_FOCUS_REPO) return process.env.JARVIS_FOCUS_REPO;
  const productsPath = path.join(repoRoot, 'products.json');
  if (!fs.existsSync(productsPath)) return null;
  try {
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const first = Array.isArray(products) ? products[0] : null;
    return first && first.repo ? first.repo : null;
  } catch {
    return null;
  }
}

function which(name) {
  const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`;
  try {
    execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function exec(cmd) {
  try {
    return { ok: true, out: execSync(cmd, { encoding: 'utf8', cwd: repoRoot, timeout: 60000 }).trim() };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

const repo = getFocusRepo();
console.log('BEAST MODE quality — repo:', repo || '(default)');

if (!which('beast-mode')) {
  console.log('Skipped: beast-mode not on PATH. Install the BEAST-MODE CLI or trigger via workflow_dispatch.');
  process.exit(0);
}

// beast-mode quality score often takes no args; repo is for cwd or future CLI support.
const result = exec('beast-mode quality score');
if (result.ok) {
  console.log(result.out);
} else {
  console.error(result.err);
  process.exit(1);
}
