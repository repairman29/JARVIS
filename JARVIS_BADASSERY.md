# JARVIS — Cool Badassery Ideas

**Ways to make JARVIS feel more like a command center and less like “just a chatbot.”**  
Mix of quick wins (extend existing skills), ROG Ally–specific tricks, and stretch goals. Pick what excites you.

---

## 1. One-Liner Super Commands (You Already Have This)

**Idea:** One sentence = multiple actions. The agent can chain tools.

| Say / type | What happens |
|------------|----------------|
| *"Screenshot, save to Desktop, and copy the path"* | Launcher screenshot → file-search or launcher writes path → copy to clipboard |
| *"Open Chrome and GitHub, then snap Chrome left"* | launch_app Chrome → open_url github.com → snap_window left_half |
| *"What’s using the most RAM, and kill the top one"* | process_manager list → process_manager kill |
| *"Good morning: battery, top 3 processes, and today’s date"* | get_system_info + process_manager + quick_calc or chat for date |

**How:** Use natural language; the LLM will call Launcher, Window Manager, File Search, Performance Monitor, etc. in one turn. For repeatable combos, use **workflow-automation** (`create_workflow` + `execute_workflow`).

---

## 2. Named Workspaces (Already There — Use Them)

**Idea:** Save and restore window layouts by name. “Streaming,” “Coding,” “End of day.”

| Say | Tool | What happens |
|-----|------|----------------|
| *"Save this layout as streaming"* | `window_manager` → `workspace_save` | Saves current windows + positions (macOS today; Windows could use snap state) |
| *"Restore my streaming layout"* | `workspace_restore` | Brings back that layout |

**Badassery:** On Windows, combine with **snap_window** (Win+Arrow) before saving so the “layout” is at least “these apps are open and snapped.” Promote this in SOUL.md or USER.md so JARVIS suggests it.

---

## 3. Daily Brief (“Good Morning”)

**Idea:** First message of the day (or “Good morning”) returns: time, battery, RAM/CPU summary, top 3 processes, optional one-line weather.

| Source | How |
|--------|-----|
| Time | Chat or `quick_calc` / system |
| Battery / system | `launcher` → `get_system_info` (Windows already supported) |
| Top processes | `launcher` → `process_manager` with limit 3 |
| Weather | Optional: new small skill or “search the web” for “weather [city]” |

**Implementation:** Add a single tool like `daily_brief` in Launcher or a tiny “brief” skill that calls get_system_info + process_manager and formats one message. Or just document the prompt: *“Good morning — give me time, battery, and top 3 processes.”*

---

## 4. Quick Note / Scratchpad (“Remember This”)

**Idea:** “Remember: buy milk” / “What did I note about the project?” — persistent scratchpad JARVIS can read and write.

| Say | Behavior |
|-----|----------|
| *"Remember: call Mom tomorrow"* | Append to `~/.jarvis/notes.md` (or similar) with optional date/tag |
| *"What did I note about X?"* | Search notes and return matching lines or bullets |
| *"List my notes from this week"* | Filter by date |

**Implementation:** New small skill (e.g. `skills/quick-notes/`) with tools: `quick_note_add`, `quick_note_search`, `quick_note_list`. Single file or SQLite; no backend required. Very Raycast-like.

---

## 5. Timers & Reminders

**Idea:** “Set a 5 minute timer” / “Remind me at 3pm to stand up.”

| Option | How |
|--------|-----|
| **In-process** | Agent sets a timer in the gateway (setTimeout / setInterval); when it fires, use `sessions_send` or store “pending reminder” and show in next user message. Requires gateway to stay running and some state. |
| **Windows Task Scheduler** | “Remind me in 20 minutes” → create a one-off task that runs a script (e.g. show toast, or open dashboard with a message). More reliable across restarts. |

**Implementation:** New skill `reminders` with `set_reminder` (natural language time + message). Parse “in 20 min” / “at 3pm” with LLM or a small parser; create scheduled task on Windows or in-memory timer.

---

## 6. Snippets → Clipboard (“Insert Signature”)

**Idea:** “Insert my email signature” → expand snippet and put it on the clipboard so the user can paste anywhere (Discord, browser, Outlook).

**Already supported:** Snippets skill has `expand_snippet` with `insertMode: "clipboard"`. So the badassery is **teaching the agent** to use it: in AGENTS.md or SOUL.md, add: “When the user says ‘insert signature’ or ‘paste my X snippet’, use expand_snippet with insertMode clipboard and confirm ‘Copied to clipboard; paste with Ctrl+V.’” No new code.

---

## 7. Emoji & Symbol Picker

**Idea:** “Insert shrug” / “emoji thumbs up” / “sigma” → JARVIS returns (and optionally copies) the character(s).

| Trigger | Output |
|---------|--------|
| shrug | ¯\\\_(ツ)\_/¯ |
| thumbs up | 👍 |
| sigma | Σ |
| bullet | • |

**Implementation:** Tiny skill or a single tool in Launcher: lookup table (trigger → text) + optional “copy to clipboard” (reuse launcher/system clipboard or file-search copy_path pattern). Great for Discord/chat from phone.

