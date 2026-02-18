#!/usr/bin/env node
/**
 * Prune JARVIS memory: cap session_messages per session and remove stale session_summaries.
 * See docs/JARVIS_MEMORY_CONSOLIDATION.md.
 *
 * Usage:
 *   node scripts/prune-jarvis-memory.js [--dry-run] [--max-messages-per-session 100] [--session-max-age-days 30]
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) from ~/.clawdbot/.env or env.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function loadEnv() {
  const candidates = [
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.clawdbot', '.env') : null,
    process.env.HOME ? path.join(process.env.HOME, '.clawdbot', '.env') : null,
    path.join(os.homedir(), '.clawdbot', '.env')
  ].filter(Boolean);
  const envPath = candidates.find((p) => fs.existsSync(p));
  if (!envPath) return;
  const text = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  for (const line of text.split(/\r?\n/)) {
    const m = line.trimEnd().match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

loadEnv();

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

function parseArgs() {
  const out = { dryRun: false, maxMessagesPerSession: 100, sessionMaxAgeDays: 30 };
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--max-messages-per-session' && process.argv[i + 1]) {
      out.maxMessagesPerSession = Math.max(1, parseInt(process.argv[++i], 10) || 100);
    } else if (arg === '--session-max-age-days' && process.argv[i + 1]) {
      out.sessionMaxAgeDays = Math.max(1, parseInt(process.argv[++i], 10) || 30);
    }
  }
  return out;
}

function sbFetch(pathname, opts = {}) {
  const url = `${SUPABASE_URL}${pathname}`;
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...opts.headers
  };
  return fetch(url, { ...opts, headers });
}

async function getAllSessionMessages() {
  const out = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const q = `select=id,session_id,created_at&order=created_at.asc&offset=${offset}&limit=${pageSize}`;
    const res = await sbFetch(`/rest/v1/session_messages?${q}`);
    if (!res.ok) throw new Error(`session_messages GET: ${res.status} ${await res.text()}`);
    const rows = await res.json();
    if (rows.length === 0) break;
    out.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

async function deleteMessageIds(ids) {
  if (ids.length === 0) return 0;
  const batch = 100;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += batch) {
    const chunk = ids.slice(i, i + batch);
    const filter = chunk.map((id) => `"${id}"`).join(',');
    const res = await sbFetch(`/rest/v1/session_messages?id=in.(${filter})`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`session_messages DELETE: ${res.status} ${await res.text()}`);
    deleted += chunk.length;
  }
  return deleted;
}

async function getStaleSummaryIds(cutoffIso) {
  const q = `select=id&updated_at=lt.${encodeURIComponent(cutoffIso)}`;
  const res = await sbFetch(`/rest/v1/session_summaries?${q}`);
  if (!res.ok) throw new Error(`session_summaries GET: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  return rows.map((r) => r.id);
}

async function deleteSummaryIds(ids) {
  if (ids.length === 0) return 0;
  const batch = 100;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += batch) {
    const chunk = ids.slice(i, i + batch);
    const filter = chunk.map((id) => `"${id}"`).join(',');
    const res = await sbFetch(`/rest/v1/session_summaries?id=in.(${filter})`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`session_summaries DELETE: ${res.status} ${await res.text()}`);
    deleted += chunk.length;
  }
  return deleted;
}

async function main() {
  const args = parseArgs();
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set in ~/.clawdbot/.env or env.');
    process.exit(1);
  }

  console.log('Prune JARVIS memory');
  console.log('  --dry-run:', args.dryRun);
  console.log('  --max-messages-per-session:', args.maxMessagesPerSession);
  console.log('  --session-max-age-days:', args.sessionMaxAgeDays);
  if (args.dryRun) console.log('  (dry run: no changes will be made)\n');

  // 1) Prune session_messages: keep last N per session
  const allMessages = await getAllSessionMessages();
  const bySession = {};
  for (const row of allMessages) {
    if (!bySession[row.session_id]) bySession[row.session_id] = [];
    bySession[row.session_id].push(row);
  }

  const idsToDelete = [];
  for (const [sessionId, rows] of Object.entries(bySession)) {
    if (rows.length <= args.maxMessagesPerSession) continue;
    const toRemove = rows.length - args.maxMessagesPerSession;
    for (let i = 0; i < toRemove; i++) idsToDelete.push(rows[i].id);
  }

  console.log('Session messages: total', allMessages.length, 'sessions', Object.keys(bySession).length);
  console.log('  Messages to prune (oldest per session over cap):', idsToDelete.length);
  if (idsToDelete.length > 0 && !args.dryRun) {
    const n = await deleteMessageIds(idsToDelete);
    console.log('  Deleted:', n);
  }

  // 2) Stale session_summaries
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - args.sessionMaxAgeDays);
  const cutoffIso = cutoff.toISOString();
  const staleIds = await getStaleSummaryIds(cutoffIso);
  console.log('Session summaries: stale (updated_at <', cutoffIso.substring(0, 10) + '):', staleIds.length);
  if (staleIds.length > 0 && !args.dryRun) {
    const n = await deleteSummaryIds(staleIds);
    console.log('  Deleted:', n);
  }

  console.log(args.dryRun ? '\nDry run complete. Run without --dry-run to apply.' : '\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
