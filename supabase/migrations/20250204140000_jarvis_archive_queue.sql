-- Queue for auto-archive: sessions to be processed by archive-jarvis-sessions.js (run via cron or launchd).
-- Edge Function or client can enqueue via action=archive; archivist script consumes with --from-queue.

CREATE TABLE IF NOT EXISTS jarvis_archive_queue (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jarvis_archive_queue_pending
  ON jarvis_archive_queue (processed_at) WHERE processed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jarvis_archive_queue_session
  ON jarvis_archive_queue (session_id);

COMMENT ON TABLE jarvis_archive_queue IS 'Sessions queued for archivist; process with archive-jarvis-sessions.js --from-queue.';

-- RPC: return session_ids that need archiving (>20 messages or idle >30 min). Used by Edge Function to enqueue.
CREATE OR REPLACE FUNCTION get_sessions_to_archive(
  min_messages int DEFAULT 20,
  idle_minutes int DEFAULT 30
)
RETURNS TABLE (session_id text)
LANGUAGE sql
STABLE
AS $$
  WITH agg AS (
    SELECT sm.session_id,
           count(*) AS cnt,
           max(sm.created_at) AS last_at
    FROM session_messages sm
    GROUP BY sm.session_id
  )
  SELECT agg.session_id::text
  FROM agg
  WHERE agg.cnt >= min_messages
     OR agg.last_at < (now() - (idle_minutes || ' minutes')::interval);
$$;

COMMENT ON FUNCTION get_sessions_to_archive IS 'Sessions with >= min_messages or last message older than idle_minutes; for auto-archive queue.';

-- RPC: recent sessions with message count and last activity (for dashboard /api/sessions).
CREATE OR REPLACE FUNCTION get_recent_sessions(limit_count int DEFAULT 20)
RETURNS TABLE (session_id text, message_count bigint, last_at timestamptz)
LANGUAGE sql
STABLE
AS $$
  SELECT sm.session_id::text, count(*)::bigint, max(sm.created_at)
  FROM session_messages sm
  GROUP BY sm.session_id
  ORDER BY max(sm.created_at) DESC
  LIMIT limit_count;
$$;

COMMENT ON FUNCTION get_recent_sessions IS 'Recent sessions with message count and last_at; for dashboard.';

ALTER TABLE jarvis_archive_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for jarvis_archive_queue" ON jarvis_archive_queue
  FOR ALL USING (true) WITH CHECK (true);
