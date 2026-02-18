# Memory search — surf archived conversations

Search JARVIS long-term memory: **semantic** (vector) and **structured** (topics, decisions). Requires the archivist to have run so `jarvis_memory_chunks` and `jarvis_archive` are populated. See [docs/JARVIS_ARCHIVIST.md](../../docs/JARVIS_ARCHIVIST.md).

## I/O limits

- **memory_search:** max 10 results per call; 15s timeout; query text truncated to 8k before embedding.
- **archive_search:** max 20 rows per call; 15s timeout. Topic filter applied in-process to avoid heavy JSONB filters.

## When to use

| User says… | Tool | Notes |
|------------|------|--------|
| "What did we decide about OAuth?" | memory_search | Semantic search over archived chunks. |
| "Find past conversations about deployment" | memory_search | Same; returns matching snippets + session_id. |
| "Sessions about olive" | archive_search | Filter by topic; returns summary, topics, decisions. |

## Setup

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in gateway env (or ~/.clawdbot/.env).
- Archivist migration applied; run `node scripts/archive-jarvis-sessions.js` so memory has data.
- For memory_search: Ollama with `nomic-embed-text` (same as repo-knowledge).
