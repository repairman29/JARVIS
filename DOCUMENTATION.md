# JARVIS Project — Documentation Index

This document is the **single index** for all project documentation. Use it to find setup guides, ROG Ed.–specific docs, skills, and release prep.

---

## Quick links by role

| If you want to… | Start here |
|-----------------|------------|
| **Run JARVIS on ASUS ROG Ally** | [JARVIS_ROG_ED.md](JARVIS_ROG_ED.md) → [ROG_ALLY_SETUP.md](ROG_ALLY_SETUP.md) |
| **Run JARVIS on Windows (any PC)** | [ROG_ALLY_SETUP.md](ROG_ALLY_SETUP.md), [JARVIS_WINDOWS_EPIC.md](JARVIS_WINDOWS_EPIC.md) |
| **Add Discord / chat from phone** | [scripts/DISCORD_ROG_ED.md](scripts/DISCORD_ROG_ED.md) |
| **Add or manage skills** | [scripts/SKILLS_ROG_ED.md](scripts/SKILLS_ROG_ED.md) |
| **Understand roadmap and ideas** | [JARVIS_ROADMAP.md](JARVIS_ROADMAP.md), [JARVIS_BADASSERY.md](JARVIS_BADASSERY.md) |
| **Contribute or publish the ROG Ed. repo** | [CONTRIBUTING.md](CONTRIBUTING.md), [PUBLIC_REPO_CHECKLIST.md](PUBLIC_REPO_CHECKLIST.md) |

---

## 1. Core product docs

| Document | Description |
|----------|-------------|
| [README.md](README.md) | Main project README — conversational productivity, skills, ecosystem. |
| [JARVIS_ROG_ED.md](JARVIS_ROG_ED.md) | **ROG Ed. overview** — what it does, quick start, skills, paths, “what’s next.” |
| [ROG_ALLY_SETUP.md](ROG_ALLY_SETUP.md) | **Setup on ROG Ally (Windows)** — Node, config, gateway, Discord, local Ollama, VRAM, troubleshooting. |
| [JARVIS_WINDOWS_EPIC.md](JARVIS_WINDOWS_EPIC.md) | Make JARVIS feel like Raycast on Windows — quick access, commands, marketplace. |
| [JARVIS_ROG_ED_EXPERIENCE.md](JARVIS_ROG_ED_EXPERIENCE.md) | Experience and feature notes for ROG Ed. |

---

## 2. ROG Ed. scripts and guides

| Document | Description |
|----------|-------------|
| [scripts/DISCORD_ROG_ED.md](scripts/DISCORD_ROG_ED.md) | Short Discord setup for ROG Ed. — bot, token, invite, pair, troubleshooting. |
| [scripts/SKILLS_ROG_ED.md](scripts/SKILLS_ROG_ED.md) | Adding skills — extraDirs, entries, CLI, best practices, ClawHub, marketplace. |
| [DISCORD_SETUP.md](DISCORD_SETUP.md) | Full Discord setup (generic). |

**Scripts:**

| Script | Purpose |
|--------|---------|
| `scripts/start-jarvis-ally.bat` | Start gateway (interactive; double‑click or run from repo). |
| `scripts/start-jarvis-ally-background.bat` | Start gateway without pause (for Task Scheduler). |
| `scripts/add-jarvis-to-startup.ps1` | Add “JARVIS ROG Ed” scheduled task at logon. |
| `scripts/add-discord-alias.js` | Add Discord user ID as session alias so DMs work (run after enable-discord-dm-scope + one DM). |
| `scripts/enable-discord-dm-scope.js` | Set session.dmScope to per-channel-peer so Discord DM replies are delivered; see DISCORD_SETUP.md. |
| `scripts/create-jarvis-shortcut.ps1` | Create Desktop shortcut to web dashboard. |

---

## 3. Roadmap and ideas

