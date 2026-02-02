# JARVIS UI Roadmap

Phased plan to deliver the **developer-grade JARVIS chat UI** described in [JARVIS_UI_DEVELOPER_SPEC.md](./JARVIS_UI_DEVELOPER_SPEC.md). Use this roadmap to build or improve the web (or desktop) experience that talks to the Clawdbot gateway.

**Status:** ✅ Done | 🟡 Partial | 🚧 In progress | ⬜ Todo

**Audit:** [JARVIS_UI_AUDIT.md](./JARVIS_UI_AUDIT.md) maps each item to the code (what’s built vs gap). Use it before implementing so we don’t redo work.

---

## Overview

| Phase | Focus | Outcome |
|-------|--------|---------|
| **1** | Foundation | Usable chat: composer, send, stream, one session, scrollable thread. |
| **2** | Readability & trust | Markdown/code, tool visibility, errors, reconnect. (Many done; see audit.) |
| **3** | Context & power | Skills list, settings, optional slash commands. (3.2, 3.3 done.) |
| **4** | Polish | Keyboard, a11y, themes, export, global shortcut. (4.3, 4.4 done.) |

---

## Phase 1 — Foundation

*Goal: A developer can open the UI, type a message, get a streaming reply, and keep one conversation across reloads.*

| # | Item | Status | Notes |
|---|------|--------|--------|
| 1.1 | **Single composer** — One main input, always visible; focus on load | ✅ Done | Composer focused on mount. |
| 1.2 | **Send on Enter** (Shift+Enter = newline) | ✅ Done | Matches Slack/Discord/Cursor. |
| 1.3 | **Streaming replies** — Tokens appear as generated; optional "thinking" before first token | ✅ Done | SSE stream + "Thinking…" before first token. |
| 1.4 | **Clear turn boundaries** — User message → assistant message in thread | ✅ Done | Optional later: show tool steps inline/collapsible. |
| 1.5 | **One persistent session** — Same conversation across reloads/tabs; session ID from gateway or stored in UI | ✅ Done | sessionId in localStorage; sent with each request. |
| 1.6 | **Session survives gateway restart** — Reconnect to same session by ID after gateway comes back | ✅ Done | UI sends sessionId; gateway reattach is gateway-side. |
| 1.7 | **Full scrollable history** — Entire thread in one view; no "last N only" | ✅ Done | |
| 1.8 | **Scroll to bottom on new content**; optional "stick to bottom" vs "freeze" when user has scrolled up | ✅ Done | Auto-scroll on new content; stick/freeze optional later. |
| 1.9 | **Stable message identity** — No jump/reflow when new content streams in | ✅ Done | Streaming in separate node; completed messages have stable ids. |

**Phase 1 done when:** Developer can chat, see streaming replies, reload and keep the same thread.

---

## Phase 2 — Readability & Trust

*Goal: Replies are readable (markdown, code), tool use is visible, errors are clear, and the UI reconnects gracefully.*

| # | Item | Status | Notes |
|---|------|--------|--------|
| 2.1 | **Multi-line input** — Paste stack traces, JSON, paragraphs without truncation or escaping | ✅ Done | Composer textarea, resize to 200px. |
| 2.2 | **No low character limit** in UI; if gateway limits, show "Prompt trimmed to N chars" | ✅ Done | UI has no limit; shows "Prompt trimmed to N characters" when API returns meta.prompt_trimmed_to (gateway/edge may add later). |
| 2.3 | **Full markdown rendering** — Headings, lists, bold/italic, links, blockquotes | ✅ Done | Message.tsx: ReactMarkdown + remarkGfm; globals.css .markdown-body. |
| 2.4 | **Code blocks** — Syntax highlighting by language; monospace; optional copy button | ✅ Done | rehype-highlight + PreWithCopy in Message.tsx; copy button on code blocks. |
| 2.5 | **Inline code** — Backticks as monospace | ✅ Done | .markdown-body code in globals.css. |
| 2.6 | **Tool/skill visibility** — Show when JARVIS used a skill (e.g. "Used: launcher"; collapsible or chip) | ⬜ | Depends on gateway exposing tool calls in response. |
| 2.7 | **Structured tool output** — Render lists/tables/expandable when gateway returns structured results | ⬜ | |
| 2.8 | **Clear error states** — "Gateway unreachable," "Session expired," "Rate limited," "Context too long" with short copy | ✅ Done | Error banner + gatewayHint; Reconnect/Dismiss. |
| 2.9 | **Retry** — "Retry" / "Send again" for transient errors so user doesn't re-paste | ✅ Done | Reconnect/Dismiss on error banner; Recheck in header. |
| 2.10 | **Reconnect gracefully** — "Reconnecting…" then "Back" when gateway restarts or network blips | ✅ Done | Status shows "Reconnecting…" when connecting; "Edge" / "Gateway: local" when ok. |

