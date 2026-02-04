#!/usr/bin/env node
/**
 * Orchestration: run JARVIS's team pipeline (safety net → quality → health → bounties).
 * Runs scripts and CLIs in sequence; skips missing CLIs. Optional webhook summary.
 *
 * Usage:
 *   node scripts/run-team-pipeline.js
 *   node scripts/run-team-pipeline.js --no-safety-net   # skip safety net
 *   node scripts/run-team-pipeline.js --quality-only    # only BEAST MODE quality
 *   node scripts/run-team-pipeline.js --webhook         # post summary to JARVIS_ALERT_WEBHOOK_URL
 *
 * Env: JARVIS_ALERT_WEBHOOK_URL or DISCORD_WEBHOOK_URL for --webhook.
 *      JARVIS_FOCUS_REPO or first product in products.json for quality target.
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');

function exec(cmd, opts = {}) {
  try {
    return {
      ok: true,
      out: execSync(cmd, { encoding: 'utf8', cwd: repoRoot, timeout: 120000, ...opts }).trim(),
    };
  } catch (e) {
    return { ok: false, err: e.message || String(e) };
  }
}

function which(name) {
  const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`;
  return exec(cmd).ok;
}

function getFocusRepo() {
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

async function runSafetyNet() {
  try {
    const { runSafetyNet } = require('./jarvis-safety-net.js');
    const snapshot = await runSafetyNet({ repair: false, jsonOnly: false });
    return {
      ok: true,
      status: snapshot.overall?.status || 'unknown',
      score: snapshot.overall?.score,
      checks: (snapshot.checks || []).map((c) => `${c.name}: ${c.status}`),
    };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

function runBeastModeQuality(_repo) {
  if (!which('beast-mode')) return { ok: false, skipped: true, reason: 'beast-mode not on PATH' };
  // beast-mode quality score typically takes no args; run from repo root or set cwd per product.
  return exec('beast-mode quality score');
}

function runCodeRoachHealth() {
  if (!which('code-roach')) return { ok: false, skipped: true, reason: 'code-roach not on PATH' };
  return exec('code-roach health');
}

function runEcheoBounties() {
  if (!which('echeo')) return { ok: false, skipped: true, reason: 'echeo not on PATH' };
  return exec('echeo --path .');
}

async function postWebhook(url, text) {
  return new Promise((resolve) => {
    const https = require('https');
    try {
      const u = new URL(url);
      const body = JSON.stringify({ content: text.slice(0, 1900) });
      const req = https.request(
        {
          method: 'POST',
          hostname: u.hostname,
          path: u.pathname + u.search,
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        },
        (res) => {
          res.on('data', () => {});
          res.on('end', () => resolve(res.statusCode));
        }
      );
      req.on('error', () => resolve(0));
      req.write(body);
      req.end();
    } catch {
      resolve(0);
    }
  });
}

async function main() {
  const noSafetyNet = process.argv.includes('--no-safety-net');
  const qualityOnly = process.argv.includes('--quality-only');
  const webhook = process.argv.includes('--webhook');

  const lines = [];
  const start = new Date().toISOString();
  lines.push(`[${start}] JARVIS team pipeline`);

  // 1. Safety net (optional)
  if (!noSafetyNet && !qualityOnly) {
    lines.push('');
    lines.push('--- Safety net ---');
    const sn = await runSafetyNet();
    if (sn.ok) {
      lines.push(`Status: ${sn.status} (score: ${sn.score})`);
      if (sn.checks && sn.checks.length) lines.push(sn.checks.slice(0, 8).join('\n'));
    } else {
      lines.push('Error: ' + (sn.err || 'unknown'));
    }
  }

  const focusRepo = getFocusRepo();

  // 2. BEAST MODE quality
  lines.push('');
  lines.push('--- BEAST MODE quality ---');
  const bm = runBeastModeQuality(focusRepo);
  if (bm.skipped) {
    lines.push('Skipped: ' + bm.reason);
  } else if (bm.ok) {
    lines.push(bm.out.slice(0, 600) || 'OK');
  } else {
    lines.push('Error: ' + (bm.err || 'unknown'));
  }

  if (qualityOnly) {
    console.log(lines.join('\n'));
    return;
  }

  // 3. Code Roach health
  lines.push('');
  lines.push('--- Code Roach health ---');
  const cr = runCodeRoachHealth();
  if (cr.skipped) {
    lines.push('Skipped: ' + cr.reason);
  } else if (cr.ok) {
    lines.push(cr.out.slice(0, 400) || 'OK');
  } else {
    lines.push('Error: ' + (cr.err || 'unknown'));
  }

  // 4. Echeo bounties (short)
  lines.push('');
  lines.push('--- Echeo (bounties) ---');
  const ec = runEcheoBounties();
  if (ec.skipped) {
    lines.push('Skipped: ' + ec.reason);
  } else if (ec.ok) {
    lines.push(ec.out.slice(0, 400) || 'OK');
  } else {
    lines.push('Error: ' + (ec.err || 'unknown'));
  }

  lines.push('');
  lines.push('--- Done ---');

  const summary = lines.join('\n');
  console.log(summary);

  if (webhook) {
    const url = process.env.JARVIS_ALERT_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL;
    if (url) {
      const code = await postWebhook(url, summary);
      if (code >= 200 && code < 300) console.log('Posted to webhook.');
      else console.log('Webhook returned', code);
    } else {
      console.log('No JARVIS_ALERT_WEBHOOK_URL or DISCORD_WEBHOOK_URL for --webhook');
    }
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
