# JARVIS UI — Manual test checklist

Use this when verifying the UI after changes. Dev server: `npm run dev` (http://localhost:3001).

## Smoke (no gateway required)

- [ ] **Load** — Page loads; header shows "JARVIS", "Session: …", status dot (Checking… / Disconnected).
- [ ] **Settings** — Click Settings → modal shows Session ID (copyable), Backend (Edge or Local), gateway display. Done / Escape closes.
- [ ] **Skills** — Click Skills → panel opens with skill list. Close / Escape / click backdrop closes.
- [ ] **Session dropdown** — Click "Session: …" → list + "New session". Pick "New session" → thread clears, new session id. Pick another session → thread clears, session switches.
- [ ] **Composer** — Escape clears input; Cmd+J (Mac) / Ctrl+J (Win) focuses composer. Footer shows: Enter, Shift+Enter, Esc, Cmd+J, /clear, /session, /tools.

## Slash commands (no gateway required)

- [ ] **/clear** — Type `/clear`, Enter → thread clears (no message sent).
- [ ] **/tools** — Type `/tools`, Enter → Skills panel opens.
- [ ] **/session name** — Type `/session work`, Enter → session id becomes "work"; session list includes it.

## With gateway or Edge

- [ ] **Health** — When backend is up, status shows "Edge" or "Gateway: local" (green dot).
- [ ] **Send message** — Type a message, Enter → reply streams (or error if backend down).
- [ ] **Copy thread / Save transcript** — After at least one exchange, "Copy thread" and "Save transcript" appear in header; copy and download work.
- [ ] **Code block** — Ask for a code snippet → block has syntax highlight and Copy button.
- [ ] **Reconnecting** — With backend down, click Recheck → status shows "Reconnecting…" then "Edge" or "Gateway: local" when back.

## E2E script

```bash
cd apps/jarvis-ui && bash scripts/e2e.sh http://localhost:3001
```

Expect: GET / (200), /api/health, /api/config, POST /api/chat (no body), POST /api/chat (stream) all OK or accepted skip. Chat stream may be 401 if Edge is configured but unreachable or auth missing.

If GET / returns 500, restart the dev server (`npm run dev`) and re-run; dev can occasionally 500 on cold load. E2E retries GET / once.
