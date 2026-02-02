# JARVIS UI — Developer Experience Spec

What a developer wants from a **JARVIS** chat UI when they’re at the machine. Use this as a product/UX spec for building or improving the web (or desktop) experience that talks to the Clawdbot gateway.

---

## 1. Core: Conversation

### 1.1 Chat that feels like a first-class tool
- **Single, obvious place to type** — One main input (composer) that’s always visible and focused. No hunting for “where do I talk to JARVIS?”
- **Send on Enter** (newline with Shift+Enter) so flow matches Slack/Discord/Cursor.
- **Streaming replies** — Tokens appear as they’re generated. No “wait 30s then dump a wall of text.” Optional: show a subtle “thinking” or tool-use state before the first token.
- **Clear turn boundaries** — User message → assistant message. Optional: show tool calls / steps in a collapsible or inline way so the developer sees “JARVIS ran Launcher, then replied.”

### 1.2 Session = context
- **Persistent session** — Same conversation continues across reloads and tabs. Developer expects “I asked about the repo index last time; JARVIS still has that context.”
- **Named or default session** — At least one session (e.g. “main”). Optional: multiple sessions (e.g. “work”, “quick”) and a simple way to switch or start new.
- **Session survives gateway restart** — If the gateway stores session state, the UI should reconnect to the same session (by ID) after restart so the developer doesn’t lose the thread.

### 1.3 History and scroll
- **Scrollable history** — Full thread in one view. No arbitrary “last N messages” with no way to see more.
- **Scroll to bottom on new content** (with option to “stick to bottom” vs “freeze scroll” when the user has scrolled up to read).
- **Stable message identity** — Messages don’t jump or reflow badly when new content streams in.

---

## 2. Input: The composer

### 2.1 Multi-line and paste
- **Multi-line input** — Developer can paste a stack trace, a blob of JSON, or a paragraph without the UI truncating or escaping it.
- **No low character limit** — Support long prompts (e.g. paste a file or a design doc). If the gateway has a limit, the UI should make that clear (e.g. “Prompt trimmed to 12k chars”) rather than failing silently.
- **Paste as-is** — No “smart” stripping of newlines or formatting unless the user explicitly triggers “paste as single line” or similar.

### 2.2 Power-user input
- **Slash commands (optional)** — e.g. `/session main`, `/clear`, `/tools` to list skills. Makes the UI feel like a dev tool.
- **@ or quick triggers (optional)** — e.g. type `@launcher` or a shortcut to “run launcher skill with the rest of the line as args.” Not required for v1 but aligns with “JARVIS as launcher.”
- **Attach or reference (optional)** — “Use this file” or “Context: this snippet.” v1 can be paste-only; later, file picker or drag-drop.

---

## 3. Output: Reading JARVIS’s replies

