# Audit log for elevated actions

Security and compliance: record who ran what when for exec, deploy, workflow_dispatch, and other elevated or destructive actions.

---

## Why

- **Accountability** — "Who ran what when" for exec, deploy, workflow_dispatch, or destructive commands.
- **Compliance** — Optional audit trail for production or team use.

---

## What to log

Log every elevated or high-impact action with:

- **Timestamp** (ISO)
- **Session/channel** (e.g. Discord channel ID, session_id, or "cursor")
- **Command or action** (e.g. `exec`, `github_workflow_dispatch`, `fly apps destroy`)
- **Details** (e.g. command line, workflow name, repo)
- **Actor** (if available: Discord user ID, Cursor user, or "gateway")

---

## How to enable

### Option 1: Gateway or middleware

If your gateway (OpenClaw/CLAWDBOT) supports an **audit log** or **elevated action log**:

- Enable it in gateway config (e.g. `clawdbot.json` or Railway config).
- Configure a sink: file path, or Supabase table (e.g. `jarvis_audit_log`), or webhook.

### Option 2: Supabase table

Create a table and have the gateway (or an Edge function) write to it:

```sql
CREATE TABLE IF NOT EXISTS jarvis_audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  action     text NOT NULL,
  details    jsonb,
  session_id text,
  channel    text,
  actor      text
);
```

Then in gateway config or code, on every exec / workflow_dispatch / destructive action, insert a row.

**Edge function:** The JARVIS Edge function accepts `POST` with `action: "audit_log"` and writes to `jarvis_audit_log`. Body: `event_action` (required, e.g. `"exec"`, `"workflow_dispatch"`), optional `details` (object), `session_id`, `channel`, `actor`. Apply the migration first: `supabase db push` or run the SQL in the Supabase dashboard.

**Script:** From repo root, **`node scripts/audit-log.js <event_action> [details] [--channel CH] [--session ID] [--actor WHO]`** POSTs to the Edge. Set `JARVIS_EDGE_URL` (or `NEXT_PUBLIC_JARVIS_EDGE_URL`) and optional `JARVIS_AUTH_TOKEN` in `~/.clawdbot/.env`. Example: `node scripts/audit-log.js exec "npm run build" --channel cron --actor deploy`. See RUNBOOK § Supabase.

### Option 3: File log

Gateway or a wrapper script can append to a log file (e.g. `~/.jarvis/audit.log`) with one line per action. Rotate and secure the file as needed.

---

## Approval for high-risk actions

JARVIS agent instructions already say: **confirm with the user** before destructive actions (e.g. `fly apps destroy`, `railway delete`). Optional: add a gateway-level "require approval" flag for a list of high-risk commands so the gateway refuses until an approval token or second confirmation is sent.

---

## Agentic security (runbook)

For permission scoping (elevated vs normal, allowFrom), audit trail usage, and mitigations for **indirect prompt injection** and **memory poisoning**, see **[RUNBOOK.md](../RUNBOOK.md) § Agentic security**. Summary: scope elevated access per channel; log every exec/workflow_dispatch; use explicit context declarations and multi-source verification; audit memory and audit log periodically.

---

## References

- **Elevated access:** [RUNBOOK.md](../RUNBOOK.md) — enable restart, allowFrom.discord.
- **Agentic security (full):** [RUNBOOK.md](../RUNBOOK.md) § Agentic security — permissions, audit, prompt-injection and memory-poisoning mitigations.
- **Agent rules:** [jarvis/AGENTS.md](../jarvis/AGENTS.md) — confirm before destructive ops.
