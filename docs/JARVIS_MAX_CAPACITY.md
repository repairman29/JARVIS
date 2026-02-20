# How to Run JARVIS at Max Capacity

One checklist so JARVIS has **full brain, full tools, and full automation** — whether your primary “brain” is on the **Pixel** (current) or on the **Mac**.

---

## Quick picture

| Layer | What “max” means |
|-------|-------------------|
| **Brain** | Gateway + LLM (Pixel stack with Pixel + iPhone InferrLM, or Mac gateway + neural-farm) |
| **Tools** | All skills available; team agents (BEAST MODE, Code Roach, Echeo) on PATH when gateway runs |
| **Automation** | Plan-execute (daily), heartbeat (6h), webhook (GitHub → plan-execute), build server for pipelines |
| **Survival** | LaunchAgents / cron so services come back after reboot or sleep |

---

## Mode 1: Pixel as brain (what you have now)

Chat from Mac → Pixel. The **gateway and LLM** live on the Pixel.

### 1. Pixel stack (must be running)

On the Pixel (Termux), or from Mac: `./scripts/ssh-pixel-start-jarvis.sh`

```bash
# On Pixel (Termux):
cd ~/JARVIS && bash scripts/start-jarvis-pixel.sh
```

- **Primary adapter (8888)** → Pixel InferrLM (127.0.0.1:8889)  
- **iPhone adapter (8887)** → iPhone InferrLM (JARVIS_IPHONE_LLM_URL, e.g. 192.168.86.210:8889)  
- **Router (18890)** → gateway uses this for both backends  
- **Gateway (18789)**, **Chat (18888)**, **Webhook (18791)** up

### 2. Mac → Pixel chat (max use from Mac)

- **CLI:** `cd ~/JARVIS && ./scripts/jarvis-chat "your message"` or `./scripts/jarvis-chat` (interactive)
- **GUI:** `./scripts/jarvis-chat-gui` → open http://localhost:9191
- **Pixel IP:** `.pixel-ip` or `JARVIS_PIXEL_IP`; on new WiFi run `./scripts/pixel-refresh-ip.sh`

### 3. Optional: voice on Pixel

- In Termux: `bash ~/JARVIS/scripts/start-voice-node-pixel.sh` (manual trigger), or use browser `/voice` at http://127.0.0.1:18888/voice on the Pixel.
- For “god mode” stability (fewer kills): run PPK bypass once (see PIXEL_VOICE_RUNBOOK.md), then reboot.

### 4. Mac-side automation (still useful with Pixel brain)

You can run **autonomous scripts and webhook on the Mac**, but they need a **gateway** to call. Two options:

- **A) Use Pixel as gateway for cron:**  
  Set `JARVIS_GATEWAY_URL=http://192.168.86.209:18789` (or your Pixel IP) in `~/.clawdbot/.env` on the Mac, and ensure any script that calls the gateway uses that URL (some scripts assume localhost:18789; you may need to set `JARVIS_GATEWAY_PORT` and a tunnel or use a small proxy).
- **B) Run gateway on Mac too:**  
  Start Mac gateway (18789) + point it at a Mac-side farm (e.g. neural-farm on 4000) or at Pixel. Then plan-execute, heartbeat, and webhook on Mac use localhost:18789.

So “max capacity” with **Pixel as brain** = Pixel stack + Mac chat (CLI/GUI) + (optional) voice on Pixel + (optional) Mac automation pointed at Pixel or at a second gateway on Mac.

---

## Mode 2: Mac as brain (gateway + farm on Mac)

Full stack on the Mac: farm, gateway, build server, webhook, team, autonomous.

### 1. Neural Farm (Mac)

```bash
cd ~/neural-farm   # or wherever neural-farm lives
./dev_farm.sh      # or ./dev_farm.sh --bg
```

Optional: start at login — in neural-farm run `node install-farm-launchagent.js`.

### 2. Point JARVIS at farm

```bash
cd ~/JARVIS
node scripts/set-primary-neural-farm.js
```

### 3. Gateway (Mac)

```bash
cd ~/JARVIS
node scripts/start-gateway-with-vault.js   # foreground
# or
node scripts/start-gateway-background.js   # background
```

Optional: start at login — `node scripts/install-gateway-launchagent.js`. Watchdog: cron every 5 min with `watchdog-jarvis-local.js`.

### 4. Build server + webhook (Mac)

```bash
node scripts/start-jarvis-services.js   # starts only what’s down: build server 18790, webhook 18791
```

