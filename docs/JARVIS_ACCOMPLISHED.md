# What JARVIS Has Accomplished

A summary of what’s in place so JARVIS runs on your neural farm, works autonomously, reports to you, and owns build/test/deploy by default.

---

## 1. JARVIS on the neural farm

- **Brain:** The JARVIS gateway uses your **neural farm** (LiteLLM on port 4000) as its LLM. The farm load-balances across **Pixel (Gemma)** and **iPhone (Llama 3.2)** via adapters (8888, 8887).
- **Config:** `config.yaml` has `drop_params: true` so the farm accepts gateway requests. You ran `set-primary-neural-farm.js` so the gateway points at the farm.
- **Result:** All JARVIS chat (Web UI, Discord, Cursor MCP, autonomous scripts) uses your phones as the brain; the gateway runs tools and orchestration.

---

## 2. Autonomous agent (no you in the loop)

- **Heartbeat** (`jarvis-autonomous-heartbeat.js`): Runs on a schedule (e.g. every 6h via cron). Sends one prompt to the gateway; JARVIS uses the farm + tools and replies with HEARTBEAT_OK or HEARTBEAT_REPORT. You get a short check-in without opening the UI.
- **Plan-and-execute** (`jarvis-autonomous-plan-execute.js`): JARVIS **writes a plan** (focus repo from products.json, PRs, issues) and **executes it** with tools (github_status, exec, etc.). One run can triage, run checks, and report AUTONOMOUS_DONE + summary. Cron runs it (e.g. daily at 8 AM).
- **Cron:** You have a crontab entry for the autonomous heartbeat (every 6h). Plan-execute can be added the same way.
- **Focus repo:** From **products.json** the first active product is **BEAST-MODE**, then JARVIS, Olive, Echeo, MythSeeker. Autonomous prompts tell JARVIS to work in that order.

---

## 3. Reports to you (no Discord login)

- **ntfy:** Topic **jarvis-reports** is set in `~/.clawdbot/.env`. Every heartbeat and plan-execute run **POSTs the report to that topic**. You get **push notifications on your phone** (and optionally desktop) via the ntfy app. No Discord or login.
- **Local files:** Every run also writes to **`~/.jarvis/reports/latest.txt`** and a timestamped copy. You can `cat` or open in an editor anytime.
- **Optional:** `JARVIS_REPORTS_NOTIFY=1` for a macOS notification when a report is ready.

---

## 4. Build, test, deploy — default flow

- **Build server:** A small HTTP service runs on **port 18790**. It runs **install**, **build**, and **test** for configured repos (no raw exec from JARVIS for those steps).
- **Config:** **`build-server-repos.json`** maps repo names (JARVIS, olive, BEAST-MODE, Echeo, MythSeeker) to paths on your machine.
- **Pipeline:** **POST /pipeline** runs **install → build → test** in order and stops on first failure. JARVIS uses the **build_server** skill: **build_server_pipeline(repo)** for “build and test” or “ship” (before deploy), and **build_server_build(repo, command)** for build-only or test-only.
- **Default in agent instructions:** **jarvis/AGENTS.md** and **jarvis/TOOLS.md** tell JARVIS to use the build server for build/test by default and to deploy via **github_workflow_dispatch** or **exec** (vercel deploy, railway up, etc.) after the pipeline passes.
- **Result:** When you say “build and test olive” or “ship JARVIS,” JARVIS goes through the build server pipeline then deploy, not ad-hoc exec.

---

## 5. Start at reboot and when you open Cursor

- **At login (macOS):** The **build server** is installed as a **LaunchAgent** (`com.jarvis.build-server`). It starts automatically when you log in after a reboot. Optionally, **gateway** can do the same via `node scripts/install-gateway-launchagent.js`.
- **When you open Cursor:** A **VS Code/Cursor task**, **Start JARVIS services**, runs **`start-jarvis-services.js`**, which starts the build server and gateway if they’re not already running. You can allow it to **run automatically when you open the JARVIS folder** (Command Palette → Tasks: Allow Automatic Tasks in Folder). Or run the task manually (Tasks: Run Task → Start JARVIS services).
- **Result:** After a reboot, the build server (and gateway if you installed its LaunchAgent) is up. When you open the JARVIS workspace in Cursor, the task can bring up anything that’s down.

---

## 6. How to see what JARVIS is doing

- **ntfy:** Reports show up as push notifications (heartbeat + plan-execute).
- **Local:** `cat ~/.jarvis/reports/latest.txt`.
- **Gateway logs:** `tail -f ~/.jarvis/logs/gateway-stderr.log` (if gateway runs via LaunchAgent).
- **Build server logs:** `~/.jarvis/logs/build-server-stderr.log`, `build-server-stdout.log`.

---

## 7. One-line summary

**JARVIS has:** (1) the neural farm (Pixel + iPhone) as its brain, (2) autonomous heartbeat and plan-and-execute on a schedule, (3) reports to ntfy and local files (no Discord), (4) a build server as the default for build/test and a clear deploy path, and (5) start at reboot (build server LaunchAgent) and a Cursor task to start services when you open the workspace.
