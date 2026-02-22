#!/usr/bin/env node
/**
 * JARVIS Archivist: turn conversations into embeddings + structured "versions" for bots.
 * See docs/JARVIS_ARCHIVIST.md.
 *
 * Usage:
 *   node scripts/archive-jarvis-sessions.js [--dry-run] [--session-id ID] [--sessions-with-activity-in-days 7] [--max-sessions N] [--delay-ms N]
 *   node scripts/archive-jarvis-sessions.js [--from-queue] [--dry-run] [--delay-ms N]
 *
 * Auto-archive: use Edge Function POST action=archive (no body) to enqueue idle/long sessions; then run with --from-queue (e.g. from cron or launchd).
 * I/O limits: --max-sessions (default 50) caps how many sessions to process; --delay-ms (default 500) waits between sessions to avoid hammering Supabase/Ollama.
 *
 * Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY; OLLAMA_BASE_URL (default http://localhost:11434) for embeddings.
 * Requires: pgvector migration 20250204120000_jarvis_archivist.sql applied.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const OLLAMA_URL = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
const EMBEDDING_MODEL = 'nomic-embed-text';

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
  const out = { dryRun: false, sessionId: null, sessionsWithActivityInDays: 7, maxSessions: 50, delayMs: 500, fromQueue: false };
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--from-queue') out.fromQueue = true;
    else if (arg === '--session-id' && process.argv[i + 1]) out.sessionId = process.argv[++i].trim();
    else if (arg === '--sessions-with-activity-in-days' && process.argv[i + 1]) {
      out.sessionsWithActivityInDays = Math.max(1, parseInt(process.argv[++i], 10) || 7);
    } else if (arg === '--max-sessions' && process.argv[i + 1]) {
      out.maxSessions = Math.max(1, parseInt(process.argv[++i], 10) || 50);
    } else if (arg === '--delay-ms' && process.argv[i + 1]) {
      out.delayMs = Math.max(0, parseInt(process.argv[++i], 10) || 500);
    }
  }
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function generateEmbedding(text) {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text.slice(0, 8000) })
  });
  if (!res.ok) throw new Error(`Ollama embeddings failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.embedding;
}

/** Naive topic extraction: unique words (length > 2) from summary, lowercased, max 15. */
function naiveTopics(summary) {
  if (!summary || typeof summary !== 'string') return [];
  const words = summary
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return [...new Set(words)].slice(0, 15);
}

/**
 * Get session IDs from jarvis_archive_queue where processed_at is null (--from-queue).
 */
async function getSessionsFromQueue() {
  const res = await sbFetch(
    '/rest/v1/jarvis_archive_queue?processed_at=is.null&select=id,session_id&order=requested_at.asc'
  );
  if (!res.ok) throw new Error(`jarvis_archive_queue GET: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  return rows || [];
}

/**
 * Mark a queue row as processed (or failed).
 */
async function markQueueProcessed(queueId, error = null) {
  const body = error ? { processed_at: new Date().toISOString(), error: String(error).slice(0, 500) } : { processed_at: new Date().toISOString() };
  const res = await sbFetch(`/rest/v1/jarvis_archive_queue?id=eq.${queueId}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`jarvis_archive_queue PATCH: ${res.status} ${await res.text()}`);
}

/**
 * Get session IDs to archive: either from queue (--from-queue), a single --session-id, or sessions with messages in the last N days.
 */
async function getSessionsToArchive(args) {
  if (args.fromQueue) {
    const rows = await getSessionsFromQueue();
    return rows.map((r) => ({ sessionId: r.session_id, queueId: r.id }));
  }
  if (args.sessionId) return [{ sessionId: args.sessionId, queueId: null }];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - args.sessionsWithActivityInDays);
  const cutoffIso = cutoff.toISOString();
  const q = `select=session_id&created_at=gte.${encodeURIComponent(cutoffIso)}`;
  const res = await sbFetch(`/rest/v1/session_messages?${q}`);
  if (!res.ok) throw new Error(`session_messages GET: ${res.status} ${await res.text()}`);
  const rows = await res.json();
  const ids = [...new Set((rows || []).map((r) => r.session_id).filter(Boolean))];
  return ids.map((sessionId) => ({ sessionId, queueId: null }));
}

/** Load summary for a session if any. */
async function getSessionSummary(sessionId) {
  const q = `session_id=eq.${encodeURIComponent(sessionId)}&select=summary_text,updated_at`;
  const res = await sbFetch(`/rest/v1/session_summaries?${q}`);
  if (!res.ok) return null;
  const rows = await res.json();
  return rows && rows[0] ? rows[0].summary_text : null;
}

