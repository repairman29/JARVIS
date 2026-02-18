# JARVIS as a long-running / autonomous agent

Run JARVIS on a schedule so it acts **autonomously**: it wakes up periodically, uses the **node farm** (or any configured LLM), runs **tools** (e.g. `github_status`, `exec`), and reports to you via webhook or logs. No need to open the Web UI or Discord each time.

---

## What “autonomous” means here

- **Scheduled heartbeat:** A cron job (or Task Scheduler) runs a script that sends one prompt to the JARVIS gateway. The gateway uses your farm/LLM and tools, then returns a short report. The script posts that to Discord (or another webhook).
- **Gateway always on:** The gateway stays running (e.g. via LaunchAgent, watchdog, or a long-lived process). It doesn’t “sleep”; it only does work when something triggers it (user chat, Discord, or the heartbeat script).
- **Optional:** A future **daemon** could run in a loop (e.g. every 15–30 minutes) and call the heartbeat script, so you don’t rely on system cron.
- **Plan and execute:** JARVIS writes a plan (what to do next) and then **executes it** using tools—no human in the loop. One scheduled run can do: check focus repo → run github_status → run a test or triage one issue → report. See §1.5 below.

All of this works with **JARVIS on the neural farm**: the gateway still sends completions to `http://localhost:4000/v1` (or your farm URL). The farm is the brain; the gateway runs tools and orchestration.

---

## 1. Autonomous heartbeat (recommended)

This uses the **full agent**: gateway + farm/LLM + tools. JARVIS gets a “run your heartbeat” prompt, can call tools (e.g. `github_status`, `gh pr list`), and replies with **HEARTBEAT_OK** or **HEARTBEAT_REPORT** per `jarvis/HEARTBEAT.md`. You then post that reply to a webhook.

### 1.1 One-off run

From the JARVIS repo root:

```bash
node scripts/jarvis-autonomous-heartbeat.js
```

- Requires the **gateway** to be running and **CLAWDBOT_GATEWAY_TOKEN** set (e.g. in `~/.clawdbot/.env`).
- **Reports without Discord:** Every run writes to **`~/.jarvis/reports/latest.txt`** (and a timestamped copy). No login. Optional: **`JARVIS_REPORTS_NOTIFY=1`** for a macOS notification.
- **ntfy (push, no login):** If you run ntfy (ntfy.sh or self-hosted), set **`NTFY_TOPIC`** (e.g. `jarvis-reports`). Reports are POSTed to that topic so you get push on your phone/desktop. **`node scripts/set-ntfy-topic.js jarvis-reports`** — for self-hosted add the base URL: **`node scripts/set-ntfy-topic.js jarvis-reports https://ntfy.your-server.com`**.
- Optional webhook: **JARVIS_ALERT_WEBHOOK_URL** or **DISCORD_WEBHOOK_URL** — if set, the script also posts there.

Flags:

- `--no-webhook` — run the agent and print the reply only; do not post.
- `--dry-run` — print the prompt and URL, then exit (no gateway call).

### 1.2 Schedule with cron

Example: every 6 hours.

```bash
0 */6 * * * cd /path/to/JARVIS && node scripts/jarvis-autonomous-heartbeat.js
```

Use your actual JARVIS repo path. Ensure the gateway is running (see below) or start it in the same cron line if you prefer.

### 1.3 Let the agent use tools (exec, github_status)

For the heartbeat to run tools (e.g. `github_status`, `exec` for `gh pr list`), the gateway must allow **elevated** for the channel it assigns to API requests. That is usually **webchat**. If you already ran:

```bash
node scripts/enable-web-exec.js
```

then webchat (and thus this script) can use exec. Restart the gateway after changing config.

### 1.5 Plan and execute (write plans and run them without you)

To have JARVIS **create a plan and execute it** (using tools) with no human in the loop:

```bash
node scripts/jarvis-autonomous-plan-execute.js
```

