#!/usr/bin/env node
/**
 * Set JARVIS's focus repo (for plan-execute, heartbeat, run-team-quality, etc.).
 * Focus = first active product in products.json. This script moves the given repo to the top.
 *
 * When you're "done" with BEAST MODE (or any current focus), run this so JARVIS works on the next repo.
 *
 * Usage:
 *   node scripts/set-focus-repo.js olive      # Olive is now focus (first in list)
 *   node scripts/set-focus-repo.js JARVIS     # JARVIS repo is now focus
 *   node scripts/set-focus-repo.js            # Print current focus (first product)
 *
 * Optional: JARVIS_FOCUS_REPO in env still overrides for scripts that read it; this script
 * changes the default (products.json order) so cron, agent loop, and "work top down" use the new order.
 */

const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const productsPath = path.join(repoRoot, 'products.json');

if (!fs.existsSync(productsPath)) {
  console.error('products.json not found at', productsPath);
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
if (!Array.isArray(products)) {
  console.error('products.json must be an array');
  process.exit(1);
}

const targetRepo = process.argv[2] ? process.argv[2].trim() : null;

if (!targetRepo) {
  const first = products.find((p) => p.status !== 'paused' && p.status !== 'archived');
  console.log('Current focus (first active in products.json):', first ? first.repo : 'none');
  if (first) console.log('  ', first.name, '—', first.description);
  process.exit(0);
}

const index = products.findIndex((p) => p.repo === targetRepo || p.name === targetRepo);
if (index === -1) {
  console.error('Repo not found in products.json:', targetRepo);
  console.error('Available:', products.map((p) => p.repo).join(', '));
  process.exit(1);
}

if (index === 0) {
  console.log('Focus already set to', targetRepo);
  process.exit(0);
}

const [item] = products.splice(index, 1);
products.unshift(item);
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n', 'utf8');
console.log('Focus set to', item.repo, '(' + item.name + '). JARVIS will use this as the next repo for plan-execute, heartbeat, and "work top down".');
