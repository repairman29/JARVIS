# JARVIS UI — Voice, Theme & Conversation UAT

Documentation for the voice/conversational capabilities, dark mode, and related fixes. Use this for **User Acceptance Testing (UAT)**.

---

## 1. What Was Built / Fixed

### Voice (Iron Man–style)

- **Speech-to-text (STT)** — Microphone button in composer; uses browser Web Speech API. Transcribed text appears in the input for review before sending.
- **Text-to-speech (TTS)** — JARVIS speaks replies via browser `SpeechSynthesis`. Markdown is stripped to plain text before speaking.
- **“Speak replies”** — Header toggle (🔊 Voice). When **on**, each assistant reply is spoken automatically.
- **Conversation mode** — When on (with Speak replies), after JARVIS finishes speaking the mic turns on so you can reply by voice without clicking.
- **Per-message “Speak”** — Each assistant message has a “Speak” button to replay that message.
- **Settings → “🔊 Test voice”** — Verifies TTS with a short phrase.

Voice state is persisted in `localStorage` (`jarvis-ui-speak-replies`, `jarvis-ui-conversation-mode`). **Voice and conversation mode default to ON** for new users.

### Behavior Fixes

- **Interrupt on send** — Sending a new message stops any in-progress TTS.
- **No TTS for errors** — “No response.” and error messages are not spoken; conversation mode does not open the mic for those.
- **Chat API** — When using Edge URL, request body now includes both `message`/`messages` and `task` so backends that expect `task` work.

### Dark Mode / Theme

- **Theme toggle** — Header “🌙 Theme” dropdown: **Dark** (default), **Light**, **System**.
- **Persistence** — Stored in `localStorage` as `jarvis-ui-theme`.
- **No flash** — Inline script in `app/layout.tsx` applies saved theme before first paint so the page doesn’t briefly show the wrong theme.

### Hydration

- **Voice button** — `isTTSSupported()` is `window`-dependent. Voice toggle is rendered only after client mount (using `ttsSupported` state set in `useEffect`) so server and client markup match and hydration does not fail.
- **Dev bundler** — Next.js dev runs with `--webpack` to avoid Turbopack RSC/ViewportBoundary issues.

---

## 2. Local Setup (for UAT)

### Backend: Gateway

The UI can talk to:

1. **Local gateway** — `NEXT_PUBLIC_JARVIS_EDGE_URL` unset or empty. Chat goes to `NEXT_PUBLIC_GATEWAY_URL` (default `http://127.0.0.1:18789`) with `CLAWDBOT_GATEWAY_TOKEN`.
2. **Supabase Edge** — `NEXT_PUBLIC_JARVIS_EDGE_URL` set (e.g. `https://<project>.supabase.co/functions/v1/jarvis`). Chat goes to Edge; Edge calls gateway using its own env.

**Run local gateway (same token as UI):**

```bash
# From repo root — uses vault and writes ~/.clawdbot/.env
node scripts/start-gateway-with-vault.js
```

Then ensure the UI uses the **same** `CLAWDBOT_GATEWAY_TOKEN` as in `~/.clawdbot/.env`. If you run the UI with Edge URL **empty**, set the token in `apps/jarvis-ui/.env` to match the vault (or run the UI with `CLAWDBOT_GATEWAY_TOKEN=<value from ~/.clawdbot/.env`).

**Run UI (local gateway only, no Edge):**

```bash
cd apps/jarvis-ui
NEXT_PUBLIC_JARVIS_EDGE_URL= npm run dev
# Or set CLAWDBOT_GATEWAY_TOKEN to match ~/.clawdbot/.env if different
```

Open http://localhost:3001. Status should show **“Gateway: local”** when the gateway is up and token matches.

### Env Summary

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_GATEWAY_URL` | jarvis-ui | Gateway URL when not using Edge (default `http://127.0.0.1:18789`) |
| `NEXT_PUBLIC_JARVIS_EDGE_URL` | jarvis-ui | If set, chat goes to Edge instead of gateway |
| `CLAWDBOT_GATEWAY_TOKEN` | jarvis-ui (server) | Sent to gateway/Edge for auth |
| `JARVIS_AUTH_TOKEN` | jarvis-ui (server) | Sent to Edge when `NEXT_PUBLIC_JARVIS_EDGE_URL` is set |

