# JARVIS Archivist — Embeddings and Structured Memory for Bots

**Goal:** Move beyond prune-only and explicit "remember this decision" by adding an **archivist** that turns conversations into (1) **embeddings** for semantic search and (2) **structured, computer-readable "versions"** (AST-like) that bots can query and reason over.

---

## What the archivist does

| Output | Purpose | How bots use it |
|--------|---------|------------------|
| **Embeddings** | Chunks of conversation (or summaries) embedded into a vector space. | **Semantic search:** "Find past conversations about OAuth" → vector similarity over `jarvis_memory_chunks`. Same pattern as repo-knowledge (pgvector + nomic-embed-text). |
| **Structured extraction** | A JSON "version" per session (or per N turns): topics, decisions, entities, actions, summary. | **Structured query:** "Sessions where we decided X," "Conversations mentioning product Y," "What did we agree about deployment?" → filter/query `jarvis_archive` by `extraction.decisions`, `extraction.entities`, etc. |

So: **archivist** = process that runs periodically (or on demand), reads `session_messages` / `session_summaries`, and writes to **jarvis_memory_chunks** (embeddings) and **jarvis_archive** (structured versions). Bots then **surf** memory via vector search + structured filters.

---

## Structured format (AST-like, computer-readable)

We store a **version** per session (or per checkpoint) as JSONB. Bots can parse and filter without an LLM. Suggested shape:

```json
{
  "version": 1,
  "session_id": "jarvis-ui-abc123",
  "span": { "first_turn_at": "2025-02-01T10:00:00Z", "last_turn_at": "2025-02-01T11:30:00Z", "turn_count": 42 },
  "summary": "User and JARVIS planned olive deep work; decided to use Vercel for frontend; next: phase 2 tasks.",
  "topics": ["olive", "deep work", "Vercel", "deployment", "phase 2"],
  "decisions": [
    { "text": "Use Vercel for frontend deploy", "context": "olive" }
  ],
  "entities": [
    { "type": "product", "name": "olive" },
    { "type": "tool", "name": "Vercel" }
  ],
  "actions": [
    { "description": "Run BEAST MODE on olive", "outcome": "planned" }
  ],
  "preferences_inferred": []
}
```

- **topics** — Strings; what the conversation was about (for filter and display).
- **decisions** — Explicit or inferred decisions; bots can search "sessions where we decided X."
- **entities** — Products, repos, tools, people; supports "conversations about olive."
- **actions** — Things we did or planned (run triad, deploy, etc.); optional outcome.
- **preferences_inferred** — Optional; prefs we might want to push to `jarvis_prefs` later.

This is **not** raw text: it's a small, typed structure so a bot can do `WHERE extraction->'decisions' @> '[{"text": "..."}]'` or "give me sessions where topics contain 'oauth'."

---

## Schema (Supabase)

### 1. `jarvis_memory_chunks` (embeddings)

Same idea as `repo_chunks`: one row per embedded chunk. Bots search by vector similarity.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key. |
| session_id | text | Which session this chunk came from. |
| source | text | `session_summary` \| `session_turn` \| `archive_extraction`. |
| content | text | The text that was embedded (summary, turn, or extraction snippet). |
| embedding | vector(768) | From nomic-embed-text (same as repo_chunks). |
| metadata | jsonb | Optional: turn_range, created_at, archive_id. |
| created_at | timestamptz | When the archivist wrote this row. |

Index: `ivfflat` on `embedding` for cosine similarity (same as repo-knowledge). Optional: index on `session_id` for "all chunks for this session."

### 2. `jarvis_archive` (structured versions)

One row per "version" of a session (e.g. one per session when archivist runs, or one per N new turns).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key. |
| session_id | text | Session this version describes. |
| version_at | timestamptz | When this version was produced. |
| span | jsonb | `{ first_turn_at, last_turn_at, turn_count }`. |
| extraction | jsonb | The structured object (topics, decisions, entities, actions, summary). |
| created_at | timestamptz | Row insert time. |

Indexes: `session_id`, `version_at`; GIN on `extraction` for JSONB queries (e.g. `extraction->'topics' ? 'oauth'`).

---

## How the archivist runs

1. **Input:** Sessions to archive. Options:
   - **Cron:** "Last 24h active sessions" or "Sessions with new turns since last archive."
   - **After prune:** Run archivist **before** prune so we don't delete before we archive.
   - **On-demand:** `node scripts/archive-jarvis-sessions.js [--session-id ...]`.

