# What’s Next: Improving the Whole Operation

One roadmap for **neural farm + JARVIS gateway + build server + autonomous cron + reports**. You already have: farm as brain, heartbeat every 6h, plan-execute daily 8 AM, ntfy + local reports, build server at login, Cursor task on open.

---

## Implemented (this pass)

- **Gateway at login:** LaunchAgent installed (`node scripts/install-gateway-launchagent.js`). Gateway starts at login.
- **Watchdog in cron:** Every 5 min, `watchdog-jarvis-local.js` runs and restarts the gateway if down.
- **Neural farm at login:** In **neural-farm**, run `node install-farm-launchagent.js` to install a LaunchAgent that runs `./dev_farm.sh --bg` at login. Logs: `~/.jarvis/logs/neural-farm-stdout.log`, `neural-farm-stderr.log`.
- **Retry + fallback in autonomous scripts:** Both heartbeat and plan-execute retry once after 30s on failure. If `JARVIS_AUTONOMOUS_FALLBACK_URL` is set (e.g. a backup gateway or Groq), they use it and prefix the report with `[Fallback LLM; gateway/farm was unavailable.]`.
- **One-place status:** `node scripts/operation-status.js` (or `--json`) checks farm (4000), gateway (18789), build server (18790), and last report mtime.
- **Event-driven webhook:** `node scripts/webhook-trigger-server.js` listens on port 18791. `POST /webhook/github` for GitHub webhook (set `GITHUB_WEBHOOK_SECRET` to verify); `POST /trigger-plan` to trigger plan-execute (optional `JARVIS_WEBHOOK_TRIGGER_SECRET`). Plan-execute runs in background; response 202.
- **Multi-day goal:** Create `~/.jarvis/autonomous-goal.txt` with one line (e.g. “Ship Olive v2 by Friday”). Plan-execute injects “Current multi-day goal: …” into the prompt so JARVIS prefers steps that advance it.

---

## 1. Reliability: so cron never runs into a cold or down stack

**Issue:** After reboot or sleep, the 8 AM plan-execute (or heartbeat) can hit: gateway not running, or farm not running → request fails and you get nothing.

| Piece | What to do |
|-------|------------|
| **Gateway** | **Done.** LaunchAgent installed; watchdog in cron every 5 min. |
| **Neural farm** | **Done.** In neural-farm repo run `node install-farm-launchagent.js` to start farm at login. |
| **Autonomous scripts** | **Done.** Retry once after 30s; optional `JARVIS_AUTONOMOUS_FALLBACK_URL` for fallback LLM. |

**Why:** Ensures scheduled runs actually reach JARVIS and the farm instead of failing silently.

---

## 2. Event-driven autonomy (react to repo events) — **Done**

**Implemented:** `node scripts/webhook-trigger-server.js` (port 18791). 

- **POST /webhook/github** — Send GitHub webhook here. Set `GITHUB_WEBHOOK_SECRET` to verify signatures. On push to main or PR opened/updated/closed, triggers plan-execute.
- **POST /trigger-plan** — Any client can trigger plan-execute. Optionally set `JARVIS_WEBHOOK_TRIGGER_SECRET` and pass it as `?secret=...` or `Authorization: Bearer <secret>`.

Start the server (e.g. in background or LaunchAgent) and point GitHub repo Settings → Webhooks → Payload URL to `http://your-host:18791/webhook/github`. For local dev use ngrok or similar.

---

## 3. Multi-day goals (work toward an outcome) — **Done**

**Implemented:** Create `~/.jarvis/autonomous-goal.txt` with one line (e.g. “Ship Olive v2 by Friday”). Plan-execute reads it and injects “Current multi-day goal: …” into the user prompt so JARVIS prefers steps that advance it.

---

## 4. One-place status (is everything up?) — **Done**

**Implemented:** `node scripts/operation-status.js` checks farm (4000), gateway (18789), build server (18790), and last report file mtime. Use `--json` for machine-readable output. Exit code 0 only if all three services are up.

---

## 5. Neural farm: start at login — **Done**

**Implemented:** In the **neural-farm** repo, run `node install-farm-launchagent.js`. That installs a LaunchAgent that runs `./dev_farm.sh --bg` at login. Logs: `~/.jarvis/logs/neural-farm-stdout.log`, `neural-farm-stderr.log`.

---

## 6. Safety and audit — **Done (script-level)**

**Implemented:** Plan-execute calls `audit-log.js` at **start** (`autonomous_plan_execute_start`) and **done** (`autonomous_plan_execute_done` with summary) with `--channel autonomous --actor plan-execute`. Requires `JARVIS_EDGE_URL` (and optional `JARVIS_AUTH_TOKEN`) in `~/.clawdbot/.env` for events to be sent; if unset, the script still runs and the audit call is ignored.

**Optional:** Have the gateway log each autonomous **exec**/deploy tool call with channel `autonomous` for a full per-tool trail. Optionally rate-limit deploy per repo per day in gateway config.

---

## Summary

| Item | Status |
|------|--------|
| Gateway at login | **Done** (LaunchAgent + watchdog cron) |
| Neural farm at login | **Done** — run `node install-farm-launchagent.js` in neural-farm |
| Retry + fallback in autonomous scripts | **Done** |
| operation-status.js | **Done** |
| Webhook trigger server | **Done** — LaunchAgent installed; starts at login. See **docs/GITHUB_WEBHOOK_SETUP.md** to wire GitHub. |
| Multi-day goal file | **Done** — `~/.jarvis/autonomous-goal.txt` |
| Audit | **Done** — plan-execute logs start/done via audit-log.js (set JARVIS_EDGE_URL for events). |

See **JARVIS_AUTONOMOUS_NEXT.md** for autonomous-only items. See **OPERATIONS_PLAN.md** for the playbook to make JARVIS feel active: schedule (plan-execute 3x daily at 8, 14, 20), setting a goal, and visibility (webhook, reports).
