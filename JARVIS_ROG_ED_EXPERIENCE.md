# JARVIS ROG Ed. — Experience & Development

This doc is about **what JARVIS can actually deliver** on the ROG Ally with the modules and setup we have, and where we’ve spent (or should spend) cycles to get the experience we want.

---

## What We’ve Spent Cycles On

| Area | What we did | Status |
|------|-------------|--------|
| **Personality** | IDENTITY.md, SOUL.md, USER.md, HEARTBEAT.md in `jarvis/` | ✅ Loaded with workspace; agent has voice and boundaries |
| **Workspace** | `agents.defaults.workspace` → `jarvis/`; bootstrap files in place | ✅ Gateway uses this workspace |
| **Skills on disk** | Copied Launcher, Calculator, File search, Clipboard, Performance, Snippets, Window manager, Workflow, Skill marketplace, Voice into `jarvis/skills/` | ✅ Files in place |
| **Skills loading** | `skills.load.extraDirs` in config → `jarvis/skills` + repo `skills/` | ✅ Gateway should load these dirs after restart |
| **Agent instructions** | AGENTS.md (call tools when available, Kroger, Discord reply); TOOLS.md (full tool list) | ✅ Agent is told to use tools and has a map of them |
| **Reliability** | Model fallback (Groq 8B), auto-start task, Discord setup guide | ✅ Better uptime and next steps documented |
| **Docs** | JARVIS_ROG_ED.md, ROG_ALLY_SETUP.md, DISCORD_ROG_ED.md, elevation roadmap | ✅ Single place for “what it can do” and setup |

So we *have* spent cycles on: **personality, workspace, skill files, config so skills load, agent instructions, and docs.** That’s the right structure for “JARVIS that knows who he is and what tools he has.”

---

## What Actually Delivers Today (ROG Ally / Windows)

| Experience | How it works today |
|------------|---------------------|
| **Chat & reasoning** | LLM only; no tools required. Works. |
| **Math / units / quick answers** | LLM can do arithmetic and conversions in text. Works. |
| **“What can you do?” / tool-style asks** | Agent may try to call tools. If the gateway exposes skills (after config + restart), some tools will run; others will fail on Windows (see below). |
| **Calculator skill** | Pure Node/math; no OS-specific code in the parts we checked. **Should work on Windows** once the skill is loaded. |
| **Launcher skill** | **Windows support added:** `launch_app`, `quit_app`, `list_running_apps`, `open_url`, `process_manager`, `get_system_info`, `screenshot` (fullscreen), `system_control` (lock, sleep). Volume/brightness/Wi‑Fi etc. still report "not yet implemented on Windows". **Use these on ROG Ally:** launch Chrome, open URL, take screenshot, lock, sleep, list/kill processes, system info. |
| **quick_calc (inside Launcher)** | Implemented in JS (eval, regex); no shell for basic math. **Works on Windows** for expressions the skill handles. |
| **File search, Clipboard, Performance, etc.** | Not fully audited; may mix Node and shell. Assume “test on Windows” before promising. |

So:

- **We have** a coherent “JARVIS” setup: personality, workspace, tools list, and config so the gateway can load our skills.
- **We have not** yet spent cycles making Launcher (and possibly others) *deliver* on Windows. The experience we want (“Launch Chrome”, “Take a screenshot”, “Open github.com”) is **partially built**: the agent knows about these tools and the gateway can load them, but the **implementation** is macOS-oriented and will fail on the Ally until we add Windows support.

---

## Have We Developed Him to Deliver the Experience We Want?

**Short answer:**

- **For “JARVIS that chats, reasons, and has a clear identity”** — **yes.** Personality, workspace, and instructions are in place; the agent can use the workspace and, once skills load, can be told to use tools.
- **For “JARVIS that actually launches apps, takes screenshots, and opens URLs on the ROG Ally”** — **not yet.** The modules and setup are there; the **Launcher (and possibly other) implementations** need Windows-specific code paths before those experiences work.

So we’ve developed him **to the point where the experience is “right” in terms of design and config**, but **not yet to the point where every promised action works on Windows**.

---

## What Would Close the Gap

1. **Restart the gateway** after the new `skills.load.extraDirs` config so it loads `jarvis/skills` and repo `skills/`. Then **test** which tools the agent actually gets (e.g. “What’s 15% of 240?” vs “Launch Chrome”) and note what fails.
2. **Add Windows support to Launcher** (or a thin ROG Ed. launcher) for the actions we care about most:
   - **Launch app:** e.g. `Start-Process "Chrome"` or by name/path.
   - **Open URL:** e.g. `Start-Process "https://..."` or `rundll32 url.dll,FileProtocolHandler`.
   - **Screenshot:** e.g. PowerShell + .NET or a small Node helper.
   - **System control:** volume/brightness via PowerShell or Win32/APIs where needed.
   - **Process list/kill:** `tasklist` / `taskkill` or WMI.
3. **Tighten AGENTS.md / TOOLS.md for ROG Ed.** so the agent:
   - Prefers tools that work on Windows (e.g. Calculator, quick_calc).
   - When a tool fails with “not supported on Windows”, says so briefly and offers a text or manual alternative.
4. **Audit other skills** (File search, Clipboard, Performance monitor) for macOS-only commands and add Windows paths or document “ROG Ed.: works / doesn’t work” in this file.

---

## Summary

- **Modules/setup:** We’ve spent cycles on personality, workspace, skill files, skill loading config, agent instructions, and docs. That *is* developing JARVIS toward the experience we want.
- **Runtime experience:** Chat and math work. Tool-backed actions that depend on Launcher (launch app, screenshot, open URL, system control, process list) **won’t** work on the Ally until we add Windows implementations.
- **Next step:** Restart gateway (to load skills), test which tools run, then add Windows support to Launcher (or document “coming on Windows”) and keep this file updated as we close gaps.
