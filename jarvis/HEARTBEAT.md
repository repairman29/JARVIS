# Heartbeat — JARVIS ROG Ed.

Short checklist for periodic heartbeat runs. Keep this file tiny to avoid token burn.
Heartbeat should **drive production**: check queues, launch subagents, and advance shipping.

**Automated brief:** Run `node scripts/heartbeat-brief.js` (or schedule via cron). Runs safety net, builds a short brief, and posts to `JARVIS_ALERT_WEBHOOK_URL` or `DISCORD_WEBHOOK_URL`. Use `--no-webhook` to run checks only; `--json` for JSON output.

**Autonomous agent heartbeat:** Run `node scripts/jarvis-autonomous-heartbeat.js` (or schedule via cron). Calls the gateway so JARVIS (farm + tools) runs this checklist and replies with HEARTBEAT_OK or HEARTBEAT_REPORT. See **docs/JARVIS_AUTONOMOUS_AGENT.md**.

**Plan and execute (no human in loop):** Run `node scripts/jarvis-autonomous-plan-execute.js`. JARVIS creates a plan and runs it with tools; when done replies with AUTONOMOUS_DONE and a summary. Schedule daily (e.g. 8 AM) or on-demand.

## Today (Production Mode)
- [ ] Check if user needs anything (if no action items, continue checklist)
- [ ] **Product order:** Use **products.json** (master list, top-down). Focus repo = **first active product** in the list; then work down.
- [ ] **When done with current focus (e.g. BEAST MODE):** Run `node scripts/set-focus-repo.js <next-repo>` (e.g. `olive`, `JARVIS`) so the next repo becomes first in products.json. Plan-execute, heartbeat, and "work top down" will then use that repo.
- [ ] Scan for pending tasks: focus-repo issues/PRs, recent failures, blocked threads
- [ ] If GitHub is available: run `github_status`; if OK, pick 1 BEAST-MODE action (issue, PR, workflow_dispatch)
- [ ] If background work is needed: spawn subagents with clear deliverables and ETA
- [ ] Note any follow-ups from recent chats (Discord, CLI, repo ops)

## Optional
- [ ] Summarize system health if performance-monitor is enabled
- [ ] Suggest one quick win (e.g. "Run CLI test", "Trigger workflow", "Draft PRD")

## Response rule
- If **no actionable items**: reply **HEARTBEAT_OK**
- Otherwise: reply **HEARTBEAT_REPORT** with 3–5 bullets and a next action
