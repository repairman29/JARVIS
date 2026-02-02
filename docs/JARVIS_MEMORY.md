# JARVIS Memory — Long Life, Short-Term vs Long-Term

**Goal:** A clear **memory architecture** so JARVIS has "long life" (survives restarts, time, and session switches) and a solid **short-term vs long-term** setup.

---

## Doc vs DB — when to use which

| Memory type | Prefer | Why |
|-------------|--------|-----|
| **Session messages / thread** | **DB table** | Query by session_id, scale, survives gateway restart; you already have Supabase. File per session is possible but messier. |
| **Conversation summary** | **DB table** | Keyed by session_id; gateway/Edge can read when reconnecting. |
| **Decisions** | **Doc** (DECISIONS.md) or **DB table** | **Doc:** human-readable, in repo, versioned, no extra infra; JARVIS reads via repo_file/repo_search. **DB:** queryable, filter by product/date, good if you want "decisions for olive" without indexing. Use **doc** for simplicity; use **DB** if you want structured query. |
| **Preferences** | **DB table** if multi-device / future auth; **doc** (prefs.json) if single-machine | **DB:** same prefs everywhere, can scope by user later. **File:** zero infra, ~/.jarvis/prefs.json. |
| **Checkpoint / outcome log** | **Doc** (append to DECISIONS or LOG.md) or **DB** | Same tradeoff as decisions: doc = simple and in repo; DB = queryable. |

**Recommendation:** **Session state + summary + prefs → DB table(s)** in Supabase (e.g. `session_messages`, `session_summaries`, `jarvis_prefs`). **Decisions → doc** (DECISIONS.md) for now — human-readable, in repo, no new schema; switch to a `jarvis_decisions` table later if you want query/filter. So: short-term and prefs in DB; decisions in doc unless you need query.

---

## What "long life" means

1. **Session survives gateway restart** — User reconnects with the same session ID; conversation (or a usable summary) is still there. Requires **server-side session state** (gateway or DB stores messages/summary keyed by session_id).
2. **Context survives context limits** — When the thread gets long, we don't lose the past: **summarize** older turns into a "context summary" and keep recent turns in full, or cap full history and rely on long-term memory for the rest.
3. **Cross-session recall** — What we decided, what the user prefers, and key facts persist in **long-term memory** so a new session (or a new day) can still use them.

---

## Short-term memory (session-scoped)

**Purpose:** Current conversation, current task, recent turns — enough to keep the thread coherent and act on "what we're doing right now."

| What | Where it lives today | Long-life improvement |
|------|----------------------|------------------------|
| **Session ID** | UI: localStorage (`jarvis-ui-session`). Sent with every request. | Stable; keep. Optional: user-visible session names (e.g. "work", "olive") stored in UI or server. |
| **Current thread (messages)** | UI: React state (lost on refresh). Gateway: may or may not store; "reattach is gateway-side." | **Persist server-side:** Gateway or Supabase stores messages (or last N + summary) keyed by session_id. On reconnect, UI or gateway restores so the thread is still there after refresh/restart. |
| **Current task / focus** | Implicit in conversation (e.g. "we're doing deep work on olive"). | Optional: store "focus" (product, phase) in session state so after reconnect JARVIS knows "we were in phase 2 of olive deep work." |
| **Recent N turns** | In full in UI state; sent to gateway per request. | If gateway doesn't persist, UI could persist last N messages to **localStorage** or **IndexedDB** per session_id so refresh doesn't lose the thread (degraded long life: survives refresh, not device switch). |

**Recommendation for short-term long life:**

- **Option A (gateway):** Gateway persists session state (e.g. last 50 messages or 100k chars per session_id) in memory, file, or DB. Client sends session_id; gateway returns or merges history when needed. Reattach = same session_id, gateway restores.
- **Option B (Supabase / Edge):** If chat goes through Edge or an API that can hit DB, store messages in a **conversations** or **session_messages** table (session_id, role, content, created_at). On load, client fetches history for session_id so UI shows full thread after refresh.
- **Option C (UI-only):** Persist messages to **localStorage** or **IndexedDB** keyed by session_id (e.g. `jarvis-messages-{sessionId}`). Survives refresh on same device; doesn't survive gateway restart if gateway had no state (but thread is still in UI storage).

