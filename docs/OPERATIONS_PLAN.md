# Operations plan — make JARVIS actually do stuff

JARVIS runs on a schedule, but it can feel like "nothing's happening" if runs are sparse, fail silently, or have no direction. This doc is the playbook so **plan-execute** and **heartbeat** are frequent, visible, and goal-driven.

---

## Current schedule (after this pass)

| Job | When | What |
|-----|------|------|
| **Plan-execute** | 8:00, **14:00**, 20:00 daily | JARVIS plans (focus repo, PRs, issues), runs tools, writes report to `~/.jarvis/reports/latest.txt` and (if set) webhook/Discord. |
| **Heartbeat** | Every 6 hours | Quick check: HEARTBEAT_OK or HEARTBEAT_REPORT with bullets; can post to webhook. |
| **Watchdog** | Every 5 min | Restarts gateway if down. |
| **Farm keeper** | Hourly | Starts neural farm if down so plan-execute has an LLM. |

So JARVIS **does something concrete 3x per day** (plan-execute at 8, 2, 8) and checks in 4x per day (heartbeat). Reports go to disk and, if configured, to Discord/ntfy.

---

## 1. Set a multi-day goal (so JARVIS has direction)

Without a goal, plan-execute picks from "focus repo, open PRs/issues, recent failures" — which can feel random. Give it a north star:

```bash
cd /Users/jeffadkins/JARVIS
node scripts/set-autonomous-goal.js "Triage and advance BEAST-MODE PRs; keep Olive build green"
```

Goal is stored in `~/.jarvis/autonomous-goal.txt` and injected into every plan-execute prompt. Change it anytime; use `--clear` to remove.

**Examples:**
- "Ship Olive v2 by Friday"
- "Close or assign all open JARVIS issues; run BEAST-MODE on focus repo once per run"
- "Keep focus-repo build green; comment on any PR older than 3 days"
- "Work focus repo top-down; when slack, do one item from jarvis/CREATIVE_PROJECTS.md (bash, new tool, runbook, or QoL automation)."

---

## 2. Visibility (see that JARVIS did something)

- **Local:** Every plan-execute writes `~/.jarvis/reports/latest.txt` and a timestamped copy. Quick check: `cat ~/.jarvis/reports/latest.txt`
- **Discord (or webhook):** Set `JARVIS_ALERT_WEBHOOK_URL` or `DISCORD_WEBHOOK_URL` in `~/.clawdbot/.env`. Plan-execute and heartbeat will post there so you see HEARTBEAT_REPORT and plan-execute summaries without opening files.
- **ntfy:** Set `NTFY_TOPIC` (or `JARVIS_NTFY_TOPIC`) in `.env`; plan-execute can push a short notification.
- **macOS notification:** Set `JARVIS_REPORTS_NOTIFY=1` in env; after each plan-execute you get a system notification.

If the last report says "No response from Clawdbot", the run failed (gateway or farm was down). Run `node scripts/start-all.js` and/or `node scripts/operation-status.js` to fix.

---

## 3. Run more often (optional)

- **Plan-execute 3x daily** — Done (8, 14, 20). To add more, add cron lines like `0 11 * * *` for 11 AM.
- **Heartbeat every 3 hours** — Replace `0 */6 * * *` with `0 */3 * * *` in crontab so JARVIS checks in 8x per day and posts HEARTBEAT_REPORT more often when there’s action.

---

## 4. Ensure the stack is up before cron runs

So "No response from Clawdbot" doesn’t happen:

1. **Before you leave / after reboot:** If JARVIS runs on the **Mac**, run `node scripts/start-all.js` (starts farm + gateway + build server + webhook if down). If your **JARVIS server is the Pixel**, you don't start the gateway on the Mac; ensure the Pixel is up (Termux:Boot + watchdog). See **PIXEL_AS_JARVIS_SERVER.md**, **PIXEL_STABLE_ENVIRONMENT.md**.
2. **Farm keeper** (hourly) and **watchdog** (every 5 min) already try to bring farm and gateway back. On the Pixel, the watchdog restarts the Proot stack if the gateway is down. If you use sleep/hibernate on the Mac, run `start-all.js` after wake or rely on the next cron.

---

## 5. Quick checklist

| Done? | Action |
|-------|--------|
| ☐ | Set a goal: `node scripts/set-autonomous-goal.js "Your goal here"` |
| ☐ | Set webhook in `~/.clawdbot/.env`: `JARVIS_ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...` (or DISCORD_WEBHOOK_URL) |
| ☐ | Confirm schedule: `crontab -l` — plan-execute at 8, 14, 20; heartbeat every 6h |
| ☐ | After reboot: `node scripts/start-all.js` then check `node scripts/operation-status.js` |
| ☐ | Read last report: `cat ~/.jarvis/reports/latest.txt` |

---

## Summary

- **Schedule:** Plan-execute at **8, 14, 20**; heartbeat every 6h; watchdog every 5 min; farm keeper hourly.
- **Goal:** Set `~/.jarvis/autonomous-goal.txt` via `set-autonomous-goal.js` so JARVIS works toward something concrete.
- **Visibility:** Webhook (Discord) + local reports (+ optional ntfy / macOS notify) so you see when JARVIS ran and what it did.
- **Reliability:** `start-all.js` before you need it; watchdog and farm keeper reduce silent failures.

See **OPERATION_NEXT.md** for reliability and webhook setup; **jarvis/HEARTBEAT.md** for heartbeat rules; **jarvis/TASKS.md** for task buckets and guardrails; **jarvis/CREATIVE_PROJECTS.md** for learning, bash/foundational, and quality-of-life tasks when there's slack. On the **Pixel**, JARVIS starts in Proot by default (termux-boot runs `pixel-proot-bootstrap-and-start.sh`; fallback: `start-jarvis-pixel.sh`). Ensure gateway chat is enabled so heartbeat and plan-execute work; see **JARVIS_AUTONOMOUS_ON_PIXEL.md**.
