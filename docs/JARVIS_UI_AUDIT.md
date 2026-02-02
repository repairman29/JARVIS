# JARVIS UI — Roadmap vs Code Audit

**Purpose:** Map [JARVIS_UI_ROADMAP.md](./JARVIS_UI_ROADMAP.md) to what’s actually built in `apps/jarvis-ui/`. Use this to avoid redoing work or marking todo what’s already done.

**Legend:** ✅ Done (in code) | 🟡 Partial | ⬜ Not done

---

## Phase 1 — Foundation

| # | Item | Status | Where in code |
|---|------|--------|----------------|
| 1.1 | Single composer, focus on load | ✅ | `Composer.tsx`: textarea, `useEffect` focus on mount |
| 1.2 | Send on Enter, Shift+Enter newline | ✅ | `Composer.tsx`: keydown Enter → submit, textarea multi-line |
| 1.3 | Streaming replies, "Thinking…" before first token | ✅ | `Chat.tsx`: SSE parse, `streamingContent`, `isLoading` → "Thinking…" |
| 1.4 | Clear turn boundaries | ✅ | `Chat.tsx`: user msg then assistant msg in thread |
| 1.5 | One persistent session | ✅ | `Chat.tsx`: `SESSION_KEY`, `getSessionId()`, localStorage, sent in body |
| 1.6 | Session survives gateway restart | ✅ | UI sends `sessionId`; reattach is gateway-side |
| 1.7 | Full scrollable history | ✅ | `Chat.tsx`: `messages` in state, all rendered; scrollRef overflow auto |
| 1.8 | Scroll to bottom on new content | ✅ | `Chat.tsx`: useEffect scrollToBottom when messages/streamingContent/isLoading |
| 1.9 | Stable message identity | ✅ | Streaming in separate node; completed messages have stable ids |

**Phase 1:** All done.

---

## Phase 2 — Readability & Trust

| # | Item | Status | Where in code / gap |
|---|------|--------|----------------------|
| 2.1 | Multi-line input, paste-friendly | ✅ | `Composer.tsx`: textarea, resize up to 200px, no truncation |
| 2.2 | No low character limit; show "Prompt trimmed to N chars" if gateway trims | ✅ | UI has no limit; shows hint when API returns meta.prompt_trimmed_to; API pass-through for gateway/edge |
| 2.3 | Full markdown (headings, lists, bold, links, blockquotes) | ✅ | `Message.tsx`: ReactMarkdown + remarkGfm; `globals.css`: .markdown-body |
| 2.4 | Code blocks — syntax highlighting, monospace, optional copy button | ✅ | `Message.tsx`: rehype-highlight + PreWithCopy; copy button on code blocks |
| 2.5 | Inline code (backticks → monospace) | ✅ | `.markdown-body code` in globals.css |
| 2.6 | Tool/skill visibility ("Used: launcher" etc.) | ⬜ | Depends on gateway exposing tool calls in response; not implemented |
| 2.7 | Structured tool output (lists/tables/expandable) | ⬜ | Not implemented |
| 2.8 | Clear error states (Gateway unreachable, Session expired, Rate limited, Context too long) | ✅ | `Chat.tsx`: error banner, `errorMessage`, `gatewayHint`; timeout message. Generic copy + hint; no specific "Rate limited" / "Context too long" labels |
| 2.9 | Retry / Send again for transient errors | ✅ | `Chat.tsx`: "Reconnect" / "Dismiss" on error banner; Recheck in header |
| 2.10 | Reconnect gracefully ("Reconnecting…" then "Back") | ✅ | Status shows "Reconnecting…" when connecting; "Edge" / "Gateway: local" when ok |

**Phase 2:** 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 2.9, 2.10 done. 2.6, 2.7 not done (gateway-dependent).

---

## Phase 3 — Context & Power

| # | Item | Status | Where in code / gap |
|---|------|--------|----------------------|
| 3.1 | Discoverable skills (sidebar, /tools, or ?) | ✅ | `SkillsPanel.tsx`: header + /tools; stub list; gateway API can replace later |
| 3.2 | Session/identity hint (session name, "Gateway: local" or URL) | ✅ | `Chat.tsx` header: "Gateway: local" or "Edge"; empty state "Session: {id}…" |
| 3.3 | Default view: just chat; minimal header | ✅ | Single chat view; header = JARVIS + session + status + Settings/Skills |
| 3.4 | Settings screen/modal (gateway URL, session ID) | ✅ | `SettingsModal.tsx`: session ID (copy), backend mode, gateway display; `/api/config` |
| 3.5 | Slash commands (/session, /clear, /tools) | ✅ | `Composer.tsx`: /clear, /session name, /tools; hint in footer |

**Phase 3:** All done.

---

## Phase 4 — Polish

| # | Item | Status | Where in code / gap |
|---|------|--------|----------------------|
| 4.1 | Keyboard-first (focus, Tab, Escape) | ✅ | Focus on load; Escape clears composer; Tab trap + Escape close in Settings/Skills modals |
| 4.2 | Accessibility (ARIA, reduced motion, "JARVIS is typing") | ✅ | aria-live region for "JARVIS is typing"; sr-only |
| 4.3 | Input stays responsive while streaming | ✅ | Composer not blocked for typing; only submit disabled when loading |
| 4.4 | Themes (light / dark / system) | ✅ | `globals.css`: :root + @media (prefers-color-scheme: light) |
| 4.5 | Export (copy thread as markdown / Save transcript) | ✅ | Header: "Copy thread" and "Save transcript" when messages exist |
| 4.6 | Global shortcut (Cmd+J / Ctrl+J) | ✅ | `Composer.tsx`: Cmd+J / Ctrl+J focuses composer when tab has focus |
| 4.7 | Multiple sessions (switcher, New session) | ✅ | Session dropdown in header; "New session", switch clears thread |
| 4.8 | CLI parity ("run and copy result") | ⬜ | Gateway-dependent; not implemented |

**Phase 4:** 4.1–4.7 done. 4.8 not done (gateway-dependent).

---

## Summary: What to Do Next

1. **Phase 2:** Tool visibility (2.6, 2.7) — depends on gateway exposing tool calls in response.
2. **Phase 4:** CLI parity (4.8) — "Run and copy result" when gateway supports it.

---

**How to use:** When picking up UI work, read this audit and the roadmap together; update both when you ship something new.