---

## 8. ROG Ally–Specific: Battery & Power Mode

**Idea:** “What’s my battery and power mode?” — battery %, time remaining, and (if possible) Silent / Performance / Turbo.

| Data | How (Windows) |
|------|----------------|
| Battery % / status | Already in `get_system_info` (WMI) on Launcher |
| Power plan / mode | PowerShell: `powercfg /getactivescheme` or query Armoury Crate / ASUS APIs if available |

**Badassery:** Expose in one reply: “Battery 73%, plugged in. Active power plan: Balanced.” If we can map GUID to “Performance” or “Turbo,” even better. Could live in Launcher or Performance Monitor.

---

## 9. Focus Mode / Do Not Disturb

**Idea:** “Turn on focus mode” = mute volume + (optional) enable Windows Focus Assist.

| Action | How (Windows) |
|--------|----------------|
| Mute | Launcher `system_control` → volume_mute (already there) |
| Focus Assist | PowerShell: enable “Priority only” or “Alarms only” via registry or Settings API |

**Implementation:** New tool in Launcher (e.g. `focus_mode` on/off) or a tiny workflow: volume_mute + optional PowerShell for Focus Assist. Revert on “Turn off focus mode.”

---

## 10. “What’s the Front Window?” (Active Window on Windows)

**Idea:** “What app is in front?” / “Search the web for [current window title]” — get active window title on Windows, then e.g. open_url with that as query.

**Implementation:** Windows: PowerShell + .NET (UI Automation) or a small script that reads the foreground window title. Add `get_active_window` to Launcher or Window Manager (Windows path); return `{ app, title }`. Then the agent can say “The front window is Cursor – JARVIS” or “Searching for ‘JARVIS_BADASSERY.md’…” and call open_url.

---

## 11. Pre-Built “Make It So” Workflows

**Idea:** One phrase = full routine. Use **workflow-automation** (`create_workflow` + `execute_workflow`).

| Phrase | Steps (example) |
|--------|-------------------|
| *“Meeting mode”* | Mute volume, enable Focus Assist, open calendar or Teams |
| *“Streaming setup”* | Open OBS/browser, snap browser right, open screenshot folder |
| *“End of day”* | Save workspace “eod”, close Chrome, mute, optional lock in 2 min |

**Implementation:** Create these once via `create_workflow` (or workflow_templates). Document in JARVIS_ROG_ED.md: “Say ‘Execute meeting mode workflow’ or add a short alias in SOUL.”

---

## 12. Quick Access Tray App (Optional)

**Idea:** Small app in the system tray that opens the JARVIS dashboard on **Win+J** (or a click) so you don’t need PowerToys.

**Implementation:** Tiny Electron or Node + `node-notifier` / tray icon; on hotkey or click, open `http://127.0.0.1:18789/` in default browser or in a minimal window. Optional: “Focus” button that sends a message to the gateway to prep for input. More polish than necessity (shortcut + bookmark already work).

---

## 13. Color Picker (Stretch)

**Idea:** “What color is under the cursor?” → screenshot a small region around cursor, return hex/rgb.

**Implementation:** Windows: PowerShell + .NET (cursor position + screen pixel read) or a small helper exe. Niche but very “power user.”

---

## 14. Clipboard History on Windows (Finish the Edges)

**Idea:** “Show clipboard history” / “Paste item 3” — clipboard-history skill already has Windows branches for get/set clipboard. Ensure **monitoring** (so every copy is logged) and **paste_clipboard_item** work on Windows; document any gaps (e.g. “history is JARVIS-tracked only, not Win+V”).

---

## 15. Natural Language “Open Anything”

**Idea:** One box: app name, file path, URL, or “search for X.” Already what the gateway does: user says “Open Chrome” or “Open the budget spreadsheet” or “Open github.com” — the agent picks launch_app, file_operations open, or open_url. **Badassery:** Make sure FILE_SEARCH + LAUNCHER + OPEN_URL are all in the same workspace and promoted in SOUL/AGENTS so JARVIS confidently mixes them (e.g. “Open the Jenkins doc” → file search → open first result).

---

## Priority Order (If You Want to Ship Fast)

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | Document one-liners + workflow in JARVIS_ROG_ED / SOUL | Low | High |
| 2 | Snippet → clipboard in AGENTS/SOUL | Low | Medium |
| 3 | Quick notes skill (remember / what did I note) | Medium | High |
| 4 | Daily brief tool or prompt | Low–Medium | High |
| 5 | ROG battery + power plan in get_system_info or perf monitor | Low | Medium (Ally) |
| 6 | Timers/reminders (Task Scheduler or in-process) | Medium | High |
| 7 | Emoji/symbol picker tool | Low | Medium |
| 8 | Focus mode (mute + Focus Assist) | Low | Medium |
| 9 | get_active_window on Windows | Medium | High (magic) |
| 10 | Tray app Win+J | Medium | Polish |

Use this doc as a backlog: pick 2–3, implement, then add the next. The “coolest” feel often comes from **one-liners + quick notes + daily brief** with no new infra — just prompts and one small skill.