**Phase 2 done when:** Reading replies and debugging “what did JARVIS run?” is easy; failures are obvious and recoverable.

---

## Phase 3 — Context & Power

*Goal: Developer knows what JARVIS can do, can change settings, and (optionally) use slash commands.*

| # | Item | Status | Notes |
| 3.1 | **Discoverable skills** — Sidebar, `/tools`, or "?" to list loaded skills (name + one-line description) | ✅ Done | Skills panel (header + /tools); stub list; gateway API can replace later. |
| 3.2 | **Session/identity hint** — Show active session name and "Gateway: local" (or URL) in header/sidebar | ✅ Done | Header: Gateway: local / Edge; empty state Session: {id}…. |
| 3.3 | **Default view: just chat** — No mandatory dashboard; optional minimal header (title, session, Settings) | ✅ Done | Single chat view; minimal header. |
| 3.4 | **Settings screen/modal** — Gateway URL, session ID, any UI config out of main thread | ✅ Done | Settings modal: session ID (copy), backend mode, gateway display; /api/config. |
| 3.5 | **Slash commands (optional)** — e.g. `/session main`, `/clear`, `/tools` | ✅ Done | Composer: /clear, /session name, /tools; hint in composer footer. |

**Phase 3 done when:** Developer can see what’s loaded and tweak config without leaving the chat.

---

## Phase 4 — Polish

*Goal: Keyboard-first, accessible, themeable, and optionally export/shortcut.*

| 4.1 | **Keyboard-first** — Focus in composer by default; Tab to move; Escape to clear/close modals | ✅ Done | Focus on load; Escape clears composer; Tab trap + Escape close in Settings/Skills modals. |
| 4.2 | **Accessibility** — Semantic HTML, ARIA where needed; reduced motion; screen reader can read messages and "JARVIS is typing" | ✅ Done | aria-live region for "JARVIS is typing"; sr-only. |
| 4.3 | **Input stays responsive** — No lag while streaming | ✅ Done | Composer not blocked for typing; only submit disabled when loading. |
| 4.4 | **Themes** — Light / dark / system; default = OS preference | ✅ Done | globals.css :root + @media (prefers-color-scheme: light). |
| 4.5 | **Export** — Copy thread as markdown or "Save transcript" for session | ✅ Done | Header: "Copy thread" and "Save transcript" (.md download) when messages exist. |
| 4.6 | **Global shortcut (optional)** — Win+J / Cmd+J to focus or show JARVIS window | ✅ Done | Cmd+J / Ctrl+J focuses composer when tab has focus (browser-only; true global needs desktop wrapper). |
| 4.7 | **Multiple sessions (optional)** — Switch/start "work", "quick"; simple switcher | ✅ Done | Session dropdown in header: current + list, "New session", switch clears thread. |
| 4.8 | **CLI parity (optional)** — If gateway supports "run and return," UI "Run and copy result" | ⬜ | Contract in [JARVIS_UI_GATEWAY_CONTRACT.md](./JARVIS_UI_GATEWAY_CONTRACT.md); UI control when gateway supports. |

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
