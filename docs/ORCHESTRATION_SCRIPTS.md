# Orchestration Scripts & Background Agents

Index of scripts and patterns for **orchestrating JARVIS's team** and running background or scheduled work.

---

## Pipeline scripts (run in sequence)

| Script | What it does | When to run |
|--------|--------------|-------------|
| **ensure-team-ready.js** | Bootstrap: check farm + gateway, run team-status.js. Run once per session so team is ready under JARVIS. | On login or before using JARVIS + team. See **docs/JARVIS_OPTIMAL_TEAM_SETUP.md**. |
| **team-status.js** | Check which team CLIs are on PATH; write `~/.jarvis/team-status.json`. | After installing CLIs or editing config/team-agents.json. |
| **run-team-pipeline.js** | Safety net → BEAST MODE quality → Code Roach health → Echeo bounties. Skips missing CLIs. | On-demand or scheduled (cron). Use `--webhook` to post summary to Discord. |
| **run-team-quality.js** | BEAST MODE quality only for focus repo (products.json first or `JARVIS_FOCUS_REPO` or arg). | Before ship, or after implement. |
| **run-beast-mode-tick.js** | JARVIS drives BEAST MODE: run one heartbeat tick (task gen, reset stale, QA/Integration/etc). Set `BEAST_MODE_SCRIPTS` if BEAST-MODE is not a sibling repo. | Cron or agent loop (e.g. every 2 min) so BEAST MODE keeps running when Mac is on; when Mac is off, use BEAST MODE cloud runner on Railway. See BEAST-MODE/docs/JARVIS_DRIVES_BEAST_MODE.md. |
| **set-focus-repo.js** | Set JARVIS focus repo: move a product to the top of products.json so plan-execute, heartbeat, run-team-quality use it. No args = show current focus. | When done with current focus (e.g. BEAST MODE): run `node scripts/set-focus-repo.js <repo>` (e.g. olive, JARVIS). See RUNBOOK § "When done with BEAST MODE". |
| **add-repo-and-focus.js** | Add a repo to repos.json (via `gh repo view` if needed), products.json, index it (index-repos --repo), and set as focus. Use so JARVIS can work on any repo when you ask. | "Work on X", "focus on X" when X is not yet in products.json. Run `node scripts/add-repo-and-focus.js <repo> [description]` or `--no-index` to skip indexing. |
| **create-new-repo.js** | Create GitHub repo (repairman29/name) with `gh repo create`, then run add-repo-and-focus. | "Create a new repo for product Y", "new product Z". Run `node scripts/create-new-repo.js <name> [description] [--private]`. |
| **heartbeat-brief.js** | Safety net + optional open PRs/issues count; posts short brief to webhook. | Scheduled (cron) or on-demand. See jarvis/HEARTBEAT.md. |
| **prune-jarvis-memory.js** | Cap session_messages per session (keep last N), remove stale session_summaries. | On-demand or weekly cron. See docs/JARVIS_MEMORY_CONSOLIDATION.md. Use `--dry-run` first. |
| **archive-jarvis-sessions.js** | Turn conversations into embeddings + structured versions (topics, decisions, entities) for bot memory search. | On-demand or after prune (run archivist before prune). See docs/JARVIS_ARCHIVIST.md. Needs Ollama nomic-embed-text. |

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

# Switch focus when done with BEAST MODE (next repo becomes first in products.json)
node scripts/set-focus-repo.js olive
node scripts/set-focus-repo.js          # show current focus

# BEAST MODE quality for a specific repo
node scripts/run-team-quality.js BEAST-MODE
JARVIS_FOCUS_REPO=olive node scripts/run-team-quality.js

# Work on any repo (add to repos + products, index, set focus)
node scripts/add-repo-and-focus.js acme "Acme app"
node scripts/add-repo-and-focus.js some-repo --no-index