### 3.1 Markdown and code
- **Full markdown rendering** — Headings, lists, bold/italic, links (clickable), blockquotes.
- **Code blocks** — Syntax highlighting by language (e.g. `js`, `bash`, `json`). Monospace, readable font, optional copy button.
- **Inline code** — Backticks rendered as monospace.
- **No “markdown as raw text”** — Developer should not see `**bold**` or ``` in the message; they see formatted output.

### 3.2 Tool and skill output
- **Tool/skill results visible** — When JARVIS uses a skill (e.g. Launcher, Calculator, GitHub), show that something ran. Options: inline “Used: launcher”, collapsible “Tool: launcher (expand)”, or a small “skills used” chip. Goal: developer trusts that tools ran and can debug.
- **Structured output when available** — If the gateway returns structured tool results (e.g. JSON or a list of files), render them in a readable way (list, table, or expandable block), not one long string.

### 3.3 Errors and limits
- **Clear error state** — “Gateway unreachable”, “Session expired”, “Rate limited”, “Context too long” with short, actionable copy.
- **Retry** — For transient errors, a “Retry” or “Send again” so the developer doesn’t have to re-paste the message.

---

## 4. Context and skills

### 4.1 “What can JARVIS do?”
- **Discoverable skills** — Somewhere (sidebar, `/tools`, or a “?” in the composer), the developer can see which skills are loaded (e.g. Launcher, Calculator, File search, GitHub). Names and one-line descriptions are enough for v1.
- **Session/identity hint** — Optional: show which session is active and maybe “Gateway: local” so the developer knows they’re talking to their local JARVIS.

### 4.2 No clutter, but power available
- **Default view: just the chat** — No mandatory dashboard, tabs, or config in the main view. Optional: a minimal header (title “JARVIS”, session name, maybe “Settings”).
- **Settings/configuration** — If the UI hosts any config (e.g. gateway URL, session ID), put it in a dedicated settings screen or modal, not in the main thread.

---

## 5. Performance and polish

### 5.1 Fast and responsive
- **Input stays responsive** — Typing and scrolling don’t lag, even while a reply is streaming.
- **Reconnect gracefully** — If the gateway restarts or the network blips, the UI reconnects and, if possible, restores the session. Show “Reconnecting…” and then “Back” instead of a dead screen.

### 5.2 Keyboard and accessibility
- **Keyboard-first** — Focus in composer by default; Tab to move focus; Escape to clear input or close modals. Power users should rarely need the mouse.
- **Accessible** — Semantic HTML, ARIA where needed, and support for reduced motion if the UI has animations. Screen reader can read messages and “JARVIS is typing.”

### 5.3 Offline / local-first
- **Works against local gateway** — Primary use case: gateway at `http://127.0.0.1:18789` (or configurable). No hard requirement for “offline mode,” but the UI shouldn’t assume a fast or always-on internet beyond the gateway.
- **No unnecessary telemetry** — Developer expects that conversation stays between their machine and the gateway (and whatever the gateway uses). Don’t send content to third parties from the UI.

---

## 6. Optional enhancements (post–v1)

- **Themes** — Light/dark/system. Default: respect OS preference.
- **Export** — Copy thread as markdown or “Save transcript” for a session.
- **Shortcuts** — Global hotkey (e.g. Win+J / Cmd+J) to focus or show the JARVIS window.
- **Multiple windows/tabs** — Same session in more than one tab, or multiple sessions in different tabs; state stays in sync or is clearly “per-tab session.”
- **CLI parity** — If the gateway exposes “run this message and return,” the UI could offer “Run and copy result” for script-like use.

---

## 7. What this is not (scope)

- **Not a replacement for the gateway** — The UI only talks to the Clawdbot gateway (HTTP/API). It does not implement agents, skills, or LLM calls itself.
- **Not Discord** — Discord is for quick, remote, or mobile. This spec is for the “at the machine” developer experience. Discord UX improvements are a separate concern.
- **Not Cursor** — Cursor is for deep code and repo context. JARVIS UI is for conversational use of JARVIS skills (launcher, calculator, file search, GitHub, etc.) with a clear, fast, local-first chat.

---

## Summary: Must-have for a “developer-grade” JARVIS UI

| Area        | Must-have |
|------------|-----------|
| **Conversation** | Single composer, Enter to send, streaming replies, clear turns, one persistent session. |
| **History**      | Full scrollable thread, stable scroll, reattach to same session after reload/restart. |
| **Input**        | Multi-line, paste-friendly, no low character limit; errors and retry. |
| **Output**       | Markdown + code blocks with highlighting; visible tool/skill use; clear errors. |
| **Context**      | Way to see loaded skills; minimal default view; config out of the main flow. |
| **Performance**  | Responsive while streaming; reconnect when gateway comes back; keyboard-first. |
| **Trust**        | Local gateway; no sneaky telemetry; conversation stays between user and gateway. |

Use this as the bar for “what a developer would want”: a fast, predictable, code-friendly chat surface that makes JARVIS feel like a first-class tool on the machine.

**Roadmap:** See [JARVIS_UI_ROADMAP.md](./JARVIS_UI_ROADMAP.md) for a phased plan (foundation → readability → context → polish) to implement this spec.
