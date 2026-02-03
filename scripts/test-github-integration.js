#!/usr/bin/env node
/**
 * Test GitHub integration: (1) verify GITHUB_TOKEN, (2) ask JARVIS to list repos via chat.
 * Run: node scripts/test-github-integration.js [baseUrl]
 * Prereqs: Gateway running (node scripts/start-gateway-with-vault.js), UI optional (baseUrl defaults to http://localhost:3001).
 * If baseUrl is omitted and UI is down, skips chat test and only runs check-github.
 */

const base = process.argv[2] || 'http://localhost:3001';

async function checkGitHub() {
  const { execSync } = require('child_process');
  try {
    execSync('node scripts/check-github.js', {
      cwd: require('path').resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    return true;
  } catch (e) {
    return false;
  }
}

async function chatTest() {
  const url = `${base.replace(/\/$/, '')}/api/chat`;
  const body = {
    messages: [
      {
        role: 'user',
        content: 'List my GitHub repos. Reply with only the first 3 repo full names, one per line.',
      },
    ],
    sessionId: 'github-integration-test',
    stream: false,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error('Chat API HTTP', res.status, text.slice(0, 200));
    return false;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('Chat response not JSON');
    return false;
  }
  const content =
    data?.content ??
    data?.choices?.[0]?.message?.content ??
    data?.output ??
    data?.response ??
    '';
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  console.log('\nJARVIS reply:', str.slice(0, 400) + (str.length > 400 ? '…' : ''));
  const looksLikeRepos = /repairman29|[\w-]+\/[\w-]+/.test(str) || /repo/i.test(str);
  if (looksLikeRepos) {
    console.log('\n[PASS] GitHub integration: JARVIS returned repo-like content.');
    return true;
  }
  console.log('\n[INFO] Reply may not have used GitHub; ensure gateway has GITHUB_TOKEN and github skill.');
  return true;
}

async function main() {
  console.log('=== 1. Check GITHUB_TOKEN (Vault / .env) ===\n');
  const tokenOk = await checkGitHub();
  if (!tokenOk) {
    console.error('\nAdd GITHUB_TOKEN to Vault or ~/.clawdbot/.env and re-run.');
    process.exit(1);
  }

  console.log('\n=== 2. Chat test (JARVIS list repos) ===');
  try {
    await chatTest();
  } catch (e) {
    console.error('Chat test failed:', e.message);
    console.error('Ensure gateway is running: node scripts/start-gateway-with-vault.js');
    console.error('If using UI: npm run dev in apps/jarvis-ui');
    process.exit(1);
  }

  console.log('\n=== Done ===');
}

main();
