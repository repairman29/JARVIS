# JARVIS UI Roadmap

Phased plan to deliver the **developer-grade JARVIS chat UI** described in [JARVIS_UI_DEVELOPER_SPEC.md](./JARVIS_UI_DEVELOPER_SPEC.md). Use this roadmap to build or improve the web (or desktop) experience that talks to the Clawdbot gateway.

**Status:** ✅ Done | 🚧 In progress | ⬜ Todo

---

## Overview

| Phase | Focus | Outcome |
|-------|--------|---------|
| **1** | Foundation | Usable chat: composer, send, stream, one session, scrollable thread. |
| **2** | Readability & trust | Markdown/code, tool visibility, errors, reconnect. |
| **3** | Context & power | Skills list, settings, optional slash commands. |
| **4** | Polish | Keyboard, a11y, themes, export, global shortcut. |

---

## Phase 1 — Foundation

*Goal: A developer can open the UI, type a message, get a streaming reply, and keep one conversation across reloads.*

| # | Item | Status | Notes |
|---|------|--------|--------|
| 1.1 | **Single composer** — One main input, always visible; focus on load | ⬜ | No hunting for “where do I type.” |
| 1.2 | **Send on Enter** (Shift+Enter = newline) | ⬜ | Matches Slack/Discord/Cursor. |
| 1.3 | **Streaming replies** — Tokens appear as generated; optional “thinking” before first token | ⬜ | No “wait 30s then dump.” |
| 1.4 | **Clear turn boundaries** — User message → assistant message in thread | ⬜ | Optional later: show tool steps inline/collapsible. |
| 1.5 | **One persistent session** — Same conversation across reloads/tabs; session ID from gateway or stored in UI | ⬜ | “I asked about repo index last time; JARVIS still has context.” |
| 1.6 | **Session survives gateway restart** — Reconnect to same session by ID after gateway comes back | ⬜ | Depends on gateway session API. |
| 1.7 | **Full scrollable history** — Entire thread in one view; no “last N only” | ⬜ | |
| 1.8 | **Scroll to bottom on new content**; optional “stick to bottom” vs “freeze” when user has scrolled up | ⬜ | |
| 1.9 | **Stable message identity** — No jump/reflow when new content streams in | ⬜ | |

**Phase 1 done when:** Developer can chat, see streaming replies, reload and keep the same thread.

---

## Phase 2 — Readability & Trust

*Goal: Replies are readable (markdown, code), tool use is visible, errors are clear, and the UI reconnects gracefully.*

| # | Item | Status | Notes |
|---|------|--------|--------|
| 2.1 | **Multi-line input** — Paste stack traces, JSON, paragraphs without truncation or escaping | ⬜ | |
| 2.2 | **No low character limit** in UI; if gateway limits, show “Prompt trimmed to N chars” | ⬜ | |
| 2.3 | **Full markdown rendering** — Headings, lists, bold/italic, links, blockquotes | ⬜ | |
| 2.4 | **Code blocks** — Syntax highlighting by language; monospace; optional copy button | ⬜ | |
| 2.5 | **Inline code** — Backticks as monospace | ⬜ | |
| 2.6 | **Tool/skill visibility** — Show when JARVIS used a skill (e.g. “Used: launcher”; collapsible or chip) | ⬜ | | Depends on gateway exposing tool calls in response. |
| 2.7 | **Structured tool output** — Render lists/tables/expandable when gateway returns structured results | ⬜ | |
| 2.8 | **Clear error states** — “Gateway unreachable,” “Session expired,” “Rate limited,” “Context too long” with short copy | ⬜ | |
| 2.9 | **Retry** — “Retry” / “Send again” for transient errors so user doesn’t re-paste | ⬜ | |
| 2.10 | **Reconnect gracefully** — “Reconnecting…” then “Back” when gateway restarts or network blips | ⬜ | |

**Phase 2 done when:** Reading replies and debugging “what did JARVIS run?” is easy; failures are obvious and recoverable.

---

## Phase 3 — Context & Power

*Goal: Developer knows what JARVIS can do, can change settings, and (optionally) use slash commands.*

| # | Item | Status | Notes |
|---|------|--------|--------|
| 3.1 | **Discoverable skills** — Sidebar, `/tools`, or “?” to list loaded skills (name + one-line description) | ⬜ | Requires gateway API to list skills or config. |
| 3.2 | **Session/identity hint** — Show active session name and “Gateway: local” (or URL) in header/sidebar | ⬜ | |
| 3.3 | **Default view: just chat** — No mandatory dashboard; optional minimal header (title, session, Settings) | ⬜ | |
| 3.4 | **Settings screen/modal** — Gateway URL, session ID, any UI config out of main thread | ⬜ | |
| 3.5 | **Slash commands (optional)** — e.g. `/session main`, `/clear`, `/tools` | ⬜ | Post–foundation; makes UI feel like a dev tool. |

**Phase 3 done when:** Developer can see what’s loaded and tweak config without leaving the chat.

---

## Phase 4 — Polish

*Goal: Keyboard-first, accessible, themeable, and optionally export/shortcut.*

| # | Item | Status | Notes |
|---|------|--------|--------|
| 4.1 | **Keyboard-first** — Focus in composer by default; Tab to move; Escape to clear/close modals | ⬜ | |
| 4.2 | **Accessibility** — Semantic HTML, ARIA where needed; reduced motion; screen reader can read messages and “JARVIS is typing” | ⬜ | |
| 4.3 | **Input stays responsive** — No lag while streaming | ⬜ | |
| 4.4 | **Themes** — Light / dark / system; default = OS preference | ⬜ | |
| 4.5 | **Export** — Copy thread as markdown or “Save transcript” for session | ⬜ | |
| 4.6 | **Global shortcut (optional)** — Win+J / Cmd+J to focus or show JARVIS window | ⬜ | May require desktop wrapper (e.g. Tauri/Electron) for true global. |
| 4.7 | **Multiple sessions (optional)** — Switch/start “work”, “quick”; simple switcher | ⬜ | |
| 4.8 | **CLI parity (optional)** — If gateway supports “run and return,” UI “Run and copy result” | ⬜ | |

**Phase 4 done when:** The UI feels fast, predictable, and respectful of privacy (local gateway; no sneaky telemetry).

---

## Dependencies & Notes

- **Gateway API** — Roadmap assumes the Clawdbot gateway exposes HTTP endpoints for: send message, stream response, session (create/attach/list?), optional skills list. If not, Phase 1–2 may require gateway changes or a thin adapter.
- **Where to build** — UI can live in this repo (e.g. `apps/jarvis-ui/`) as a custom client, or as contributions to the Clawdbot project’s built-in web UI. See [JARVIS_UI_DEVELOPER_SPEC.md](./JARVIS_UI_DEVELOPER_SPEC.md) § “What this is not.”
- **Discord** — Out of scope for this roadmap; separate track if desired.

---

## How to Use This Roadmap

- **Implementing:** Start with Phase 1; mark items 🚧 as you work, ✅ when done. Phase 2 can overlap with Phase 1 (e.g. markdown while you finish streaming).
- **Priorities:** Phase 1–2 deliver the “must-have” bar from the spec; Phase 3–4 are incremental.
- **Linking:** Reference this doc from README, DEVELOPER_GUIDE, or REPO_INDEX when pointing contributors at “JARVIS UI work.”
