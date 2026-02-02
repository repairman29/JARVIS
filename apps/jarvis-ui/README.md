# JARVIS UI

Developer-grade chat UI for JARVIS. Talks to the Clawdbot gateway; implements the [JARVIS UI Developer Spec](../../docs/JARVIS_UI_DEVELOPER_SPEC.md) and [roadmap](../../docs/JARVIS_UI_ROADMAP.md).

## Prerequisites

- **Clawdbot gateway** running (e.g. `clawdbot gateway run` or `node scripts/start-gateway-with-vault.js` from repo root).
- Gateway URL: default `http://127.0.0.1:18789`.
- **Chat Completions API** enabled on the gateway (see [Enable Chat API](#enable-chat-api-fix-chat-api-not-enabled) below).

## Enable Chat API (fix "Chat API not enabled")

If you see **"Chat API not enabled on gateway"** when sending a message, do this:

1. **Find your gateway config file**
   - **Clawdbot:** `~/.clawdbot/clawdbot.json`
   - **OpenClaw:** `~/.openclaw/openclaw.json`
   - On Windows: `%USERPROFILE%\.clawdbot\clawdbot.json` (or `.openclaw\openclaw.json`).

2. **Create the file/folder if needed**
   ```bash
   mkdir -p ~/.clawdbot
   touch ~/.clawdbot/clawdbot.json
   ```

3. **Add or merge the chat completions endpoint**
   - If the file is **empty or you don’t have a `gateway` section**, write:
     ```json
     {
       "gateway": {
         "http": {
           "endpoints": {
             "chatCompletions": { "enabled": true }
           }
         }
       }
     }
     ```
   - If you **already have** a `gateway` (or full config), add only the `http.endpoints.chatCompletions` part so it’s merged under your existing `gateway`. For example, if you have `"gateway": { "port": 18789 }`, change it to:
     ```json
     "gateway": {
       "port": 18789,
       "http": {
         "endpoints": {
           "chatCompletions": { "enabled": true }
         }
       }
     }
     ```
   - Save the file. Ensure the JSON is valid (no trailing commas, quoted keys).

4. **Restart the gateway**
   ```bash
   clawdbot gateway restart
   ```
   Or stop it (e.g. Ctrl+C) and start again: `clawdbot gateway run` or `node scripts/start-gateway-with-vault.js` from repo root.

5. **Try the UI again** at http://localhost:3001 — send a message; you should get a reply.

If it still fails, check the gateway logs for config errors (`clawdbot gateway logs` or the terminal where the gateway runs). Some gateways use slightly different config keys; see [OpenClaw gateway config](https://docs.clawd.bot/gateway/configuration) and [OpenAI HTTP API](https://docs.clawd.bot/gateway/openai-http-api) for reference.

## No response from Clawdbot

If you send a message and see **"No response from Clawdbot"** (or the UI shows that text in the assistant bubble), the request reached the gateway but the response had no usable content. Check:

1. **Gateway is running** — header should show a green "Gateway: local". If it shows "Disconnected", start the gateway and click Reconnect.
2. **Auth** — If the gateway uses token auth, set `CLAWDBOT_GATEWAY_TOKEN` in `apps/jarvis-ui/.env` (same value as in `~/.clawdbot/clawdbot.json` or `~/.clawdbot/.env`). Restart the dev server after changing `.env`.
3. **Chat completions enabled** — See [Enable Chat API](#enable-chat-api-fix-chat-api-not-enabled) above.
4. **Gateway logs** — Run `clawdbot gateway logs` or watch the terminal where the gateway runs. Look for errors when you send a message (e.g. model/agent not found, timeout, or permission errors).

## Quick start

```bash
# From repo root
cd apps/jarvis-ui
cp .env.example .env
# Optional: set CLAWDBOT_GATEWAY_TOKEN in .env if your gateway uses auth (from ~/.clawdbot/.env)
npm install
npm run dev
```

Open **http://localhost:3001**. The UI uses a stable session (stored in `localStorage`) so conversation continues across reloads.

## Config

| Env | Description |
|-----|-------------|
| `NEXT_PUBLIC_GATEWAY_URL` | Gateway base URL (default: `http://127.0.0.1:18789`) |
| `CLAWDBOT_GATEWAY_TOKEN` or `OPENCLAW_GATEWAY_TOKEN` | Bearer token for gateway auth. Leave empty if gateway has no auth. |
| `NEXT_PUBLIC_JARVIS_EDGE_URL` | Optional. When set, chat and health use the JARVIS Edge Function (hosted JARVIS) instead of the gateway. |
| `JARVIS_AUTH_TOKEN` | Optional. Bearer token for Edge Function when using `NEXT_PUBLIC_JARVIS_EDGE_URL`. |

## Features (roadmap)

- **Phase 1:** Single composer, Enter to send, streaming replies, one persistent session, scrollable thread.
- **Phase 2:** Markdown + code blocks (syntax highlighting), tool visibility when gateway exposes it, clear errors, Reconnect.
- **Phase 3:** Session hint in header, settings (gateway URL / session) in a modal or separate screen.
- **Phase 4:** Keyboard-first, themes (light/dark/system), export transcript (future).

## Port

Runs on **3001** so it doesn’t clash with the gateway (18789) or other apps. Change with `npm run dev -- -p 3002` or edit `package.json`.
