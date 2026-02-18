/**
 * Memory search — semantic and structured search over JARVIS archived conversations.
 * Requires: jarvis_archive + jarvis_memory_chunks (migration 20250204120000_jarvis_archivist).
 * I/O limits: max 10 vector results, max 20 archive rows, 15s timeout per request.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const REQUEST_TIMEOUT_MS = 15000;
const MAX_MEMORY_SEARCH_RESULTS = 10;
const MAX_ARCHIVE_SEARCH_RESULTS = 20;
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

function sbRequest(pathname, opts = {}) {
  const url = `${SUPABASE_URL}${pathname}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...opts.headers
  };
  return fetch(url, {
    ...opts,
    headers,
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));
}

async function generateEmbedding(text) {
  const truncated = text.slice(0, 8000);
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: truncated })
  });
  if (!res.ok) throw new Error(`Ollama embeddings failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.embedding;
}

const tools = {
  memory_search: async ({ query = '', limit = 6, session_id: sessionFilter = null } = {}) => {
    const q = typeof query === 'string' ? query.trim() : '';
    if (!q) {
      return { success: false, message: 'Provide a search query (e.g. "what did we decide about OAuth").' };
    }
    const cap = Math.min(MAX_MEMORY_SEARCH_RESULTS, Math.max(1, Number(limit) || 6));
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { success: false, message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Run archivist first so memory chunks exist.' };
    }
    try {
      const embedding = await generateEmbedding(q);
      const res = await sbRequest('rest/v1/rpc/match_jarvis_memory_chunks', {
        method: 'POST',
        body: JSON.stringify({
          query_embedding: embedding,
          match_count: cap,
          session_filter: sessionFilter || null
        })
      });
      if (!res.ok) {
        const t = await res.text();
        return { success: false, message: `Memory search failed: ${res.status} ${t}` };
      }
      const rows = await res.json();
      const results = (Array.isArray(rows) ? rows : []).map((r) => ({
        session_id: r.session_id,
        source: r.source,
        content: r.content ? r.content.slice(0, 500) : '',
        similarity: r.similarity
      }));
      if (results.length === 0) {
        return { success: true, message: 'No archived conversations matched. Run archive-jarvis-sessions.js to populate memory.', results: [] };
      }
      return { success: true, query: q, results };
    } catch (err) {
      return { success: false, message: err.message || 'Memory search failed.' };
    }
  },

  archive_search: async ({ topic = null, session_id: sessionId = null, limit = 10 } = {}) => {
    const cap = Math.min(MAX_ARCHIVE_SEARCH_RESULTS, Math.max(1, Number(limit) || 10));
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return { success: false, message: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.' };
    }
    try {
      let query = `order=version_at.desc&limit=${cap}&select=session_id,version_at,span,extraction`;
      if (sessionId) query += `&session_id=eq.${encodeURIComponent(sessionId)}`;
      const res = await sbRequest(`rest/v1/jarvis_archive?${query}`);
      if (!res.ok) {
        const t = await res.text();
        return { success: false, message: `Archive search failed: ${res.status} ${t}` };
      }
      let rows = await res.json();
      if (!Array.isArray(rows)) rows = [];
      if (topic && typeof topic === 'string' && topic.trim()) {
        const t = topic.trim().toLowerCase();
        rows = rows.filter((r) => {
          const ext = r.extraction || {};
          const topics = Array.isArray(ext.topics) ? ext.topics : [];
          const summary = typeof ext.summary === 'string' ? ext.summary : '';
          return topics.some((x) => String(x).toLowerCase().includes(t)) || summary.toLowerCase().includes(t);
        });
      }
      const results = rows.map((r) => ({
        session_id: r.session_id,
        version_at: r.version_at,
        turn_count: r.span?.turn_count,
        summary: (r.extraction?.summary || '').slice(0, 400),
        topics: r.extraction?.topics || [],
        decisions: r.extraction?.decisions || []
      }));
      return { success: true, results, topic: topic || null };
    } catch (err) {
      return { success: false, message: err.message || 'Archive search failed.' };
    }
  }
};

module.exports = { tools };
