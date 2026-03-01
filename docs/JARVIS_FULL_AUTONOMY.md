# JARVIS full autonomy — heartbeat + work without intervention

One-page map so JARVIS runs with **full heartbeat** and **does work on his own**, with **task sets** and **creative/learning** work rooted in foundational computing (bash, scripting) while staying modern.

---

## What “full autonomy” means here

- **Heartbeat** and **plan-execute** run on a schedule (cron); no need to open the UI or trigger by hand.
- The **gateway** accepts `POST /v1/chat/completions` so those scripts can call the agent (tools, focus repo, PRs, etc.).
- JARVIS follows **instruction sets**: HEARTBEAT.md (checklist), TASKS.md (buckets, guardrails), and when there’s slack **CREATIVE_PROJECTS.md** (learning, bash, quality of life, stay cutting edge).
- You set a **goal** (optional) so plan-execute works toward something concrete; you can include “one creative/learning task when slack.”

---

## Enable full autonomy

### 1. Gateway chat completions (required for heartbeat/plan-execute)

The Clawdbot gateway must have chat completions enabled. On **Pixel** this is automatic:

- **start-jarvis-pixel.sh** and **setup-jarvis-termux.sh** run `node scripts/enable-gateway-chat-completions.js` before starting the gateway.
- On **Mac** (or other host), run once: `node scripts/enable-gateway-chat-completions.js` then restart the gateway.

Without this, POST to `/v1/chat/completions` returns 405 and autonomous scripts get no response.

### 2. Schedule (cron)

- **Pixel (Termux):** setup-jarvis-termux.sh installs cron: plan-execute at **8:00, 14:00, 20:00**; heartbeat **every 6 hours**. Use **Termux:Boot** + **Wake lock** so cron runs after reboot and when the screen is off (see **JARVIS_AUTONOMOUS_ON_PIXEL.md**).
- **Mac:** Add lines with `node scripts/add-plan-execute-cron.js --add` and/or `node scripts/add-overnight-autonomous-cron.js --add`.

### 3. Goal (optional but recommended)

```bash
node scripts/set-autonomous-goal.js "Your one-line goal"
```

Examples: “Ship Olive v2 by Friday”; “Work focus repo; when slack, one item from CREATIVE_PROJECTS (bash, runbook, or new tool).”

### 4. Visibility (optional)

- **Webhook:** `JARVIS_ALERT_WEBHOOK_URL` or `DISCORD_WEBHOOK_URL` in `~/.clawdbot/.env` → reports posted to Discord.
- **ntfy:** `NTFY_TOPIC` in `.env` → push to phone/desktop.
- **Local:** `~/.jarvis/reports/latest.txt` and `~/plan-execute.log`, `~/heartbeat.log` on Pixel.

---

## Instruction sets (what JARVIS follows)

| File | Purpose |
|------|--------|
| **jarvis/HEARTBEAT.md** | Checklist: focus repo, scan PRs/issues, one action, HEARTBEAT_OK / HEARTBEAT_REPORT. References TASKS and CREATIVE_PROJECTS. |
| **jarvis/TASKS.md** | Task buckets (ship, triage, spawn, quality, follow-up), guardrails, response rules. |
| **jarvis/CREATIVE_PROJECTS.md** | When slack: foundational (bash, Unix, scripting), stay modern (one new tool, one doc), quality of life (one automation, one runbook improvement). |

Heartbeat and plan-execute system prompts reference these files so JARVIS knows to use tools, report correctly, and optionally do one creative/learning item when there’s slack.

---

## Foundational + cutting edge

CREATIVE_PROJECTS.md is built so JARVIS can:

- **Root in fundamentals** — Bash, pipes, `jq`, small scripts, runbooks. “Bash is old AF but so cool.”
- **Stay modern** — Try one new CLI or library, bump one dependency safely, skim one doc and note when it matters.
- **Improve quality of life** — One automation, one runbook fix, one health check so the next run (or human) has an easier time.

Keep each creative step **small** (one script, one tool try, one doc skim) so production work (ship, triage, report) stays primary.

---

## Quick checklist

| Done? | Action |
|-------|--------|
| ☐ | Gateway chat enabled (automatic on Pixel with start-jarvis-pixel.sh; on Mac run enable-gateway-chat-completions.js and restart gateway) |
| ☐ | Cron in place (Pixel: setup-jarvis-termux + Termux:Boot + Wake lock; Mac: add-plan-execute-cron.js / add-overnight-autonomous-cron.js) |
| ☐ | Goal set (optional): `node scripts/set-autonomous-goal.js "..."` |
| ☐ | Webhook or ntfy (optional) so you see reports |
| ☐ | Last report: `cat ~/.jarvis/reports/latest.txt` or `tail ~/plan-execute.log` (Pixel: `tail ~/heartbeat.log`) |

---

## See also

- **JARVIS_AUTONOMOUS_AGENT.md** — How heartbeat and plan-execute call the gateway, tools, and webhooks.
- **JARVIS_AUTONOMOUS_ON_PIXEL.md** — Pixel-specific: Wake lock, Termux:Boot, cron, goal, ntfy.
- **OPERATIONS_PLAN.md** — Schedule, visibility, reliability.
- **jarvis/HEARTBEAT.md**, **jarvis/TASKS.md**, **jarvis/CREATIVE_PROJECTS.md** — Instruction sets JARVIS follows.