- **What it does:** One gateway call. JARVIS is prompted to: (1) create a short plan (e.g. focus repo from products.json, check PRs/issues, run one quality step), (2) execute each step with tools (github_status, exec, etc.), (3) reply with `AUTONOMOUS_DONE` and a summary. The gateway runs the full tool loop and returns when done.
- **Timeout:** Default 10 minutes (`JARVIS_AUTONOMOUS_TIMEOUT_MS`, default 600000). Increase if you want longer runs.
- **Flags:** `--no-webhook`, `--dry-run` (same as heartbeat).
- **Cron example (daily at 8 AM):**  
  `0 8 * * * cd /path/to/JARVIS && node scripts/jarvis-autonomous-plan-execute.js`

**Guardrails** (in the prompt): no force-push, no destructive actions without explicit scope, no committing secrets; prefer read-only and low-risk steps. For full exec (e.g. draft PR, comment on issue), ensure `enable-web-exec.js` has been run and the gateway allows elevated for webchat.

| Mode | Script | Use when |
|------|--------|----------|
| Short check-in | `jarvis-autonomous-heartbeat.js` | Quick HEARTBEAT_OK / HEARTBEAT_REPORT every few hours |
| Plan + execute | `jarvis-autonomous-plan-execute.js` | You want JARVIS to decide what to do and do it (daily or on schedule) |

---

## 2. Keep the gateway running

The autonomous heartbeat **calls** the gateway; it doesn’t start it. So the gateway must be up.

- **LaunchAgent (macOS):** Use `scripts/install-gateway-launchagent.js` so the gateway starts on login and restarts on failure.
- **Watchdog:** `node scripts/watchdog-jarvis-local.js --loop` checks the gateway every 5 minutes and starts it if down (and optionally Ollama). Run in a separate terminal or as a service.
- **Manual:** `node scripts/start-gateway-with-vault.js` (foreground) or `node scripts/start-gateway-background.js` (detached).

If the **farm** is on the same machine, start it too (e.g. `./start_farm.sh` in the neural-farm repo) so the gateway can reach `http://localhost:4000/v1`.

---

## 3. Comparison with heartbeat-brief.js

| | **heartbeat-brief.js** | **jarvis-autonomous-heartbeat.js** |
|---|------------------------|-------------------------------------|
| **LLM / farm** | No | Yes — full agent via gateway |
| **Tools** | No (only safety net + `gh pr list` / `gh issue list` via shell) | Yes — gateway runs tools (github_status, exec, etc.) |
| **Output** | Safety net snapshot + PR/issue counts + “next action” | JARVIS’s reply (HEARTBEAT_OK or HEARTBEAT_REPORT + bullets) |
| **Use when** | Lightweight, no gateway/LLM needed | You want the real agent (on the farm) to reason and use tools |

You can run both: e.g. `heartbeat-brief.js` every hour for a quick health snapshot, and `jarvis-autonomous-heartbeat.js` every 6 hours for a full agent heartbeat.

---

## 4. Neural farm

JARVIS autonomous heartbeat works with the **neural farm** as the LLM:

1. Start the farm: `cd neural-farm && ./start_farm.sh`
2. Point JARVIS at the farm: `node scripts/set-primary-neural-farm.js` (and restart the gateway).
3. Run the autonomous heartbeat as above. The gateway will send completions to the farm; the farm (Pixel/iPhone) is the brain, the gateway runs tools and scheduling.

No change to the heartbeat script when using the farm — only gateway and farm config.

---

## 5. Security and safety

- **Token:** The script uses `CLAWDBOT_GATEWAY_TOKEN` to call the gateway. Keep it in `~/.clawdbot/.env` (or a secrets manager), not in cron command line.
- **Exec:** If you enable exec for webchat (or the channel used by this script), the autonomous agent can run commands on the machine. Use only in a trusted environment and with appropriate allowlists (see RUNBOOK.md and JARVIS_WEB_EXEC.md).
- **Webhook:** Discord/webhook URLs are sensitive; store them in env or secrets, not in scripts.

---

## 6. Summary

| Goal | Action |
|------|--------|
| Run JARVIS (farm + tools) on a schedule | Use `jarvis-autonomous-heartbeat.js` from cron |
| **JARVIS writes plans and executes them** | Use `jarvis-autonomous-plan-execute.js` from cron (e.g. daily) |
| Lightweight health snapshot only | Use `heartbeat-brief.js` from cron |
| Keep gateway up | LaunchAgent, watchdog, or manual start |
| Let autonomous agent use exec/tools | Run `enable-web-exec.js` and restart gateway |
| Use the neural farm as brain | Set primary to farm; start farm; no script change |