Optional: `node scripts/install-build-server-launchagent.js`, `node scripts/install-webhook-trigger-launchagent.js`.

### 5. One-command “bring up everything” (Mac)

```bash
cd ~/JARVIS
node scripts/start-all.js
```

Then check:

```bash
node scripts/operation-status.js
```

### 6. Team at max (BEAST MODE, Code Roach, Echeo)

- Install team CLIs on the Mac (where the gateway runs) so they’re on PATH.
- Edit `config/team-agents.json` as needed.
- Bootstrap once per session:

```bash
node scripts/ensure-team-ready.js
```

This checks farm, gateway, and runs `team-status.js` → writes `~/.jarvis/team-status.json`. Then JARVIS can invoke the team via exec / workflow_dispatch.

### 7. Autonomous at max (plan-execute, heartbeat)

- **Plan-execute (daily):**  
  `node scripts/add-plan-execute-cron.js` (add cron line). Script: `jarvis-autonomous-plan-execute.js`.
- **Heartbeat (e.g. every 6h):**  
  Add a cron line that runs `node scripts/jarvis-autonomous-heartbeat.js`.
- **Multi-day goal:**  
  Put one line in `~/.jarvis/autonomous-goal.txt`.
- **Fallback if gateway/farm down:**  
  Set `JARVIS_AUTONOMOUS_FALLBACK_URL` in `~/.clawdbot/.env` (e.g. backup gateway or Groq).

### 8. Event-driven (GitHub → plan-execute)

- Run webhook server (18791); see GITHUB_WEBHOOK_SETUP.md.
- Point GitHub repo webhook at `http://your-mac:18791/webhook/github` (use ngrok for local).

---

## One-page “max capacity” checklist

**If Pixel is your main JARVIS brain (current setup):**

| Step | Command / action |
|------|-------------------|
| 1 | Pixel stack running: on Pixel `bash ~/JARVIS/scripts/start-jarvis-pixel.sh` (or from Mac `./scripts/ssh-pixel-start-jarvis.sh`) |
| 2 | Pixel + iPhone InferrLM: JARVIS_IPHONE_LLM_URL in Pixel `~/.clawdbot/.env`; primary adapter = local 8889 |
| 3 | Mac chat | `./scripts/jarvis-chat` or `./scripts/jarvis-chat-gui` (open http://localhost:9191) |
| 4 | Pixel IP on new WiFi | `./scripts/pixel-refresh-ip.sh` or set `JARVIS_PIXEL_IP` |
| 5 | (Optional) Voice on Pixel | Start voice node or use /voice in browser on Pixel |
| 6 | (Optional) Mac automation | Run gateway on Mac too and/or point autonomous scripts at Pixel gateway (see Mode 1 §4) |

**If Mac is your main JARVIS brain:**

| Step | Command / action |
|------|-------------------|
| 1 | Farm | `cd neural-farm && ./dev_farm.sh` (or --bg); optional install-farm-launchagent.js |
| 2 | Point JARVIS at farm | `node scripts/set-primary-neural-farm.js` |
| 3 | Gateway | `node scripts/start-gateway-with-vault.js` or background / LaunchAgent |
| 4 | Build + webhook | `node scripts/start-jarvis-services.js` (or install LaunchAgents) |
| 5 | Status | `node scripts/operation-status.js` |
| 6 | Team | Install CLIs, run `node scripts/ensure-team-ready.js` |
| 7 | Autonomous | add-plan-execute-cron.js, heartbeat in cron, ~/.jarvis/autonomous-goal.txt |
| 8 | Webhook | Webhook server 18791 + GitHub webhook (see GITHUB_WEBHOOK_SETUP.md) |

---

## References

- **Start everything (Mac):** START_EVERYTHING.md, start-all.js, operation-status.js  
- **Team / pipeline:** JARVIS_OPTIMAL_TEAM_SETUP.md, ensure-team-ready.js, run-team-pipeline.js  
- **Autonomous:** OPERATION_NEXT.md, jarvis-autonomous-plan-execute.js, jarvis-autonomous-heartbeat.js  
- **Pixel:** PIXEL_WIFI_AUTOMATION.md, start-jarvis-pixel.sh, JARVIS_CHAT_FROM_MAC.md  
- **One-page map:** ONE_PAGE_MAP.md  

**Summary:** Max capacity = brain (Pixel or Mac) + all tools/team you want + automation (cron + webhook) + LaunchAgents/cron so it survives reboot. Use the checklist above for your chosen mode.