---

## 3. UAT Checklist

### Smoke (no backend required)

- [ ] Page loads; header shows JARVIS, Session, **Theme** (🌙), **Voice** (🔊), Settings.
- [ ] **Theme** — Dropdown: Dark / Light / System. Switch and reload; selection persists. No flash of wrong theme on load.
- [ ] **Settings** — Modal shows backend (Edge / Local), Session ID. **“🔊 Test voice”** plays TTS when Voice is supported.
- [ ] **Voice toggle** — Click 🔊; label/state toggles (Voice on / Voice). No hydration error in console.

### Voice (backend required for replies)

- [ ] **Mic** — Click mic in composer; speak. Final transcript appears in input; Enter sends.
- [ ] **Speak replies** — Turn **on**. Send a message; when the reply arrives, it is spoken automatically.
- [ ] **Conversation mode** — With Speak replies on, after JARVIS speaks the mic starts (or prompt to allow mic). Reply by voice and send; second reply is spoken.
- [ ] **Interrupt** — While JARVIS is speaking, type and send a new message; speech stops.
- [ ] **Per-message Speak** — On an assistant bubble, click “Speak”; only that message is read.
- [ ] **No TTS for errors** — Force an error (e.g. wrong token); error message is not spoken and mic does not auto-start.

### Conversation (full flow)

- [ ] Send: “Reply with exactly: Hello, human.” → Reply is “Hello, human.” (or equivalent).
- [ ] Send: “What is 2+2? One number.” → Reply is “4” (or equivalent).
- [ ] With Voice on, both replies are spoken; conversation mode (if on) opens mic after each.

### Backend / Deployment

- [ ] **Local** — With gateway running and token aligned, status shows “Gateway: local” and chat works.
- [ ] **Vercel** — If `NEXT_PUBLIC_JARVIS_EDGE_URL` is set, Vercel talks to Edge. “Reconnecting” usually means health check to Edge (or gateway) is failing (e.g. Edge down or wrong auth).
- [ ] **403 OAuth** — If the LLM provider returns “OAuth authentication is currently not allowed for this organization”, switch the **agent primary model** to a provider that allows API keys (e.g. Groq, another OpenAI key, OpenRouter). LLM keys in Vault are fine; the **selected model** must not require org OAuth.

---

## 4. E2E (automated)

```bash
cd apps/jarvis-ui
npm run test:e2e
```

Uses Playwright; starts Next with webpack on port 3002 if needed. All 18 tests should pass (smoke, settings, session, skills, export, composer).

---

## 5. Files Touched (reference)

| Area | Files |
|------|--------|
| Voice | `apps/jarvis-ui/lib/voice.ts`, `components/Composer.tsx` (mic), `components/Message.tsx` (Speak), `components/Chat.tsx` (toggle, speakReplyAndMaybeListen, stop on send), `components/SettingsModal.tsx` (Test voice, options) |
| Theme | `apps/jarvis-ui/app/globals.css` (data-theme), `app/layout.tsx` (inline script), `components/Chat.tsx` (theme state, dropdown) |
| Hydration | `components/Chat.tsx` (ttsSupported in useEffect; voice button only when ttsSupported) |
| Chat API | `apps/jarvis-ui/app/api/chat/route.ts` (edge body includes `task`) |
| Dev | `apps/jarvis-ui/next.config.js` (turbopack root removed), `package.json` (dev uses `--webpack`) |

---

## 6. Quick Commands

```bash
# Gateway (from repo root)
node scripts/start-gateway-with-vault.js

# UI, local gateway only
cd apps/jarvis-ui && NEXT_PUBLIC_JARVIS_EDGE_URL= npm run dev

# E2E
cd apps/jarvis-ui && npm run test:e2e
```

---

Use **MANUAL_TEST_CHECKLIST.md** in `apps/jarvis-ui/docs/` for the non-voice smoke and slash-command checks. This doc is the single place for **voice, theme, and conversation UAT**.
