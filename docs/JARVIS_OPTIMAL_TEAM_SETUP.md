# Optimal Setup: Team of AI Agents Under JARVIS Command

**Goal:** One orchestrated setup so a **team of AI agents** runs under JARVIS: defined roster, clear invocation rules, status visibility, and one-command bootstrap.

---

## 1. Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │  JARVIS (conductor)                                      │
                    │  Gateway + Neural Farm (or any LLM) + tools              │
                    └─────────────────────────────────────────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ BEAST MODE      │           │ Code Roach      │           │ Echeo           │
│ (quality)       │           │ (PR, health)    │           │ (bounties)      │
│ exec / workflow │           │ exec / workflow │           │ exec            │
└─────────────────┘           └─────────────────┘           └─────────────────┘
         │                               │                               │
         └───────────────────────────────┼───────────────────────────────┘
                                         │
                    ┌────────────────────┴────────────────────┐
                    │  sessions_spawn (subagents)             │
                    │  workflow_dispatch (deploy / CI)       │
                    └────────────────────────────────────────┘
```

- **Roster:** `config/team-agents.json` — single source of truth for who is on the team and how JARVIS invokes them.
- **Status:** `node scripts/team-status.js` — checks which CLIs are available, writes `~/.jarvis/team-status.json` so you (or a future JARVIS tool) can see “who’s ready.”
- **Pipeline:** `node scripts/run-team-pipeline.js` — runs the team in sequence (safety net → BEAST → Code Roach → Echeo); optional `--webhook`.
- **Bootstrap:** `node scripts/ensure-team-ready.js` — ensures gateway + farm + team status so the team is ready under JARVIS command.

---

## 2. One-time setup checklist

| # | Step | Command / action |
|---|------|-------------------|
| 1 | **Neural Farm** (optional but recommended) | `cd neural-farm && ./dev_farm.sh` (or `./dev_farm.sh --bg`). Ensure `.env` has `PIXEL_URL` (and `IPHONE_IP` if used). |
| 2 | **Point JARVIS at farm** | `node scripts/set-primary-neural-farm.js` (in JARVIS repo). Restart gateway after. |
| 3 | **Gateway running** | `node scripts/start-gateway-with-vault.js` (foreground) or `node scripts/start-gateway-background.js` or LaunchAgent. |
| 4 | **Secrets** | `~/.clawdbot/.env`: `GITHUB_TOKEN`, `CLAWDBOT_GATEWAY_TOKEN`. Optional: `JARVIS_ALERT_WEBHOOK_URL` or `DISCORD_WEBHOOK_URL` for pipeline webhook. |
| 5 | **Elevated exec** (so JARVIS can run CLIs) | `node scripts/enable-web-exec.js` then restart gateway. |
| 6 | **Install team CLIs** (where gateway runs) | Install **beast-mode**, **code-roach**, **echeo** so they’re on PATH. If a CLI is missing, JARVIS can still use **workflow_dispatch** for that agent if the repo has a workflow. |
| 7 | **Register agents in JARVIS** | **products.json** and **repos.json** already include BEAST-MODE, Echeo, etc. Add Code Roach (or any new agent) to **repos.json** and optionally **products.json** if you want them in “work top down.” |
| 8 | **Team roster** | Edit **config/team-agents.json** to add/remove agents or change `execExamples` / `whenInvoke`. |
| 9 | **Repo index** (optional) | `node scripts/index-repos.js` so JARVIS has repo-knowledge for agent repos. |
| 10 | **Team status** | `node scripts/team-status.js` — writes `~/.jarvis/team-status.json`. Run after installing CLIs or changing config. |

---

## 3. Daily / scheduled run (under JARVIS command)

| Schedule | Script | Purpose |
|----------|--------|---------|
| **On demand** | `node scripts/run-team-pipeline.js` | Full team run: safety net → BEAST MODE quality → Code Roach health → Echeo bounties. Add `--webhook` to post summary to Discord. |
| **On demand** | `node scripts/run-team-quality.js` | BEAST MODE quality only (focus repo from products.json or `JARVIS_FOCUS_REPO`). |
| **Cron (e.g. daily 8 AM)** | `node scripts/jarvis-autonomous-plan-execute.js` | JARVIS decides what to do and runs tools (can invoke team agents via exec). |
| **Cron (e.g. every 6h)** | `node scripts/jarvis-autonomous-heartbeat.js` | Short agent heartbeat; can report “team status” if you add a tool that reads `~/.jarvis/team-status.json`. |
| **After CLI install / config change** | `node scripts/team-status.js` | Refresh who’s available. |

---

## 4. How JARVIS invokes the team

- **In chat (Discord, Web UI, CLI):** JARVIS uses **exec** to run `beast-mode`, `code-roach`, `echeo` when you say “run quality,” “health check,” “what should I work on?” He uses **sessions_spawn** for long runs and **workflow_dispatch** for deploy or CI. Rules: **docs/JARVIS_AGENT_ORCHESTRATION.md** § When-to-invoke.
- **Via pipeline:** You (or cron) run `run-team-pipeline.js`; it runs the same agents in sequence and optionally posts to webhook. JARVIS doesn’t “see” the pipeline run unless you add a tool that reads a pipeline status file (see LONG_RUNNING_AGENTS_AND_MANAGING_A_SLEW.md).
- **Team status:** `~/.jarvis/team-status.json` lists each agent and `available: true/false`. A future JARVIS tool could read this so he can answer “who’s on the team and are they available?”

---

## 5. One-command bootstrap: ensure-team-ready.js

Run once per session (or after reboot) so gateway, farm, and team status are ready:

```bash
cd /path/to/JARVIS
node scripts/ensure-team-ready.js
```

This script:

1. Optionally checks that the Neural Farm is up (curl localhost:4000/health) and suggests starting it if not.
2. Optionally checks that the gateway is up (configurable port) and suggests starting it if not.
3. Runs **team-status.js** to refresh `~/.jarvis/team-status.json`.
4. Prints a one-line summary: “Team ready: X/Y agents available; gateway [up|down]; farm [up|down].”

So “optimal setup” = run **ensure-team-ready.js** once, then use JARVIS (chat or pipeline) to command the team.

---

## 6. Files and references

| File | Purpose |
|------|---------|
| **config/team-agents.json** | Roster: id, name, role, cli, execExamples, whenInvoke, workflowDispatch. |
| **scripts/team-status.js** | Check CLIs, write `~/.jarvis/team-status.json`. |
| **scripts/ensure-team-ready.js** | Bootstrap: farm check, gateway check, team-status. |
| **scripts/run-team-pipeline.js** | Run team in sequence; optional --webhook. |
| **scripts/run-team-quality.js** | BEAST MODE quality only. |
| **jarvis/AGENTS.md** | Agent orchestration instructions for JARVIS. |
| **docs/JARVIS_AGENT_ORCHESTRATION.md** | Build flow and when to invoke each system. |
| **docs/JARVIS_TEAM_DEPLOY_AND_RUN.md** | Deploy and run the team (CLIs, workflows, index). |
| **docs/LONG_RUNNING_AGENTS_AND_MANAGING_A_SLEW.md** | Long-running agents and managing a slew. |

---

## 7. Summary

- **Roster:** config/team-agents.json.
- **Status:** scripts/team-status.js → ~/.jarvis/team-status.json.
- **Bootstrap:** scripts/ensure-team-ready.js (farm + gateway + team status).
- **Pipeline:** scripts/run-team-pipeline.js (and run-team-quality.js).
- **Invocation:** JARVIS uses exec, sessions_spawn, and workflow_dispatch per JARVIS_AGENT_ORCHESTRATION.md.

This is the **optimal setup** for a team of AI agents under JARVIS command: one config, one status file, one bootstrap script, and the existing pipeline and agent instructions.
