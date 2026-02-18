#!/usr/bin/env node
/**
 * JARVIS proactive heartbeat brief
 * Runs safety net checks, optionally lists open PRs/issues, and sends a short brief to Discord/webhook.
 * Use on a schedule (cron) or on-demand. See jarvis/HEARTBEAT.md.
 *
 * Usage:
 *   node scripts/heartbeat-brief.js
 *   node scripts/heartbeat-brief.js --no-webhook   # run checks only, do not post
 *   node scripts/heartbeat-brief.js --json         # output snapshot JSON only
 *
 * Env: JARVIS_ALERT_WEBHOOK_URL or DISCORD_WEBHOOK_URL for posting the brief.
 */

const { execSync } = require('child_process');
const { runSafetyNet } = require('./jarvis-safety-net.js');
const { loadEnvFile: loadVaultEnv, resolveEnv } = require('./vault.js');

async function getEnv(key, fallback) {
  const env = loadVaultEnv();
  const fromVault = await resolveEnv(key, env);
  return fromVault || process.env[key] || (env && env[key]) || fallback;
}

function safeExec(cmd) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim() };
  } catch {
    return { ok: false };
  }
}

function isGhAvailable() {
  const which = process.platform === 'win32' ? 'where gh' : 'which gh';
  return safeExec(which).ok;
}

/** Return { openPrs, openIssues } when gh is available; otherwise { openPrs: null, openIssues: null }. */
function getOpenPrsAndIssues() {
  if (!isGhAvailable()) return { openPrs: null, openIssues: null };
  let openPrs = null;
  let openIssues = null;
  const prResult = safeExec('gh pr list --state open --json number');
  if (prResult.ok && prResult.output) {
    try {
      const arr = JSON.parse(prResult.output);
      openPrs = Array.isArray(arr) ? arr.length : 0;
    } catch {
      openPrs = null;
    }
  }
  const issueResult = safeExec('gh issue list --state open --json number');
  if (issueResult.ok && issueResult.output) {
    try {
      const arr = JSON.parse(issueResult.output);
      openIssues = Array.isArray(arr) ? arr.length : 0;
    } catch {
      openIssues = null;
    }
  }
  return { openPrs, openIssues };
}

/** Derive a one-line "next action" from snapshot and optional PR/issue counts. */
function getNextAction(snapshot, openPrs, openIssues) {
  const checks = snapshot.checks || [];
  const failing = checks.find((c) => c.status === 'fail');
  if (failing) return `Next: fix ${failing.name}`;
  const warn = checks.find((c) => c.status === 'warn');
  if (warn) return `Next: address ${warn.name}`;
  if (openPrs != null && openPrs > 0) return `Next: review ${openPrs} open PR(s)`;
  if (openIssues != null && openIssues > 0) return `Next: triage ${openIssues} open issue(s)`;
  return 'Next: all clear';
}

async function postWebhook(url, payload) {
  const https = require('https');
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const body = JSON.stringify(payload);
      const req = https.request(
        {
          method: 'POST',
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          res.on('data', () => {});
          res.on('end', () => resolve(res.statusCode));
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function main() {
  const noWebhook = process.argv.includes('--no-webhook');
  const jsonOnly = process.argv.includes('--json');

  // When jsonOnly: safety net writes JSON to stdout; we just run it and exit.
  if (jsonOnly) {
    await runSafetyNet({ repair: false, jsonOnly: true });
    return;
  }
  const snapshot = await runSafetyNet({ repair: false, jsonOnly: false });

  const status = snapshot.overall.status.toUpperCase();
  const score = snapshot.overall.score;
  const checks = (snapshot.checks || [])
    .filter((c) => c.status !== 'ok')
    .map((c) => `${c.name}: ${c.status}`)
    .slice(0, 5);
  const repoCheck = (snapshot.checks || []).find((c) => c.name === 'repo_index_freshness');
  const repoMsg = repoCheck && repoCheck.message ? ` | ${repoCheck.message}` : '';

  const { openPrs, openIssues } = getOpenPrsAndIssues();
  const nextAction = getNextAction(snapshot, openPrs, openIssues);

  const counts = [];
  if (openPrs != null) counts.push(`${openPrs} open PR(s)`);
  if (openIssues != null) counts.push(`${openIssues} open issue(s)`);
  const countsLine = counts.length ? counts.join(', ') : null;

  const lines = [
    `JARVIS brief — ${status} (${score}/100)${repoMsg}`,
    countsLine,
    checks.length ? `Checks: ${checks.join(', ')}` : null,
    nextAction,
    `Host: ${snapshot.host?.hostname || 'unknown'} (${snapshot.timestamp || new Date().toISOString()})`,
  ].filter(Boolean);
  const content = lines.join('\n');

  console.log(content);

  if (!noWebhook) {
    const webhookUrl = (await getEnv('JARVIS_ALERT_WEBHOOK_URL')) || (await getEnv('DISCORD_WEBHOOK_URL'));
    if (webhookUrl) {
      try {
        await postWebhook(webhookUrl, { content });
        console.log('Brief posted to webhook.');
      } catch (e) {
        console.error('Webhook post failed:', e.message);
      }
    }
  }
}

main().catch((e) => {
  console.error('heartbeat-brief failed:', e.message);
  process.exit(1);
});