Use **Option A or B** for true "session survives gateway restart"; use **Option C** as a low-effort improvement so at least refresh doesn't wipe the thread.

---

## Long-term memory (cross-session)

**Purpose:** Durable facts — decisions, preferences, product capabilities, and optional outcome log — so JARVIS remembers across sessions and days.

| What | Where it lives today | Notes |
|------|----------------------|--------|
| **Decisions** | **DECISIONS.md** in repo (or product repo). JARVIS appends on "remember this decision"; reads via repo_search / repo_file. | Already specified in [DECISIONS_MEMORY.md](./DECISIONS_MEMORY.md). Durable, file-based, searchable once indexed. |
| **Product capabilities** | **Repo index** (Supabase chunks + embeddings). Optional: CAPABILITIES.md or Echeo scan per repo. | Code-grounded "what products can do." Long-term = index stays updated; see [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md). |
| **User/org preferences** | Not yet. | Add **prefs** (e.g. "use Vercel for frontend," "Hot Rod for security"). Store in `~/.jarvis/prefs.json` (file) or Supabase **jarvis_prefs** (key, value, scope). JARVIS reads at start of session or when relevant. |
| **Config / product list** | **products.json**, **repos.json** in repo. | Already long-term; JARVIS reads when needed. |
| **Outcome log (optional)** | Not yet. | "Task X: we did Y, result Z" — e.g. table or log file for "last time we did X" to improve next time. Lower priority. |

**Recommendation for long-term:**

- **Decisions:** **Doc** (DECISIONS.md) — human-readable, in repo, versioned. JARVIS appends and reads (already in AGENTS + DECISIONS_MEMORY). Optional later: **DB table** `jarvis_decisions` (session_id, product, decision_text, created_at) if you want queryable/filterable decisions.
- **Preferences:** **DB table** `jarvis_prefs` (key, value, scope) in Supabase — same prefs across devices, ready for future auth. Alternative: file `~/.jarvis/prefs.json` if single-machine and zero DB is preferred.
- **Capabilities:** Keep repo index + optional CAPABILITIES.md; no change.
- **Outcome log:** Optional later; **doc** (append to DECISIONS or LOG.md) or **DB**; same tradeoff as decisions.

---

## Context limits and summarization

**Problem:** Long threads blow the context window; we either truncate (lose history) or summarize.

**Options:**

1. **Sliding window** — Send only last N messages (e.g. 20) to the model. Rest is "forgotten" unless in long-term (decisions, prefs).
2. **Summary + recent** — Periodically (e.g. every 10 turns) or when thread is long, JARVIS (or a background step) produces a **short summary** of the conversation so far ("We're doing deep work on olive; decided to use Vercel; currently on phase 2."). Send **summary + last N messages** to the model. Summary can be stored in session state or long-term so it survives.
3. **Checkpoint to long-term** — At end of session or at "checkpoint" moments, append to DECISIONS.md or a **session_summaries** store: "Session X (date): we did Y; decisions: Z." So long-term memory grows and we don't rely only on in-session history.

**Recommendation:** Start with **sliding window** (e.g. last 30 messages) if the gateway doesn't support summarization. Add **summary + recent** once you have server-side session state (so the summary is stored and reused). Add **checkpoint to long-term** when you want "JARVIS remembers what we did last week" without full thread.

---

## Concrete setup (what to implement)

### Phase 1 — Minimal long life (no new backend)

- **Short-term:** UI persists **messages** to **localStorage** (or IndexedDB) keyed by session_id. On load, restore messages for current session so **refresh doesn't wipe the thread**. Session ID already stable in localStorage.
- **Long-term:** Keep **DECISIONS.md** (doc). Optionally add **prefs**: file `~/.jarvis/prefs.json` or Supabase **jarvis_prefs** table; document "always X" → write prefs, JARVIS reads when relevant.
- **Context:** Gateway or UI sends **last N messages** (e.g. 25) per request so we don't blow context. Older turns are "forgotten" unless summarized into long-term.

