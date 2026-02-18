#!/usr/bin/env node
/**
 * Append a decision to DECISIONS.md in the repo. Use when the user says "remember this decision" or "we decided X."
 * Run from repo root: node scripts/append-decision.js "One-line summary of the decision"
 * Or: echo "Summary" | node scripts/append-decision.js
 *
 * See docs/DECISIONS_MEMORY.md.
 */

const fs = require('fs');
const path = require('path');

function getSummary() {
  const args = process.argv.slice(2);
  if (args.length > 0) return args.join(' ').trim();
  if (process.stdin.isTTY) return '';
  return fs.readFileSync(0, 'utf8').trim();
}

const repoRoot = process.env.CLAWDBOT_REPO_ROOT || process.cwd();
const decisionsPath = path.join(repoRoot, 'DECISIONS.md');
const summary = getSummary();

const summary = getSummary();
if (!summary) {
  console.error('Usage: node scripts/append-decision.js "Decision summary"');
  console.error('   or: echo "Summary" | node scripts/append-decision.js');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const entry = `\n## ${today} — ${summary}\n`;

let content = '';
if (fs.existsSync(decisionsPath)) {
  content = fs.readFileSync(decisionsPath, 'utf8');
  if (!content.trim()) content = '# Decisions\n';
} else {
  content = '# Decisions\n';
}

if (!content.endsWith('\n')) content += '\n';
content += entry;
fs.writeFileSync(decisionsPath, content, 'utf8');
console.log('Appended to DECISIONS.md:', entry.trim());
