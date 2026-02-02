# JARVIS — Auto-start and keep services running

How to start JARVIS (Ollama + gateway) automatically when you open Cursor or at login, and how to keep services running and healthy with a watchdog.

---

## 1. When you fire up Cursor

**Goal:** Start the gateway when you open this repo in Cursor (or VS Code).

### Already set up for you

This repo has **automatic tasks enabled** in `.vscode/settings.json` (`task.allowAutomaticTasks: "on"`). The only task that runs on folder open is **JARVIS: Start local gateway**. So when you open this repo, the gateway starts in the background automatically — no prompt, no extra step.

If your editor ever asks **Allow Automatic Tasks in Folder**, choose **Allow** once; after that it won’t ask again for this workspace.

### What the task does

- Runs `node scripts/start-gateway-background.js`.
- That script ensures `~/.clawdbot/clawdbot.json` and `~/.clawdbot/.env` (gateway token), then starts `npx clawdbot gateway run` in the background and exits.

### Manual run (no folder-open)

- **Terminal → Run Task** (Cmd+Shift+P → “Tasks: Run Task”) → **JARVIS: Start local gateway**.
- Or from repo root: `node scripts/start-gateway-background.js`.

### Other tasks in this repo

| Task | Purpose |
|------|---------|
| **JARVIS: Start local gateway** | Start gateway in background (used for “on folder open”). |
| **JARVIS: Setup and run gateway (foreground)** | Setup + run gateway in the same terminal (for debugging). |
| **JARVIS: Setup only** | Create/update config and .env; print run command. |
| **JARVIS: Watchdog** | Check Ollama + gateway; restart gateway if down. |

---

## 2. At system login (no Cursor)

**Goal:** Start the gateway when you log in, so JARVIS is available even if you don’t open Cursor.

### macOS (LaunchAgent)

If you use the Clawdbot CLI:

```bash
clawdbot gateway install   # install as LaunchAgent
clawdbot gateway start    # start now
```

The gateway then starts at login and runs in the background. See [DEVELOPER_GUIDE.md — Running as a Service](../DEVELOPER_GUIDE.md).

To use **this repo’s** script instead of the global `clawdbot` install, create a LaunchAgent that runs from the repo:

```bash
# Example: create ~/Library/LaunchAgents/com.jarvis.gateway.plist
# ProgramArguments: node, /path/to/CLAWDBOT/scripts/start-gateway-background.js
# WorkingDirectory: /path/to/CLAWDBOT
# RunAtLoad: true
```

(You can add a script that generates this plist from the repo root.)

### Windows (Task Scheduler)

From the repo (PowerShell, run once):

```powershell
powershell -ExecutionPolicy Bypass -File scripts\add-jarvis-to-startup.ps1
```

That registers a task **JARVIS ROG Ed** that runs at logon and executes `scripts\start-jarvis-ally-background.bat` (which runs `npx clawdbot gateway run`). To remove: Task Scheduler → **JARVIS ROG Ed** → Delete.

To use the **background starter** from this repo instead, point the scheduled task at:

- **Program:** `node`
- **Arguments:** `scripts/start-gateway-background.js`
- **Start in:** repo root (e.g. `C:\path\to\CLAWDBOT`).

---

## 3. Keep services running and healthy (watchdog)

**Goal:** Periodically check Ollama and the gateway; restart the gateway if it’s down.

### Run watchdog once

From repo root:

```bash
node scripts/watchdog-jarvis-local.js
```

- Checks Ollama at `http://localhost:11434` and the gateway at `http://127.0.0.1:18789` (or `JARVIS_GATEWAY_PORT` / `PORT`).
- If the gateway is down, starts it in the background (via `start-gateway-background.js`).
- Writes last state to `~/.jarvis/health/watchdog.json`.

### Run watchdog in a loop (every 5 min)

```bash
node scripts/watchdog-jarvis-local.js --loop
```

Leave this running in a terminal (or run it as a background service). It checks every 5 minutes and restarts the gateway if needed.

### Schedule the watchdog (cron / Task Scheduler)

Run the watchdog **once** every 5–10 minutes so the gateway is restarted if it died.

**macOS / Linux (cron):**

```bash
# Every 5 min: run watchdog from repo
*/5 * * * * cd /path/to/CLAWDBOT && node scripts/watchdog-jarvis-local.js >> ~/.jarvis/health/watchdog.log 2>&1
```

**Windows (Task Scheduler):**

- Create a task that runs every 5 minutes.
- **Program:** `node`
- **Arguments:** `scripts/watchdog-jarvis-local.js`
- **Start in:** repo root.

### Optional: safety net (broader health)

For more checks (repo index freshness, Discord, GitHub, etc.), use the existing safety net and optionally have it start the gateway if down:

```bash
node scripts/jarvis-safety-net.js
# Optional repair:
node scripts/jarvis-safety-net.js --repair
```

The watchdog script above is focused only on “Ollama + gateway up”; the safety net covers the rest.

---

## 4. Quick reference

| Want | Do |
|------|-----|
| **Start when I open Cursor** | Allow automatic tasks → select “JARVIS: Start local gateway”. |
| **Start when I log in (Mac)** | `clawdbot gateway install` or a LaunchAgent that runs `start-gateway-background.js`. |
| **Start when I log in (Windows)** | `scripts\add-jarvis-to-startup.ps1` or a scheduled task for `start-gateway-background.js`. |
| **Keep gateway up** | Run `watchdog-jarvis-local.js` every 5 min (cron/Task Scheduler) or run `watchdog-jarvis-local.js --loop` in a terminal. |
| **Full health check** | `node scripts/jarvis-safety-net.js`. |

---

## 5. See also

- [LOCAL_INFERENCE_AGENTS.md](LOCAL_INFERENCE_AGENTS.md) — Setup and run with Ollama.
- [RUNBOOK.md](../RUNBOOK.md) — Gateway management, setup-and-run commands.
- [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) — LaunchAgent, `clawdbot gateway install`.
