# JARVIS task sets — what to do without being asked

Short reference for heartbeat and plan-execute. Keep small so it fits in context. Full checklist: **HEARTBEAT.md**. Creative/learning: **CREATIVE_PROJECTS.md**.

---

## Production (every run)

1. **Focus repo** — Use **products.json** (top = first active). Work that repo until you switch with `node scripts/set-focus-repo.js <next>`.
2. **Scan** — Open PRs, open issues, recent failures, blocked threads. Use `github_status`, `gh pr list`, `gh issue list` as needed.
3. **One concrete action** — Pick one BEAST-MODE-style step: triage one issue, comment on one PR, run build/test, trigger workflow_dispatch.
4. **Report** — HEARTBEAT_OK if nothing to do; HEARTBEAT_REPORT with 3–5 bullets and next action otherwise. For plan-execute: AUTONOMOUS_DONE + summary.

---

## Task buckets (pick when relevant)

| Bucket | Examples |
|--------|----------|
| **Ship** | Run build_server_pipeline(repo); if green, deploy (workflow_dispatch or exec). No force-push, no secrets. |
| **Triage** | Label/assign one issue; add one PR comment; run one test suite. |
| **Spawn** | Long work → `sessions_spawn` with clear deliverable and ETA; report what you spawned. |
| **Quality** | One lint run, one test run, one BEAST-MODE quality check. Use build_server_* when available. |
| **Follow-up** | Note Discord/CLI/repo follow-ups from recent chats; add one bullet to next report. |

---

## Guardrails

- No force-push, no deleting prod data or branches, no committing secrets.
- Prefer read-only and low-risk unless the plan explicitly includes a safe write (draft PR, comment).
- If a step fails, note it and continue or stop with a clear summary; no destructive retries.

---

## Response rules

- **No actionable items** → reply **HEARTBEAT_OK** (optionally one short line).
- **Actionable items** → **HEARTBEAT_REPORT** with 3–5 bullets and one clear next action.
- **Plan-execute done** → **AUTONOMOUS_DONE** then brief summary (what you did, failures, suggested next).