### Phase 2 — Session survives gateway restart (DB)

- **Short-term:** **DB table** in Supabase: e.g. **session_messages** (session_id, role, content, created_at) and optionally **session_summaries** (session_id, summary_text, updated_at). Gateway or Edge reads/writes; client fetches history for session_id on load. Reattach = same session_id → state restored.
- **Long-term:** **jarvis_prefs** table (key, value, scope) in Supabase for preferences. Decisions stay in **DECISIONS.md** (doc) unless you add **jarvis_decisions** table for queryable decisions.

### Phase 3 — Summarization and checkpoint

- **Summary + recent:** When thread length > threshold, compute a **conversation summary** (e.g. via a tool or background job) and store it with the session. Send summary + last N messages to the model.
- **Checkpoint to long-term:** At "checkpoint" (e.g. end of deep-work phase, or user says "save progress"), append a short line to DECISIONS.md or a **session_log**: "2025-02-01 session: deep work olive phase 2; decided Vercel for frontend." So long-term memory grows over time.

---

## Summary table

| Memory type | Purpose | Doc or DB | Where | Long-life tip |
|-------------|---------|-----------|--------|----------------|
| **Session ID** | Stable identity for this conversation | — | UI localStorage; sent to gateway | Keep; optional named sessions. |
| **Current thread** | Messages in this session | **DB** | Supabase `session_messages` (session_id, role, content, created_at) | Persist so refresh/restart doesn't wipe. |
| **Conversation summary** | Compress old turns so we don't blow context | **DB** | Supabase `session_summaries` (session_id, summary_text, updated_at) | Compute when long; store with session; send summary + recent to model. |
| **Decisions** | "We decided X" | **Doc** (or DB later) | DECISIONS.md (repo); optional `jarvis_decisions` table | Doc = human-readable, in repo; DB = queryable. |
| **Preferences** | "Always use X" | **DB** (or doc) | Supabase `jarvis_prefs` (key, value, scope); or ~/.jarvis/prefs.json | DB = multi-device, auth-ready; file = single-machine. |
| **Product capabilities** | What code can do | — | Repo index (Supabase), optional CAPABILITIES.md | Keep index fresh. |
| **Checkpoint log (optional)** | "Session X: we did Y" | **Doc** or DB | Append to DECISIONS or `jarvis_checkpoints` | Append at checkpoints so long-term grows. |

**TL;DR:** Short-term = session-scoped thread (persist in gateway/DB or UI storage so it survives refresh/restart). Long-term = DECISIONS.md + prefs + repo index (and optional checkpoint log). For long life: (1) persist session state server-side or in UI storage, (2) keep long-term stores (decisions, prefs), (3) add summarization or sliding window so context limit doesn't kill history.

---

## Preferences (long-term, optional)

**Where:** **DB table** `jarvis_prefs` (e.g. `key`, `value`, `scope`) in Supabase — recommended so prefs work across devices and are ready for future auth. Alternative: **doc** `~/.jarvis/prefs.json` for single-machine, zero-DB setup.

**When JARVIS writes:** User says "always use X," "prefer Y," "from now on use Z." JARVIS writes to prefs (skill or Edge RPC that upserts to `jarvis_prefs`, or exec that writes prefs.json).

**When JARVIS reads:** At session start (if gateway/bootstrap can load prefs) or when relevant (e.g. "deploy frontend" → read prefs for `deploy_frontend`). If no prefs exist, JARVIS behaves as today (no preference).

**Instructions for JARVIS:** When the user says "always use X" or "prefer Y for Z," store it in prefs (DB or file). When making a choice that might have a stored preference, read prefs and prefer that value. See **docs/JARVIS_MEMORY.md** for doc vs DB and full memory setup.
