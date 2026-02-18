# Next: Make JARVIS the Most Capable Autonomous AI

Prioritized steps to push JARVIS further as an autonomous agent. You already have: farm as brain, heartbeat + plan-execute on cron, ntfy reports, build server as default, start at reboot and when opening Cursor.

---

## Implemented (this session)

- **Last-run context:** Plan-execute now reads `~/.jarvis/autonomous-last-summary.txt` (written at end of each run) and injects “Previous autonomous run ended with: …” into the prompt so JARVIS can pick up where it left off.
- **Build server in plan-execute:** System prompt tells JARVIS to use `build_server_pipeline(repo)` / `build_server_build(repo, command)` for build and test, not raw exec.
- **Full autonomous ship:** Prompt says: if the plan included “ship” or “deploy” and build+test passed, call deploy (workflow_dispatch or exec) before replying AUTONOMOUS_DONE.
- **Spawn for long tasks:** Prompt says: for long/heavy work use `sessions_spawn` and report what was spawned; don’t block the run.

---

## 1. Schedule plan-execute (not just heartbeat)

**Now:** Heartbeat runs every 6h; plan-execute is documented but may not be in cron.

**Next:** Add plan-execute to cron so JARVIS doesn’t only check in — it also plans and acts (e.g. daily or every 12h).

```bash
# Example: daily at 8 AM
0 8 * * * HOME=/Users/jeffadkins cd /Users/jeffadkins/JARVIS && node scripts/jarvis-autonomous-plan-execute.js
```

**Why:** Heartbeat = “what’s up?”; plan-execute = “do something.” Both on a schedule = consistently autonomous.

---

## 2. Last-run context (memory across autonomous runs) — **Done**

Implemented in `jarvis-autonomous-plan-execute.js`: reads `~/.jarvis/autonomous-last-summary.txt` (last 600 chars, written at end of each run) and injects into the user prompt so JARVIS can continue from the previous run.

---

## 3. Full autonomous ship (build → test → deploy) — **Done**

Added to plan-execute system prompt: if plan included “ship” or “deploy” and build+test passed, call deploy before AUTONOMOUS_DONE.

---

## 4. Use build server + pipeline in plan-execute — **Done**

System prompt now instructs: use `build_server_pipeline(repo)` / `build_server_build(repo, command)` for build and test; do not use raw exec for npm build/test.

---

## 5. Spawn subagents from autonomous runs — **Done**

System prompt now instructs: for long/heavy tasks use `sessions_spawn` and report what was spawned.

---

## 6. Event-triggered runs — **Done**

**scripts/webhook-trigger-server.js** (port 18791) accepts `POST /webhook/github` (GitHub push/PR) and `POST /trigger-plan`; both trigger plan-execute. See **docs/GITHUB_WEBHOOK_SETUP.md**. (Time-based cron still available.)

**Next:** A small webhook receiver (e.g. Flask/Express on a port or a Supabase Edge function) that accepts GitHub “push to main” or “PR merged” and runs `jarvis-autonomous-plan-execute.js` (or a lighter “on push” script). So JARVIS can react to repo events, not just the clock.

**Why:** “Code just landed on main → run plan-execute” makes autonomy event-driven as well as scheduled.

---

## 7. Retry and fallback when farm or gateway is down — **Done**

Both **jarvis-autonomous-plan-execute.js** and **jarvis-autonomous-heartbeat.js** use `callWithRetryAndFallback`: retry once after 30s; if `JARVIS_AUTONOMOUS_FALLBACK_URL` is set, call it and prefix report with `[Fallback LLM; gateway/farm was unavailable.]`.


---

## 8. Longer-term goals — **Done**

Plan-execute reads **`~/.jarvis/autonomous-goal.txt`** (up to 500 chars). Set with `node scripts/set-autonomous-goal.js "Your goal"` or `echo "Your goal" > ~/.jarvis/autonomous-goal.txt`; clear with `--clear`.

---

## Summary

| Priority | Action | Status |
|----------|--------|--------|
| 1 | Add plan-execute to cron (e.g. daily 8 AM) | **You do:** run `node scripts/add-plan-execute-cron.js` for the line, or `--add` to append |
| 2 | Last-run summary in plan-execute | **Done** |
| 3 | “If build+test passed, deploy” in prompt | **Done** |
| 4 | build_server_pipeline for build/test | **Done** |
| 5 | sessions_spawn for long tasks | **Done** |
| 6 | Event-triggered (webhook) | **Done** — webhook-trigger-server.js |
| 7 | Retry + fallback | **Done** — JARVIS_AUTONOMOUS_FALLBACK_URL |
| 8 | Multi-day goal | **Done** — autonomous-goal.txt + set-autonomous-goal.js |

One remaining step: add plan-execute to cron (§1) so JARVIS plans and acts on a schedule. Then autonomy is fully wired.
