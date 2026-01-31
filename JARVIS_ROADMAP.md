# JARVIS Roadmap — Badassery & Windows / ROG Ed.

**Single source of truth for “cool badassery” and Windows polish.**  
Status: ✅ Done | 🚧 In progress | ⬜ Todo

See [JARVIS_BADASSERY.md](./JARVIS_BADASSERY.md) for full idea write-ups.

---

## Phase 1 — Doc & Prompt (No New Code)

| # | Item | Status | Notes |
|---|------|--------|--------|
| 1.1 | Document one-liners + workflow in JARVIS_ROG_ED / SOUL | ✅ Done | SOUL “Power-User Moves”; ROG_ED links to BADASSERY |
| 1.2 | Snippet → clipboard in AGENTS/SOUL | ✅ Done | SOUL: use expand_snippet with insertMode clipboard |
| 1.3 | Promote “Open anything” (file + app + URL) in SOUL/AGENTS | ⬜ Todo | One line: prefer file_search + launch + open_url when user says “open X” |

---

## Phase 2 — Quick Wins (Small Code)

| # | Item | Status | Notes |
|---|------|--------|--------|
| 2.1 | **Daily brief** tool (“Good morning”) | ✅ Done | Launcher: `daily_brief` → get_system_info + process_manager, formatted summary |
| 2.2 | **Quick notes** skill (remember / search notes) | ✅ Done | New skill: `quick_note_add`, `quick_note_search`, `quick_note_list` in `skills/quick-notes/` |
| 2.3 | **Emoji / symbol picker** tool | ✅ Done | Launcher: `insert_symbol` (lookup + optional copy to clipboard) |
| 2.4 | **Power plan** in get_system_info (Windows) | ✅ Done | Launcher: powercfg + GUID → Balanced / High performance / etc. |
| 2.5 | **Focus mode** (mute + Windows Focus Assist) | ⬜ Todo | Launcher: `focus_mode` on/off or document workflow |

---

## Phase 3 — Medium (New Skills / Deeper Integration)

| # | Item | Status | Notes |
|---|------|--------|--------|
| 3.1 | **Timers & reminders** | ⬜ Todo | New skill or Launcher tool: “in 20 min” / “at 3pm” → Task Scheduler or in-process |
| 3.2 | **get_active_window** on Windows | ⬜ Todo | Launcher or Window Manager: PowerShell/UI Automation → { app, title } |
| 3.3 | **Pre-built “Make it so” workflows** | ⬜ Todo | Create meeting/streaming/eod workflows; document in ROG_ED |
| 3.4 | **Clipboard history** Windows edges | ⬜ Todo | Verify monitoring + paste on Windows; document JARVIS vs Win+V |

---

## Phase 4 — Polish & Stretch

| # | Item | Status | Notes |
|---|------|--------|--------|
| 4.1 | **Quick access tray app** (Win+J) | ⬜ Todo | Optional: tray icon + hotkey opens dashboard |
| 4.2 | **Color picker** (cursor pixel → hex) | ⬜ Todo | Stretch: PowerShell + .NET or helper exe |
| 4.3 | **Workspace save/restore** on Windows | ⬜ Todo | Window Manager: workspace_save/restore with Win snap state or app list only |

---

## How to Use This Roadmap

- **Chipping away:** Pick the next ⬜ or 🚧 in Phase 2, then Phase 3. Update status here when done (✅).
- **Linking:** JARVIS_ROG_ED.md and JARVIS_WINDOWS_EPIC.md reference this roadmap and BADASSERY.
- **Priorities:** Phase 1–2 deliver the most “command center” feel with least code; Phase 3–4 are incremental polish.