| Document | Description |
|----------|-------------|
| [JARVIS_ROADMAP.md](JARVIS_ROADMAP.md) | Phases 1–4 — doc/prompt, quick wins, medium, polish. Status per item. |
| [JARVIS_BADASSERY.md](JARVIS_BADASSERY.md) | Ideas: one‑liners, workspaces, daily brief, quick notes, timers, snippets, etc. |

---

## 4. Workspace (jarvis/)

The **jarvis/** folder is the agent workspace: identity, soul, agents, tools, user, skills.

| Document | Description |
|----------|-------------|
| [jarvis/README.md](jarvis/README.md) | Workspace overview. |
| [jarvis/IDENTITY.md](jarvis/IDENTITY.md) | Name, voice, traits, ROG Ed. context. |
| [jarvis/SOUL.md](jarvis/SOUL.md) | Personality, power‑user moves, tool usage. |
| [jarvis/AGENTS.md](jarvis/AGENTS.md) | Agent instructions (default, Kroger, Discord DM, etc.). |
| [jarvis/TOOLS.md](jarvis/TOOLS.md) | Tool reference (often generated from skills). |
| [jarvis/USER.md](jarvis/USER.md) | User context (name, timezone, projects). |
| [jarvis/HEARTBEAT.md](jarvis/HEARTBEAT.md) | Optional periodic checklist. |

**Skills in workspace:** `jarvis/skills/` — Launcher, Calculator, File search, Clipboard, Snippets, Performance monitor, Skill marketplace, Voice, Window manager, Workflow automation. Same layout as root `skills/` where applicable.

---

## 5. Repo-wide skills (skills/)

| Path | Purpose |
|-----|---------|
| [skills/launcher/](skills/launcher/) | Launch app, open URL, screenshot, system info, process manager, lock/sleep, daily brief, insert symbol. |
| [skills/calculator/](skills/calculator/) | Math, units, currency, date/time. |
| [skills/file-search/](skills/file-search/) | Find files by name, content, date. |
| [skills/clipboard-history/](skills/clipboard-history/) | Recent clipboard items. |
| [skills/snippets/](skills/snippets/) | Text templates. |
| [skills/quick-notes/](skills/quick-notes/) | Remember/search notes. |
| [skills/performance-monitor/](skills/performance-monitor/) | CPU, memory, disk, cleanup. |
| [skills/skill-marketplace/](skills/skill-marketplace/) | Discover, install, manage skills. |
| [skills/window-manager/](skills/window-manager/) | Window layout, snap, workspaces. |
| [skills/workflow-automation/](skills/workflow-automation/) | Workflows. |
| [skills/voice-control/](skills/voice-control/) | Voice (experimental on Ally). |
| [skills/kroger/](skills/kroger/) | Kroger/King Soopers (OAuth). |

Each skill: `skill.json`, `index.js`, `README.md`, `SKILL.md`.

---

## 6. Other project docs

| Document | Description |
|----------|-------------|
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Full dev setup and development guide. |
| [RUNBOOK.md](RUNBOOK.md) | Day‑to‑day operations. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute (skills, code, docs). |
| [LICENSE](LICENSE) | MIT. |
| [.env.example](.env.example) | Example env vars (copy to `%USERPROFILE%\.clawdbot\.env`). |

---

## 7. Public repo and release

| Document | Description |
|----------|-------------|
| [README_ROG_ED.md](README_ROG_ED.md) | **README for the public “JARVIS ROG Ed.” repo** — use as main README when publishing. |
| [PUBLIC_REPO_CHECKLIST.md](PUBLIC_REPO_CHECKLIST.md) | Checklist to create and publish the Ally JARVIS ROG Ed. repo. |

---

## Paths (Windows / ROG Ed.)

| What | Path |
|------|------|
| Config | `%USERPROFILE%\.clawdbot\clawdbot.json` |
| Secrets | `%USERPROFILE%\.clawdbot\.env` |
| Logs | `%USERPROFILE%\.clawdbot\logs\` |
| Start script | `scripts\start-jarvis-ally.bat` (run from repo root) |

---

*Last updated for public JARVIS ROG Ed. release prep.*
