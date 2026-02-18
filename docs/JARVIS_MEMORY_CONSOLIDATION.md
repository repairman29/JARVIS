# JARVIS memory consolidation and decay

**Goal:** Over time, session summaries and preferences can grow or become redundant. This doc describes a **consolidation and decay** strategy so long-term memory stays useful without clutter. See [JARVIS_MEMORY.md](./JARVIS_MEMORY.md) for the base memory architecture.

---

## Current state

| Store | Purpose | Growth / risk |
|-------|---------|----------------|
| **session_messages** | Per-turn conversation | Grows with use; we already cap context via **summary + recent N** (see [JARVIS_MEMORY_WIRING.md](./JARVIS_MEMORY_WIRING.md)). Old messages can be pruned per session after summary is fresh. |
| **session_summaries** | One row per session_id; summary of older turns | One row per session; updated every K turns. Risk: many abandoned sessions leave stale rows. |
| **jarvis_prefs** | Key/value preferences (e.g. "always use Groq") | Can accumulate duplicate or conflicting keys if scope/keys drift. |

---

## What “consolidation” and “decay” mean

- **Consolidation** — Merge related information, resolve conflicts, deduplicate. Example: merge two prefs that mean the same thing; merge very old session_summaries into a single “archive” summary per user (if we add user_id later).
- **Decay** — Remove or compress old data so it doesn’t bloat context or storage. Example: delete messages older than N days for sessions that haven’t been used in M days; or keep only the last L messages per session and rely on summary for the rest.

---

## Options

### 1. Session message pruning (decay)

- **When:** Periodically (cron) or when loading a session (on-demand).
- **What:** For each `session_id`, keep only the last **N** messages (e.g. 100) and ensure `session_summaries` has an up-to-date summary for that session. Delete older rows from `session_messages`.
- **Where:** Edge function (e.g. a scheduled Edge job or a serverless cron that calls Supabase), or a script `scripts/prune-session-messages.js` that runs via cron and uses the Supabase client.

### 2. Stale session_summaries (decay)

- **When:** Periodic (e.g. weekly).
- **What:** Delete `session_summaries` rows where `updated_at` is older than **T** days (e.g. 30) and the corresponding `session_id` has no recent messages. Optional: keep one “archive” summary per user if we have user_id.
- **Where:** Same as above — script or Edge cron.

### 3. Preferences dedup / consolidation

- **When:** On read (lazy) or periodic (batch).
- **What:** If multiple rows in `jarvis_prefs` represent the same logical pref (e.g. same key, different scope), resolve to one. Or: when writing a pref, upsert by (key, scope) so we never create duplicates (we already have UNIQUE (key, scope)). Consolidation here is mostly “document scope semantics” and optional cleanup of legacy duplicates.
- **Where:** Application logic when reading prefs; optional one-off migration or script to merge duplicates.

### 4. “Wisdom” merge (advanced, AgentCore-style)

- **When:** Background, low frequency (e.g. weekly).
- **What:** Merge related facts from session_summaries or from an outcome log into a compact “wisdom” or “learned preferences” layer so the model gets high-signal context without re-reading every old summary. See [AGENTIC_AUTONOMY_2026_ECOSYSTEM.md](./AGENTIC_AUTONOMY_2026_ECOSYSTEM.md) § Consolidation and Information Decay.
- **Where:** Heavier lift; would require a small LLM or embedding pass to merge/summarize. Defer until we have a clear need (e.g. many long-lived sessions and context limits).

---

## Recommended order

1. **Document and enforce** — Document scope semantics for `jarvis_prefs` (e.g. scope = "default" or user_id) so new code doesn’t create duplicates. No code change if we already upsert by (key, scope).
2. **Session message pruning** — Implement a script or Edge cron that, per session, keeps last N messages and deletes older ones. Run daily or weekly. Thresholds: e.g. N = 100, and only prune sessions that have a row in `session_summaries` (so we don’t drop history before it’s summarized).
3. **Stale session_summaries** — Same script or cron: delete `session_summaries` rows for sessions not used in 30+ days (or where `session_messages` for that session_id are all older than 30 days).
4. **Wisdom merge** — Backlog; revisit when we have many long-lived sessions and context pressure.

---

## Script: prune-jarvis-memory.js

Implemented in **scripts/prune-jarvis-memory.js**. Run from repo root. Example:

```bash
node scripts/prune-jarvis-memory.js --dry-run
node scripts/prune-jarvis-memory.js --max-messages-per-session 100 --session-max-age-days 30
```

Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` from `~/.clawdbot/.env`. See script help for options.

Original outline (for reference):

```bash
# From repo root; needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or anon + RLS
node scripts/prune-jarvis-memory.js [--dry-run] [--max-messages-per-session 100] [--session-max-age-days 30]
```

- **Prune messages:** For each session_id, count messages; if count > max_messages_per_session, delete the oldest (count - max_messages_per_session) rows. Skip if session has no summary (or create a summary first if we want to keep “compressed” history).
- **Stale summaries:** Delete from session_summaries where updated_at < now() - session_max_age_days and no message in session_messages in that window (or simply “delete summaries older than 30 days” if we don’t need to check messages).

---

## What pruning is *not* (conversion to long-term)

The prune script **only deletes**; it does not convert session content into long-term memory. **Long-term memory** in JARVIS is defined in [JARVIS_MEMORY.md](./JARVIS_MEMORY.md) as:

| Long-term store | How it gets written | Purpose |
|-----------------|--------------------|---------|
| **DECISIONS.md** | User says "remember this decision" → `scripts/append-decision.js` (or JARVIS tool) appends to the doc. | Durable, human-readable decisions in repo. |
| **jarvis_prefs** | User says "always use X" → Edge/skill upserts (key, value, scope). | Preferences across sessions/devices. |
| **Repo index / CAPABILITIES** | Separate indexing and scan flows. | What code/products can do. |

**Converting** session history into long-term memory would mean: before (or instead of) deleting old turns, extract **decisions**, **outcomes**, or **learned preferences** and write them to DECISIONS.md or jarvis_prefs. That is the **"checkpoint to long-term"** / **"wisdom merge"** idea (JARVIS_MEMORY.md Phase 3; consolidation doc § Options, option 4). It is not implemented yet: today we **prune** (decay) and **separately** rely on the user (or JARVIS when the user says "remember this") to write to DECISIONS or prefs. A future step could be a job that summarizes old sessions and appends key points to DECISIONS or a `jarvis_wisdom` table. **Structured long-term memory** is implemented by the **JARVIS Archivist**: see [JARVIS_ARCHIVIST.md](./JARVIS_ARCHIVIST.md) for embeddings + structured "versions" (topics, decisions, entities) that bots can search and query.

---

## References

- [JARVIS_MEMORY.md](./JARVIS_MEMORY.md) — Base memory architecture; short-term vs long-term; checkpoint to long-term.
- [JARVIS_MEMORY_WIRING.md](./JARVIS_MEMORY_WIRING.md) — How Edge uses session_messages and session_summaries.
- [AGENTIC_AUTONOMY_2026_ECOSYSTEM.md](./AGENTIC_AUTONOMY_2026_ECOSYSTEM.md) — § Consolidation and Information Decay (AgentCore-style).
- [JARVIS_MASTER_ROADMAP.md](./JARVIS_MASTER_ROADMAP.md) — §3 item 2 (Memory consolidation/decay).