This gives you a **long-running agent** that works autonomously on the node farm: scheduled heartbeats, **plan-and-execute runs**, full tool use, and reports to your webhook.

---

## 7. What JARVIS is doing and how to watch

### What’s actually running

1. **Gateway** (e.g. `clawdbot gateway run`) — Listens for chat and tool requests. When the autonomous script runs, it sends one HTTP POST to the gateway with the “heartbeat” or “plan-and-execute” prompt; the gateway calls the **farm** (or your LLM) for completions and runs **tools** (github_status, exec, etc.) in a loop until the model is done, then returns the final text.
2. **Farm** (LiteLLM + Pixel/iPhone adapters) — Supplies the LLM replies. The gateway sends each turn to the farm; the farm returns text; the gateway may then call tools and send again.
3. **Cron** (optional) — Runs `jarvis-autonomous-heartbeat.js` or `jarvis-autonomous-plan-execute.js` on a schedule. Each run is one “autonomous” session (user id `autonomous`).

So when you “watch” JARVIS, you’re watching: (a) the **output of the script** (stdout / webhook), (b) **gateway logs** (what the gateway is doing and which tools it runs), (c) **Discord** (if webhook is set), (d) optionally **audit log** for exec/elevated actions.

### How to see or watch

| Where | What you see |
|-------|----------------|
| **Discord (or webhook)** | If `JARVIS_ALERT_WEBHOOK_URL` or `DISCORD_WEBHOOK_URL` is set in `~/.clawdbot/.env`, the autonomous scripts post the **final report** there (heartbeat brief or plan-and-execute summary). Easiest way to “watch” without touching the machine. |
| **Run the script in a terminal** | `node scripts/jarvis-autonomous-heartbeat.js --no-webhook` or `node scripts/jarvis-autonomous-plan-execute.js --no-webhook` — you see the same report in stdout when it finishes. Good for one-off “what would JARVIS do right now?” |
| **Gateway logs (foreground)** | If you start the gateway in the foreground (`node scripts/start-gateway-with-vault.js`), all gateway activity (incoming requests, tool calls, errors) goes to that terminal. You see each request and tool run in real time. |
| **Gateway logs (LaunchAgent)** | If the gateway runs as a LaunchAgent, stdout and stderr go to files: **`~/.jarvis/logs/gateway-stdout.log`** and **`~/.jarvis/logs/gateway-stderr.log`**. Tail them to watch live: `tail -f ~/.jarvis/logs/gateway-stderr.log` |
| **Cron output** | Cron doesn’t show stdout by default. To capture it: redirect in the cron line, e.g. `0 8 * * * cd /path/to/JARVIS && node scripts/jarvis-autonomous-plan-execute.js >> ~/.jarvis/logs/plan-execute.log 2>&1` (create `~/.jarvis/logs` if needed). Then `tail -f ~/.jarvis/logs/plan-execute.log` when a run is scheduled. |
| **Audit log** | If you use the Supabase audit log (see docs/JARVIS_AUDIT_LOG.md), exec and other elevated actions are recorded with timestamp, channel, and details. Autonomous runs use channel/session “webchat” or “autonomous” depending on gateway mapping. Query the table to see what commands were run. |
| **Web UI** | The JARVIS Web UI shows **interactive** chats (sessions you open in the browser). Autonomous runs use a separate session id (`autonomous`) and are **not** shown in the Web UI thread list; you see their results only via webhook or script stdout or gateway logs. |

### Quick “watch right now”

- **Live gateway activity:**  
  `tail -f ~/.jarvis/logs/gateway-stderr.log`  
  (If the gateway is running via LaunchAgent. If you started it in a terminal, that terminal is the log.)
- **Last report (no login):**  
  `cat ~/.jarvis/reports/latest.txt` — updated on every heartbeat and plan-execute run.
- **One-off run and see result in terminal:**  
  `cd /path/to/JARVIS && node scripts/jarvis-autonomous-plan-execute.js --no-webhook`
