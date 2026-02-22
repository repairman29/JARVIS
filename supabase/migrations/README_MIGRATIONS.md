# Supabase migrations

If `supabase db push` fails (e.g. "Remote migration versions not found in local"), you can apply migrations manually:

1. **Supabase Dashboard** → **SQL Editor** → New query.
2. Copy the contents of the migration file you need and run it.

**JARVIS archivist (tables + helper functions):**  
Copy from `20250204120000_jarvis_archivist.sql`. This creates:

- `jarvis_archive` — structured session versions (topics, decisions, entities).
- `jarvis_memory_chunks` — embedded chunks for semantic search.
- `match_jarvis_memory_chunks(query_embedding, match_count, session_filter)` — RPC for vector search.
- `get_jarvis_archive_recent(limit_count, session_filter)` — RPC for recent archive rows.

**JARVIS archive queue + dashboard helpers:**  
Copy from `20250204140000_jarvis_archive_queue.sql`. This creates:

- `jarvis_archive_queue` — sessions queued for archivist (process with `archive-jarvis-sessions.js --from-queue`).
- `get_sessions_to_archive(min_messages, idle_minutes)` — RPC for auto-archive eligibility.
- `get_recent_sessions(limit_count)` — RPC for dashboard Active sessions.

**Repair and push (optional):** If you want to sync migration history instead of running SQL by hand:

```bash
# Mark remote-only migrations as reverted so local can push (only if you're sure)
supabase migration repair --status reverted 20250202120000 20250203130000 20250203140000
supabase db push
```

Use `supabase db pull` if you prefer to update local migrations to match the remote.
