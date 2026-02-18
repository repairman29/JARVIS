-- JARVIS audit log for elevated actions (exec, deploy, workflow_dispatch, etc.).
-- See docs/JARVIS_AUDIT_LOG.md.

CREATE TABLE IF NOT EXISTS jarvis_audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  action     text NOT NULL,
  details    jsonb,
  session_id text,
  channel    text,
  actor      text
);

CREATE INDEX IF NOT EXISTS idx_jarvis_audit_log_created_at ON jarvis_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jarvis_audit_log_action ON jarvis_audit_log (action);

COMMENT ON TABLE jarvis_audit_log IS 'JARVIS audit trail for elevated/destructive actions; who ran what when.';

ALTER TABLE jarvis_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for jarvis_audit_log" ON jarvis_audit_log
  FOR ALL USING (true) WITH CHECK (true);