2. **Steps per session:**
   - Load `session_messages` (or `session_summaries.summary_text` + last N messages).
   - **Structured extraction:** Call an LLM with a prompt: "Given this conversation, output JSON with topics, decisions, entities, actions, summary" (or use a rule-based parser for simple cases). Validate and store in `jarvis_archive.extraction`.
   - **Chunks for embedding:** Build chunks from (a) the session summary and (b) the extraction summary + key strings (e.g. concatenate topics, decision texts). Optionally chunk long raw conversation in overlapping windows. Generate embeddings (Ollama nomic-embed-text, same as repo index). Insert into `jarvis_memory_chunks` with `session_id`, `source`, `metadata.archive_id` pointing to `jarvis_archive.id`.

3. **Idempotency:** For a given session, either (a) upsert one row in `jarvis_archive` per run (version_at = now) or (b) replace the latest version. Chunks can be append-only or replace-by-session; replace keeps storage bounded.

---

## How bots surf memory

| Query type | How | Example |
|------------|-----|--------|
| **Semantic** | Embed the user question, call `match_jarvis_memory_chunks(query_embedding, limit)` (or equivalent RPC). | "What did we say about OAuth refresh?" → vector search → return matching chunks + session_id. |
| **Structured** | SQL or RPC on `jarvis_archive`: filter by `extraction->'topics'`, `extraction->'decisions'`, `extraction->'entities'`. | "Sessions where we decided to use Vercel" → `WHERE extraction->'decisions' @> '[{"text":"...Vercel..."}]'` or similar. |
| **Hybrid** | Vector search first, then filter by session_id and join to `jarvis_archive` for structured fields. | "Conversations about olive that had a deployment decision" → vector search "olive deployment", then filter archive by decisions. |

A **skill** (e.g. `memory_search` or `archive_search`) can expose:
- `memory_search({ query })` — semantic search over `jarvis_memory_chunks`; returns chunks + session_id + snippet.
- `archive_search({ topics?, decisions?, entities? })` — structured filter over `jarvis_archive`; returns session_id, extraction summary, span.

So bots get both "find by meaning" and "find by structured fact."

---

## Implementation order

1. **Migration** — Create `jarvis_memory_chunks` and `jarvis_archive` (see schema above); enable pgvector; add RPC `match_jarvis_memory_chunks` mirroring `match_repo_chunks`.
2. **Script: archive-jarvis-sessions.js** — Stub that: reads session_messages/summaries from Supabase; for each session, (a) builds a simple extraction (e.g. summary-only or rule-based topics); (b) writes to `jarvis_archive`; (c) generates 1–2 chunks (e.g. summary + extraction summary), embeds, writes to `jarvis_memory_chunks`. No LLM required for v1; add LLM extraction in a follow-up.
3. **LLM extraction (v2)** — Optional: call gateway or OpenAI to produce the full structured JSON (topics, decisions, entities, actions); validate and store. Improves quality of "versions" for bot queries.
4. **Skill: memory_search / archive_search** — **Done.** `skills/memory-search` exposes **memory_search** (vector, max 10 results, 15s timeout) and **archive_search** (structured, max 20 rows). I/O limits: see skill SKILL.md and § I/O limits below.

---

## I/O limits

- **Archivist script:** `--max-sessions` (default 50); `--delay-ms` (default 500) between sessions.
- **memory_search:** Max 10 results, 15s timeout, 8k query truncation.
- **archive_search:** Max 20 rows, 15s timeout.

---

## Script: archive-jarvis-sessions.js

Run from repo root. Requires Supabase env and (for embeddings) Ollama with `nomic-embed-text`.

```bash
node scripts/archive-jarvis-sessions.js --dry-run
node scripts/archive-jarvis-sessions.js --sessions-with-activity-in-days 7
node scripts/archive-jarvis-sessions.js --session-id jarvis-ui-abc123
```

v1 uses **naive topic extraction** (word set from summary); no LLM. Add an LLM step later to fill `decisions`, `entities`, `actions` in the structured extraction.

---

## References

- [JARVIS_MEMORY.md](./JARVIS_MEMORY.md) — Short-term vs long-term; DECISIONS, prefs.
- [JARVIS_MEMORY_CONSOLIDATION.md](./JARVIS_MEMORY_CONSOLIDATION.md) — Prune script; conversion to long-term; wisdom merge.
- [scripts/repo-knowledge.sql](../scripts/repo-knowledge.sql) — pgvector schema and `match_repo_chunks` pattern.
- [scripts/index-repos.js](../scripts/index-repos.js) — Chunking and Ollama embeddings.
- [AGENTIC_AUTONOMY_2026_ECOSYSTEM.md](./AGENTIC_AUTONOMY_2026_ECOSYSTEM.md) — Agent memory, read-write cycle, vector stores.
