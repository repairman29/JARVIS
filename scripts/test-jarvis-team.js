#!/usr/bin/env node
/**
 * Test JARVIS's ability to execute his team (BEAST-MODE, Code Roach, Echeo, workflow_dispatch).
 * Run from repo root. Requires: gateway running (e.g. start-gateway-with-vault.js), token in ~/.clawdbot/.env.
 *
 *   node scripts/test-jarvis-team.js
 *   node scripts/test-jarvis-team.js "Run the quality pipeline for BEAST-MODE"
 *   node scripts/test-jarvis-team.js --dry-run   # print expected orchestration steps only (no gateway call)
 */

const path = require('path');
const fs = require('fs');

const isDryRun = process.argv.includes('--dry-run');
const userMessageArg = process.argv.filter((a) => a !== '--dry-run')[2];

const gatewayUrl = process.env.CLAWDBOT_GATEWAY_URL || process.env.GATEWAY_URL || 'http://127.0.0.1:18789';
const envPath = path.join(process.env.HOME || require('os').homedir(), '.clawdbot', '.env');

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const token = process.env.CLAWDBOT_GATEWAY_TOKEN || process.env.OPENCLAW_GATEWAY_TOKEN || '';
const userMessage = userMessageArg || "Deploy and run your team. Who is on your team, and what is the first concrete action you would take to run them? (If a CLI is not installed, say what you would trigger instead—e.g. workflow_dispatch.)";

function dryRun() {
  console.log('--- JARVIS team execution (dry run) ---');
  console.log('Prompt:', userMessage.slice(0, 100) + (userMessage.length > 100 ? '...' : ''));
  console.log('');
  console.log('Expected behavior (from jarvis/AGENTS.md + docs/JARVIS_TEAM_DEPLOY_AND_RUN.md):');
  console.log('  • Team: BEAST-MODE (quality), Code Roach (PR/health), Echeo (bounties), sessions_spawn (subagents), workflow_dispatch.');
  console.log('  • JARVIS should: list team, then take first concrete action — exec (beast-mode, code-roach, echeo) if CLIs on PATH, or github_workflow_dispatch on agent repos.');
  console.log('  • products.json order: BEAST-MODE first (deepWorkAccess), then JARVIS, Olive, Echeo, MythSeeker.');
  console.log('');
  console.log('To run live: ensure gateway is up and LLM auth is valid, then run without --dry-run.');
}

async function main() {
  if (isDryRun) {
    dryRun();
    return;
  }
  const url = `${gatewayUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const headers = { 'Content-Type': 'application/json', 'x-openclaw-agent-id': 'main' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const body = {
    model: 'openclaw:main',
    messages: [{ role: 'user', content: userMessage }],
    stream: false,
    user: 'team-test',
  };

  console.log('Gateway:', gatewayUrl);
  console.log('Prompt:', userMessage.slice(0, 80) + (userMessage.length > 80 ? '...' : ''));
  console.log('---');

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error('HTTP', res.status, text.slice(0, 300));
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.log('Response:', text.slice(0, 800));
    return;
  }

  const content =
    data.choices?.[0]?.message?.content ??
    data.output ??
    data.response ??
    data.message ??
    data.content ??
    '';
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  console.log('JARVIS reply:\n');
  console.log(str);
  if (data.meta?.tools_used?.length) {
    console.log('\n[Tools used:', data.meta.tools_used.join(', ') + ']');
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
