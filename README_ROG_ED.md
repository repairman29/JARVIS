# JARVIS ROG Ed.

**AI assistant tuned for the ASUS ROG Ally (Windows 11):** cloud-powered, no global install, and a clear set of skills that work great on the handheld. Chat from the device, from Discord, or from the web dashboard.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## What is JARVIS ROG Ed.?

JARVIS ROG Ed. is **JARVIS** — the open-source conversational productivity platform — configured and documented for the **ASUS ROG Ally**. It runs on Windows 11, uses a **cloud LLM** (e.g. Groq) by default so the Ally stays responsive, and includes skills optimized for handheld use: launcher, calculator, file search, clipboard, quick notes, performance monitor, and more.

- **No global install:** Run the gateway with `npx clawdbot gateway run` from this repo.
- **Chat anywhere:** Terminal, web UI at `http://127.0.0.1:18789/`, or Discord/Telegram.
- **Skills included:** Launcher (apps, URLs, screenshot, system info), Calculator, File search, Clipboard history, Snippets, Quick notes, Performance monitor, Skill marketplace.

---

## Quick start

### Prerequisites

- **Windows 11** (ROG Ally or any PC)
- **Node.js 18+** — [nodejs.org](https://nodejs.org) (LTS)
- **An LLM API key** — [Groq](https://console.groq.com) (free) recommended

### 1. Clone and enter the repo

```powershell
git clone https://github.com/YOUR_ORG/jarvis-rog-ed.git
cd jarvis-rog-ed
```

### 2. Config and secrets

Config lives in **`%USERPROFILE%\.clawdbot\`** (create if it doesn’t exist).

- Copy **`.env.example`** to **`%USERPROFILE%\.clawdbot\.env`** and set:
  - `CLAWDBOT_GATEWAY_TOKEN` — e.g. generate with `openssl rand -hex 32` (or any 32+ char string)
  - `GROQ_API_KEY` — from [Groq](https://console.groq.com)
- Optional: edit **`%USERPROFILE%\.clawdbot\clawdbot.json`** to set model and gateway mode (see [ROG_ALLY_SETUP.md](ROG_ALLY_SETUP.md)).

### 3. Start the gateway

Double-click **`scripts\start-jarvis-ally.bat`** or run:

```powershell
npx clawdbot gateway run
```

Leave this running. Then:

- **Web UI:** Open **http://127.0.0.1:18789/**
- **Terminal:** In another window:  
  `npx clawdbot agent --session-id "ally" --message "Hello JARVIS" --local`

---

## What JARVIS ROG Ed. can do

| Use | Example |
|-----|---------|
| **Chat & reasoning** | "Explain X in simple terms", "Draft a short email" |
| **Math & units** | "What's 15% of 240?", "Convert 5 miles to km" |
| **Launcher** | "Launch Chrome", "Open github.com", "Take a screenshot", "Good morning" (daily brief) |
| **Quick notes** | "Remember: buy milk", "What did I note about the project?" |
| **File search** | "Find PDFs from last week", "Search for 'API key' in my docs" |
| **Clipboard** | "Show clipboard history", "Paste item 3" |
| **Snippets** | "Insert my email signature" |
| **Performance** | "What's using the most RAM?", "Summarize system health" |

Skills are in **`jarvis/skills/`** and **`skills/`** and are loaded via the gateway config. See [scripts/SKILLS_ROG_ED.md](scripts/SKILLS_ROG_ED.md) for adding or managing skills.

---

## Discord (chat from your phone)

1. Create a bot in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Add **`DISCORD_BOT_TOKEN`** to **`%USERPROFILE%\.clawdbot\.env`**.
3. Invite the bot to your server and pair (first DM).
4. Full steps: [scripts/DISCORD_ROG_ED.md](scripts/DISCORD_ROG_ED.md).

---

## Auto-start (optional)

To start JARVIS when you log on:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\add-jarvis-to-startup.ps1
```

This creates a scheduled task **"JARVIS ROG Ed"**. To remove: Task Scheduler → delete the task.

---

## Local LLM (optional)

The Ally has 16 GB shared memory and an AMD RDNA 3 GPU. You can run **Ollama** with small models (e.g. 3B–7B) for offline or private use. See [ROG_ALLY_SETUP.md — Using the Ally's VRAM/GPU](ROG_ALLY_SETUP.md#using-the-allys-vram--gpu) and recommended models.

---

## Docs

| Doc | Description |
|-----|-------------|
| [JARVIS_ROG_ED.md](JARVIS_ROG_ED.md) | Full ROG Ed. overview, paths, “what’s next,” John Wick table. |
| [ROG_ALLY_SETUP.md](ROG_ALLY_SETUP.md) | Setup, config, Discord, local Ollama, VRAM, troubleshooting. |
| [scripts/DISCORD_ROG_ED.md](scripts/DISCORD_ROG_ED.md) | Short Discord setup. |
| [scripts/SKILLS_ROG_ED.md](scripts/SKILLS_ROG_ED.md) | Adding and managing skills. |
| [DOCUMENTATION.md](DOCUMENTATION.md) | Index of all project documentation. |

---

## Requirements

- Windows 11
- Node.js 18+
- An LLM API key (Groq, Together, OpenAI, Anthropic, or Ollama for local)

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). For ROG Ed.–specific changes (skills, Windows, Ally), open an issue or PR and mention “ROG Ed.” in the title.

---

## License

MIT — see [LICENSE](LICENSE).

---

## Credits

- **JARVIS** — [Clawdbot](https://clawd.bot) and the JARVIS ecosystem.
- **JARVIS ROG Ed.** — Tuned for ASUS ROG Ally and Windows handheld use.

*Precise. Reliable. Always on. No half measures.*