/** Load last N messages for a session (for span and fallback content). */
async function getSessionMessages(sessionId, limit = 50) {
  const q = `session_id=eq.${encodeURIComponent(sessionId)}&order=created_at.asc&limit=${limit}&select=role,content,created_at`;
  const res = await sbFetch(`/rest/v1/session_messages?${q}`);
  if (!res.ok) return [];
  const rows = await res.json();
  return rows || [];
}

async function archiveOneSession(sessionId, args, queueId = null) {
  const summary = await getSessionSummary(sessionId);
  const messages = await getSessionMessages(sessionId);

  if (messages.length === 0) return { session_id: sessionId, skipped: true, reason: 'no messages' };

  const firstAt = messages[0]?.created_at || new Date().toISOString();
  const lastAt = messages[messages.length - 1]?.created_at || new Date().toISOString();
  const span = { first_turn_at: firstAt, last_turn_at: lastAt, turn_count: messages.length };

  const summaryText = summary && summary.trim() ? summary.trim() : null;
  const fallbackSummary = summaryText || messages.slice(-5).map((m) => `${m.role}: ${m.content}`).join('\n').slice(0, 2000);
  const topics = naiveTopics(fallbackSummary);

  const extraction = {
    version: 1,
    summary: fallbackSummary.slice(0, 4000),
    topics,
    decisions: [],
    entities: [],
    actions: [],
    preferences_inferred: []
  };

  if (args.dryRun) {
    return { session_id: sessionId, dry_run: true, extraction: { ...extraction, summary: extraction.summary.slice(0, 200) + '...' } };
  }

  const archiveRes = await sbFetch('/rest/v1/jarvis_archive', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      session_id: sessionId,
      version_at: new Date().toISOString(),
      span,
      extraction
    })
  });
  if (!archiveRes.ok) throw new Error(`jarvis_archive POST: ${archiveRes.status} ${await archiveRes.text()}`);
  const archiveRows = await archiveRes.json();
  const archiveId = Array.isArray(archiveRows) && archiveRows[0] ? archiveRows[0].id : null;

  const chunkContent = [extraction.summary, topics.join(' ')].filter(Boolean).join('\n').slice(0, 8000);
  const embedding = await generateEmbedding(chunkContent);

  const chunkRes = await sbFetch('/rest/v1/jarvis_memory_chunks', {
    method: 'POST',
    body: JSON.stringify({
      session_id: sessionId,
      source: 'archive_extraction',
      content: chunkContent.slice(0, 4000),
      embedding,
      metadata: { archive_id: archiveId, turn_count: messages.length }
    })
  });
  if (!chunkRes.ok) throw new Error(`jarvis_memory_chunks POST: ${chunkRes.status} ${await chunkRes.text()}`);

  if (queueId) await markQueueProcessed(queueId, null);
  return { session_id: sessionId, archive_id: archiveId, chunks: 1 };
}

async function main() {
  const args = parseArgs();
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set in ~/.clawdbot/.env or env.');
    process.exit(1);
  }

  console.log('JARVIS Archivist');
  console.log('  --dry-run:', args.dryRun);
  console.log('  --from-queue:', args.fromQueue);
  console.log('  --session-id:', args.sessionId || '(all with activity)');
  console.log('  --sessions-with-activity-in-days:', args.sessionsWithActivityInDays);
  if (args.dryRun) console.log('  (dry run: no writes)\n');

  let items = await getSessionsToArchive(args);
  items = items.slice(0, args.maxSessions);
  console.log('Sessions to process:', items.length, args.maxSessions < 1e6 ? `(capped at ${args.maxSessions})` : '');
  console.log('  I/O: delay between sessions', args.delayMs, 'ms');

  const results = [];
  for (let i = 0; i < items.length; i++) {
    const { sessionId, queueId } = items[i];
    if (i > 0 && !args.dryRun && args.delayMs > 0) await sleep(args.delayMs);
    try {
      const r = await archiveOneSession(sessionId, args, queueId);
      results.push(r);
      if (r.skipped) console.log('  Skip', sessionId, r.reason);
      else if (r.dry_run) console.log('  Would archive', sessionId);
      else console.log('  Archived', sessionId, '→', r.archive_id);
    } catch (err) {
      if (queueId && !args.dryRun) {
        try { await markQueueProcessed(queueId, err.message); } catch (e) { /* ignore */ }
      }
      console.error('  Error', sessionId, err.message);
      results.push({ session_id: sessionId, error: err.message });
    }
  }

  const ok = results.filter((r) => !r.error && !r.skipped).length;
  console.log(args.dryRun ? '\nDry run complete. Run without --dry-run to write.' : `\nDone. Archived ${ok} session(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
