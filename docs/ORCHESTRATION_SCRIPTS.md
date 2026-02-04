# Orchestration Scripts & Background Agents

Index of scripts and patterns for **orchestrating JARVIS's team** and running background or scheduled work.

---

## Pipeline scripts (run in sequence)

| Script | What it does | When to run |
|--------|--------------|-------------|
| **run-team-pipeline.js** | Safety net → BEAST MODE quality → Code Roach health → Echeo bounties. Skips missing CLIs. | On-demand or scheduled (cron). Use `--webhook` to post summary to Discord. |
| **run-team-quality.js** | BEAST MODE quality only for focus repo (products.json first or `JARVIS_FOCUS_REPO` or arg). | Before ship, or after implement. |
| **heartbeat-brief.js** | Safety net + optional open PRs/issues count; posts short brief to webhook. | Scheduled (cron) or on-demand. See jarvis/HEARTBEAT.md. |

**Examples:**

```bash
# Full team pipeline (safety net + quality + health + bounties)
node scripts/run-team-pipeline.js

# Quality only, no safety net
node scripts/run-team-pipeline.js --no-safety-net --quality-only

# Pipeline and post summary to Discord
node scripts/run-team-pipeline.js --webhook

# BEAST MODE quality for first product in products.json
node scripts/run-team-quality.js

# BEAST MODE quality for a specific repo
node scripts/run-team-quality.js BEAST-MODE
JARVIS_FOCUS_REPO=olive node scripts/run-team-quality.js
```

---

## Background / scheduled agents

| Script or agent | What it does | How to run |
|-----------------|--------------|------------|
| **watchdog-jarvis-local.js** | Checks Ollama + gateway; restarts gateway if down. | `node scripts/watchdog-jarvis-local.js --loop` (every 5 min) or once. Schedule with add-watchdog-cron.sh / add-watchdog-schedule.ps1. |
| **jarvis-autonomous-build.js** | Pull latest JARVIS, validate skills, run optimize-jarvis, build in-repo subprojects. | On-demand or scheduled (e.g. after push). run-autonomous-build.bat; add-autonomous-build-schedule.ps1. |
| **index-repos.js** | Clone/pull repos from repos.json, chunk, embed, upsert to Supabase. | On-demand or scheduled (e.g. nightly). run-repo-index.bat; add-repo-index-schedule.ps1. |
| **heartbeat-brief.js** | Proactive brief (safety net + optional GitHub stats) → webhook. | Cron or Task Scheduler. |
| **run-team-pipeline.js** | Team pipeline (safety net, quality, health, bounties) → optional webhook. | Cron or on-demand. |

---

## JARVIS-as-conductor (in-chat)

When you talk to JARVIS (Discord, UI, CLI), he **orchestrates** by invoking:

- **BEAST MODE** — exec or workflow_dispatch (quality before ship).
- **Code Roach** — exec or workflow_dispatch (PR/health).
- **Echeo** — exec (bounties, "what should I work on?").
- **sessions_spawn** — background subagent for long implementation.
- **workflow_dispatch** — trigger deploy/quality workflows in any repo.

So **orchestration scripts** above are for **scheduled or one-shot** runs; **in-chat** JARVIS uses the same agents via tools. See **docs/JARVIS_AGENT_ORCHESTRATION.md** and **docs/JARVIS_TEAM_DEPLOY_AND_RUN.md**.

---

## Scheduling (cron / Task Scheduler)

| Schedule | Script | Purpose |
|----------|--------|---------|
| Every 5 min | watchdog-jarvis-local.js --loop | Keep gateway up. |
| Daily (e.g. 3 AM) | index-repos.js | Refresh repo index for repo-knowledge. |
| Daily (e.g. 4 AM) | jarvis-autonomous-build.js | Keep JARVIS repo built. |
| Daily or 2x/day | heartbeat-brief.js | Proactive brief to Discord. |
| On-demand or daily | run-team-pipeline.js | Full team run; optional --webhook. |

**Add schedules:** See scripts/add-watchdog-cron.sh, add-repo-index-schedule.ps1, add-autonomous-build-schedule.ps1, add-safety-net-schedule.ps1.

---

## Env and webhooks

- **JARVIS_FOCUS_REPO** — Focus repo for quality (e.g. BEAST-MODE, olive). Overrides first product in products.json when set.
- **JARVIS_ALERT_WEBHOOK_URL** / **DISCORD_WEBHOOK_URL** — Webhook for heartbeat-brief and run-team-pipeline --webhook.
- **GITHUB_TOKEN** — For index-repos, workflow_dispatch, heartbeat open PRs/issues (in ~/.clawdbot/.env or Vault).

---

## References

- **Build flow:** [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md)
- **Team deploy/run:** [JARVIS_TEAM_DEPLOY_AND_RUN.md](./JARVIS_TEAM_DEPLOY_AND_RUN.md)
- **Heartbeat:** [jarvis/HEARTBEAT.md](../jarvis/HEARTBEAT.md)
- **RUNBOOK:** [RUNBOOK.md](../RUNBOOK.md) — Key paths, gateway, logs, troubleshooting.