# Create a new repo and add it to JARVIS
node scripts/create-new-repo.js my-new-product "Net new product"
node scripts/create-new-repo.js AcmeCorp "Acme app" --private
```

---

## Background / scheduled agents

| Script or agent | What it does | How to run |
|-----------------|--------------|------------|
| **watchdog-jarvis-local.js** | Checks Ollama + gateway; restarts gateway if down. | `node scripts/watchdog-jarvis-local.js --loop` (every 5 min) or once. Schedule with add-watchdog-cron.sh / add-watchdog-schedule.ps1. |
| **jarvis-autonomous-build.js** | Pull latest JARVIS, validate skills, run optimize-jarvis, build in-repo subprojects. | On-demand or scheduled (e.g. after push). run-autonomous-build.bat; add-autonomous-build-schedule.ps1. |
| **index-repos.js** | Clone/pull repos from repos.json, chunk, embed, upsert to Supabase. | On-demand or scheduled (e.g. nightly). run-repo-index.bat; add-repo-index-schedule.ps1. |
| **heartbeat-brief.js** | Proactive brief (safety net + optional GitHub stats) → webhook. | Cron or Task Scheduler. |
| **jarvis-autonomous-heartbeat.js** | Full agent heartbeat: gateway + farm/LLM + tools → HEARTBEAT_OK or HEARTBEAT_REPORT → webhook. | Cron or on-demand. See **docs/JARVIS_AUTONOMOUS_AGENT.md**. |
| **jarvis-autonomous-plan-execute.js** | JARVIS writes a plan and executes it (tools) with no human in the loop; reports AUTONOMOUS_DONE + summary. | Cron (e.g. daily). See **docs/JARVIS_AUTONOMOUS_AGENT.md** §1.5. |
| **run-team-pipeline.js** | Team pipeline (safety net, quality, health, bounties) → optional webhook. | Cron or on-demand. |
| **run-autonomous-release.js** | Build (build server pipeline) → quality (run-team-quality) → deploy (JARVIS_DEPLOY_CMD). Reads version from product repo; optional `--tag` to create git tag. No human in the loop. | Cron or GitHub Action. See **docs/AUTONOMOUS_RELEASES.md**. |
| **add-overnight-autonomous-cron.js** | Add cron for overnight: plan-execute (e.g. 2 AM), heartbeat (e.g. every 6h), optional run-autonomous-release. `--add` to append to crontab; `--plan-time 3`, `--release`. | One-time setup. See **docs/JARVIS_OVERNIGHT_BUILDS.md**. |

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
| Every 6h or daily | jarvis-autonomous-heartbeat.js | Autonomous agent heartbeat (farm + tools) → webhook. See JARVIS_AUTONOMOUS_AGENT.md. |
| Daily (e.g. 8 AM) | jarvis-autonomous-plan-execute.js | Plan + execute (JARVIS decides and runs steps); no human in loop. |
| On-demand or daily | run-team-pipeline.js | Full team run; optional --webhook. |
| Weekly (e.g. Sun 2 AM) | archive-jarvis-sessions.js then prune-jarvis-memory.js | Archive first (embeddings + structured versions for bots), then prune. Run prune `--dry-run` first. |

**Add schedules:** See scripts/add-watchdog-cron.sh, **add-prune-cron.sh** (weekly memory prune), **add-plan-execute-cron.js** (daily plan-execute; run for crontab line or `--add` to append), add-repo-index-schedule.ps1, add-autonomous-build-schedule.ps1, add-safety-net-schedule.ps1.

---

## Proactive extensions (scheduled brief, failure alerts)

| Extension | How | Env / setup |
|-----------|-----|-------------|
| **Scheduled morning brief** | Run **heartbeat-brief.js** on a schedule (cron/Task Scheduler). It runs safety net, optional PR/issue counts, and posts a short brief to Discord. | Set **JARVIS_ALERT_WEBHOOK_URL** or **DISCORD_WEBHOOK_URL** in `~/.clawdbot/.env`. Example cron: `0 7 * * * cd /path/to/CLAWDBOT && node scripts/heartbeat-brief.js`. |
| **Failure alert on pipeline run** | Run **run-team-pipeline.js --webhook** on a schedule or from CI. When the pipeline runs, the summary (including any failures) is posted to the webhook. For **alert-only-on-failure**, run the pipeline and on non-zero exit post a short message: `node scripts/run-team-pipeline.js --webhook || curl -s -X POST "$JARVIS_ALERT_WEBHOOK_URL" -H "Content-Type: application/json" -d '{"content":"⚠️ Team pipeline failed"}'`. | Same webhook env. Optional: GitHub Actions job that runs the pipeline and posts on failure. |
| **CI/build break alert** | In GitHub Actions (or other CI), add a step that on failure calls your webhook (e.g. `curl -X POST $DISCORD_WEBHOOK_URL -d '{"content":"Build failed: ${{ github.repository }} ${{ github.run_id }}"}'`). Or use **run-team-pipeline.js --webhook** in a scheduled workflow so quality/safety-net failures are reported. | Webhook URL in repo secrets. |
| **Calendar/email nudge (future)** | When Edge has access to calendar or email (e.g. Google Calendar API, Microsoft Graph, or MCP), add a scheduled job or Edge function that sends a brief nudge (e.g. "Meeting in 15 min" or "3 unread high-priority emails"). Optional: user-configurable schedule and filters. | Not implemented; document here when ready. |

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
