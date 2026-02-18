# JARVIS Roadmap — Badassery & Windows / ROG Ed.

**Single source of truth for "cool badassery" and Windows polish.**  
Status: ✅ Done | 🚧 In progress | ⬜ Todo

**Full JARVIS roadmap (all tracks + 2026 ecosystem):** [docs/JARVIS_MASTER_ROADMAP.md](./docs/JARVIS_MASTER_ROADMAP.md)

See [JARVIS_BADASSERY.md](./JARVIS_BADASSERY.md) for full idea write-ups.

---

## Phase 1 — Doc & Prompt (No New Code)

| # | Item | Status | Notes |
|---|------|--------|--------|
| 1.1 | Document one-liners + workflow in JARVIS_ROG_ED / SOUL | ✅ Done | SOUL "Power-User Moves"; ROG_ED links to BADASSERY |
| 1.2 | Snippet → clipboard in AGENTS/SOUL | ✅ Done | SOUL: use expand_snippet with insertMode clipboard |
| 1.3 | Promote "Open anything" (file + app + URL) in SOUL/AGENTS | ✅ Done | SOUL: "Open anything" section; AGENTS: ROG Ed Windows updated |

---

## Phase 2 — Quick Wins (Small Code)

| # | Item | Status | Notes |
|---|------|--------|--------|
| 2.1 | **Daily brief** tool ("Good morning") | ✅ Done | Launcher: `daily_brief` → get_system_info + process_manager, formatted summary |
| 2.2 | **Quick notes** skill (remember / search notes) | ✅ Done | New skill: `quick_note_add`, `quick_note_search`, `quick_note_list` in `skills/quick-notes/` |
| 2.3 | **Emoji / symbol picker** tool | ✅ Done | Launcher: `insert_symbol` (lookup + optional copy to clipboard) |
| 2.4 | **Power plan** in get_system_info (Windows) | ✅ Done | Launcher: powercfg + GUID → Balanced / High performance / etc. |
| 2.5 | **Focus mode** (mute + Windows Focus Assist) | ✅ Done | Launcher: `focus_mode` on/off; mutes audio + Focus Assist |

---

## Phase 3 — Medium (New Skills / Deeper Integration)

| # | Item | Status | Notes |
|---|------|--------|--------|
| 3.1 | **Timers & reminders** | ✅ Done | New skill `skills/reminders/`: set_reminder, set_timer, list_reminders, cancel_reminder |
| 3.2 | **get_active_window** on Windows | ✅ Done | Launcher: `get_active_window` returns { app, title, pid } |
| 3.3 | **Pre-built "Make it so" workflows** | ✅ Done | Documented in `docs/PREBUILT_WORKFLOWS.md`: meeting, streaming, eod, focus, coding modes |
| 3.4 | **Clipboard history** Windows edges | ✅ Done | `clipboard-history` skill supports Windows (Get-Clipboard, clip); complements Win+V |

---

## Phase 4 — Polish & Stretch

| # | Item | Status | Notes |
|---|------|--------|--------|
| 4.1 | **Quick access tray app** (Win+J) | ✅ Done | `scripts/jarvis-quick-access.ps1` + setup guide in `docs/WIN_J_QUICK_ACCESS.md` |
| 4.2 | **Color picker** (cursor pixel → hex) | ✅ Done | Launcher: `color_picker` tool; returns hex + RGB, copies to clipboard |
| 4.3 | **Workspace save/restore** on Windows | ✅ Done | Window Manager: `workspace_save/restore` now works on Windows (saves/launches apps) |

---

## How to Use This Roadmap

- **Chipping away:** Pick the next ⬜ or 🚧 in Phase 2, then Phase 3. Update status here when done (✅).
- **Linking:** JARVIS_ROG_ED.md and JARVIS_WINDOWS_EPIC.md reference this roadmap and BADASSERY.
- **Priorities:** Phase 1–2 deliver the most "command center" feel with least code; Phase 3–4 are incremental polish.
