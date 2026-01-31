# Make JARVIS Epic on Windows

Think **Raycast**, **PowerToys Run**, or **marketplace launchers**—but **conversational**, **open source**, and **skill-based**. This doc is how to make JARVIS feel that good on Windows (ROG Ally, desktop, or laptop).

---

## Why JARVIS on Windows?

| vs | JARVIS | Raycast / PowerToys / etc. |
|----|--------|-----------------------------|
| **Input** | Natural language + chat | Keywords, shortcuts, extensions |
| **Brain** | Your LLM (Groq, OpenAI, etc.) + skills | Built-in actions + extensions |
| **Skills** | Open repo + [marketplace](https://repairman29.github.io/JARVIS/) | Curated store / community |
| **Where it runs** | Your machine (gateway + cloud LLM) | Local + optional cloud |
| **Channels** | Terminal, web UI, **Discord**, **Telegram** | App / overlay only |
| **Customization** | IDENTITY, SOUL, USER, workspace, skills | Themes, extensions |

**Epic combo:** One sentence does what others need multiple clicks or extensions for, and you can talk to JARVIS from your phone (Discord/Telegram) while the gateway runs on your PC.

---

## 1. Quick Access (Like Raycast’s Hotkey)

Get to JARVIS in one action:

| Method | How | Best for |
|--------|-----|----------|
| **Web dashboard** | Open **http://127.0.0.1:18789/** in your browser | Full UI, history, rich replies |
| **Desktop shortcut** | Run `scripts\create-jarvis-shortcut.ps1` → shortcut on Desktop opens dashboard | One click from Desktop |
| **Bookmark** | Bookmark **http://127.0.0.1:18789/** in your browser | Fast if browser is already open |
| **PowerToys (optional)** | If you already use PowerToys: add shortcut/URL to dashboard and bind **Win+J** | Global hotkey—only if you want it |
| **Discord / Telegram** | Add the bot and open a DM | Use from phone or another PC |

**Note:** You don't need PowerToys. If you already use **PowerToys**, set **Win + J** to “Open JARVIS” (e.g. run a shortcut or URL). Then JARVIS is one hotkey away, like Raycast’s Cmd+Space.

---

## 2. Top Commands That Feel “Epic”

These work on Windows once the gateway and [Launcher Windows support](JARVIS_ROG_ED_EXPERIENCE.md) are in place:

| Say / type | What happens |
|------------|----------------|
| **"Launch Chrome"** / **"Open notepad"** | Starts the app (Start-Process). |
| **"Open github.com"** / **"Open https://..."** | Opens URL in default browser. |
| **"Take a screenshot"** | Fullscreen capture → Desktop or clipboard. |
| **"Lock my screen"** / **"Put PC to sleep"** | Lock workstation or sleep. |
| **"What’s using the most RAM?"** / **"List running apps"** | Top processes by memory/CPU. |
| **"System info"** / **"Battery status"** | CPU, memory, disk, battery (WMI on Windows). |
| **"What’s 15% of 240?"** / **"Convert 5 miles to km"** | Calculator / quick_calc. |
| **"Show clipboard history"** | Recent clipboard items (clipboard-history skill; Windows supported where implemented). |
| **"Find files containing X"** | File search (file-search skill). |
| **"Insert my email signature"** | Snippets (snippets skill). |

**One-liner:** *"Open Chrome and GitHub, take a screenshot, and tell me what’s using the most memory"* — JARVIS can chain Launcher + system info and reply in one go.

---

## 3. Marketplace & Skills (Like Extensions)

JARVIS has a **skill marketplace** and **repo skills** you can install:

| Source | What you get |
|--------|----------------|
| **This repo** | Launcher, Calculator, File search, Clipboard, Snippets, Performance monitor, Window manager, Workflow, Skill marketplace, Voice (see `skills/`). |
| **Skill marketplace** | Use the **skill-marketplace** skill: *"Discover skills"*, *"Install GitHub integration"* (when available). Skills list platforms (e.g. `windows`). |
| **Premium / showcase** | [repairman29.github.io/JARVIS](https://repairman29.github.io/JARVIS/) — premium skills (Notion, GitHub++, Focus Pro, etc.). |

**To make it epic:** Install the skills you actually use (Launcher, Calculator, File search, Clipboard, Snippets are already in the workspace). Then use the marketplace skill to discover and install more (Spotify, GitHub, Weather, etc.) when they support Windows.

---

## 4. ROG Ally / Handheld

On **ROG Ally** (or similar Windows handheld):

- Use **cloud LLM** (e.g. Groq) so the device only runs the gateway. See [ROG_ALLY_SETUP.md](ROG_ALLY_SETUP.md) and [JARVIS_ROG_ED.md](JARVIS_ROG_ED.md).
- **Quick access:** Bookmark the dashboard or use Discord/Telegram on your phone to talk to JARVIS while the Ally runs the gateway.
- **Auto-start:** JARVIS can start at logon (Task Scheduler) so it’s always ready. See [JARVIS_ROG_ED.md](JARVIS_ROG_ED.md).

---

## 5. Roadmap: Even More “Epic” on Windows

| Area | Status | Next step |
|------|--------|-----------|
| **Launcher** | ✅ Windows: launch, quit, open URL, screenshot, lock, sleep, process list/kill, system info | Add volume/brightness (PowerShell/API or nircmd). |
| **Window manager** | ❌ macOS only today | Snap/move/workspace via Win32 or PowerShell (e.g. Win+Left/Right style). |
| **File search** | ⚠️ Open/reveal/copy path are macOS-only | Add Windows “open file”, “show in Explorer”, “copy path”. |
| **Clipboard history** | ⚠️ Partial Windows support | Finish Windows paths where still missing. |
| **Quick access** | ✅ Shortcut script + doc | Optional: small tray app that opens dashboard or sends “focus” to JARVIS. |
| **Marketplace** | ✅ Skill exists; mock/API | Point to real marketplace URL when available; filter by `windows` in platforms. |

---

## 6. Summary

- **Quick access:** Bookmark or shortcut to **http://127.0.0.1:18789/**; optionally **Win+J** via PowerToys.
- **Top commands:** Launch app, open URL, screenshot, lock/sleep, system info, calc, clipboard, file search, snippets—all documented above and in [JARVIS_ROG_ED.md](JARVIS_ROG_ED.md).
- **Marketplace:** Use **skill-marketplace** (discover/install) and repo **skills/**; premium at [repairman29.github.io/JARVIS](https://repairman29.github.io/JARVIS/).
- **Epic one-liner:** Combine actions in one sentence; use Discord/Telegram from your phone while the gateway runs on Windows.

Run **`scripts\create-jarvis-shortcut.ps1`** once to add a Desktop shortcut that opens the JARVIS dashboard.
