-- JARVIS long-life memory: session thread, summaries, preferences.
-- See docs/JARVIS_MEMORY.md and docs/JARVIS_COFOUNDER.md.

-- Session messages: current conversation thread per session_id.
-- Gateway or Edge reads/writes; UI can fetch history on load so refresh/restart doesn't wipe thread.
CREATE TABLE IF NOT EXISTS session_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role       text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_created_at ON session_messages (session_id, created_at);

COMMENT ON TABLE session_messages IS 'JARVIS conversation thread per session; persist so session survives gateway restart.';

-- Optional: compressed summary of older turns for long threads (summary + recent N messages to model).
CREATE TABLE IF NOT EXISTS session_summaries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   text NOT NULL UNIQUE,
  summary_text text NOT NULL DEFAULT '',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_summaries_session_id ON session_summaries (session_id);

COMMENT ON TABLE session_summaries IS 'JARVIS conversation summary per session; used when thread is long (summary + last N messages).';

-- Long-term preferences: "always use X", "prefer Y for Z". Same prefs across devices; auth-ready.
CREATE TABLE IF NOT EXISTS jarvis_prefs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL,
  value      text NOT NULL DEFAULT '',
  scope      text NOT NULL DEFAULT 'default',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, scope)
);

CREATE INDEX IF NOT EXISTS idx_jarvis_prefs_key_scope ON jarvis_prefs (key, scope);

COMMENT ON TABLE jarvis_prefs IS 'JARVIS long-term preferences; user says "always use X" → stored here, read when relevant.';

-- RLS: allow anon/service role to read/write for now; tighten with auth later.
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for session_messages" ON session_messages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for session_summaries" ON session_summaries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for jarvis_prefs" ON jarvis_prefs
  FOR ALL USING (true) WITH CHECK (true);
