# JARVIS Memory — Wiring Gateway / Edge to Supabase

**Goal:** After creating the memory tables (see [JARVIS_MEMORY.md](./JARVIS_MEMORY.md)), wire the gateway or Edge function so session thread and prefs persist. Session survives refresh and gateway restart; prefs persist across devices.

---

## 1. Apply the migration

From repo root:

```bash
supabase db push
```

Or in Supabase Dashboard: SQL Editor → run the SQL from `supabase/migrations/20250201120000_jarvis_memory_tables.sql`.

Tables created: `session_messages`, `session_summaries`, `jarvis_prefs`. See the migration file for schema and RLS.

---

## 2. Session messages (short-term thread)

### Schema (reference)

- **session_messages**: `id`, `session_id`, `role` ('user' | 'assistant' | 'system'), `content`, `created_at`

### Behavior to implement

| When | What to do |
|------|------------|
| **Client loads session** | If UI (or Edge) has a `session_id`, fetch last N rows from `session_messages` where `session_id = ?` order by `created_at asc`. Use these as initial `messages` so the thread is restored after refresh/restart. |
| **After each successful turn** | Append the user message(s) and the assistant reply to `session_messages` (same `session_id`). Optionally cap total per session (e.g. keep last 100) and/or write a summary to `session_summaries` when thread is long. |

### Example: fetch history (pseudo)

```sql
SELECT role, content, created_at
FROM session_messages
WHERE session_id = $1
ORDER BY created_at ASC
LIMIT 50;
```

### Example: append turn (pseudo)

```sql
INSERT INTO session_messages (session_id, role, content)
VALUES ($1, 'user', $2), ($1, 'assistant', $3);
```

---

## 3. Where to implement

| Place | Notes |
|-------|--------|
| **Supabase Edge (jarvis)** | Has access to Supabase via `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. When request has `session_id` and only `message`, load last N from `session_messages` and prepend to form `messages`; after gateway response, insert user + assistant into `session_messages`. Use `@supabase/supabase-js` (Deno: import from `https://esm.sh/@supabase/supabase-js@2`). |
| **JARVIS UI** | Option A: UI continues to send full `messages` each time; only Edge (or gateway) persists. Option B: UI calls a small API (e.g. `GET /api/session?sessionId=...`) to load history on mount, then sends only the new message; server merges and persists. |
| **Gateway (local)** | If you run the gateway and want persistence there, add a small module that reads/writes the same tables (e.g. via Supabase REST or Postgres client). Same contract: load by session_id, append after each turn. |

---

## 4. Preferences (long-term)

- **jarvis_prefs**: `key`, `value`, `scope` (e.g. `default` or product name).
- **Write:** When user says "always use X" or "prefer Y for Z", upsert: `INSERT INTO jarvis_prefs (key, value, scope) VALUES ($1, $2, $3) ON CONFLICT (key, scope) DO UPDATE SET value = $2, updated_at = now()`.
- **Read:** At session start or when relevant (e.g. before "deploy frontend"), `SELECT key, value FROM jarvis_prefs WHERE scope = $1 OR scope = 'default'`.

JARVIS (in Cursor or via a skill) can call an Edge RPC or gateway endpoint that does prefs read/write, or you can add a small skill that uses a Supabase client. See [JARVIS_MEMORY.md](./JARVIS_MEMORY.md) for when JARVIS reads/writes prefs.

---

## 5. Checklist

- [x] Migration applied (`supabase db push` or SQL in dashboard).
- [x] Edge or gateway: on chat request with `session_id`, load last N from `session_messages` when building `messages` (if client didn’t send full history). Implemented in `supabase/functions/jarvis/index.ts` (when body has only `message`, not `messages`).
- [x] Edge or gateway: after each successful turn, insert user message(s) + assistant reply into `session_messages`. Implemented in Edge: non-stream appends user + assistant; stream appends user only (assistant content not available until client consumes stream).
- [ ] (Optional) UI: on load, fetch history for current `session_id` from your API so thread restores without full round-trip.
- [ ] (Optional) Prefs: expose read/write for `jarvis_prefs` (Edge RPC or skill) and document for JARVIS.

Once these are in place, the co-founder memory layer is live: session survives restart, and prefs persist across sessions.
