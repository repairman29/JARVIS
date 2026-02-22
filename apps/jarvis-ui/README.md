# JARVIS UI

Developer-grade chat UI for JARVIS. Talks to the Clawdbot gateway; implements the [JARVIS UI Developer Spec](../../docs/JARVIS_UI_DEVELOPER_SPEC.md) and [roadmap](../../docs/JARVIS_UI_ROADMAP.md).

**How to use it best:** [docs/JARVIS_UI_GETTING_STARTED.md](../../docs/JARVIS_UI_GETTING_STARTED.md) — first steps, slash commands, sessions, Farm vs Edge, and tips. In the app, click **Help** in the header for a quick reference.

## Prerequisites

- **Clawdbot gateway** running (e.g. `clawdbot gateway run` or `node scripts/start-gateway-with-vault.js` from repo root; or `node scripts/start-gateway-background.js` to start in background). After adding or changing skills, restart the gateway so it picks them up.
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

## 401 Unauthorized (Edge)

If the UI is using the **Edge** backend (`NEXT_PUBLIC_JARVIS_EDGE_URL` set) and you get **401 Unauthorized**, the Edge function has `JARVIS_AUTH_TOKEN` set and the UI isn't sending it.

**Fix:** In `apps/jarvis-ui/.env` or `.env.local` set **`JARVIS_AUTH_TOKEN`** to the **same value** as the Edge secret (Supabase Dashboard → Edge Functions → jarvis → Secrets). Restart the dev server (`npm run dev`).

**Alternative:** To use the **local gateway** instead of Edge, remove or comment out `NEXT_PUBLIC_JARVIS_EDGE_URL` in `.env`. The UI will then use `NEXT_PUBLIC_GATEWAY_URL` (default `http://127.0.0.1:18789`). Make sure the gateway is running locally.

## Password protection (deployed UI)

To restrict the deployed app (e.g. https://jarvis-ui-xi.vercel.app) so only you can access it, set these **server** env vars (e.g. in Vercel → Project → Settings → Environment Variables):

- **`JARVIS_UI_PASSWORD`** — The password you’ll enter on the login page (e.g. `jarvis2025`). Avoid `$` in the password on Vercel (it can be stripped by the runtime).
- **`JARVIS_UI_AUTH_SECRET`** — A long random string (e.g. 32+ chars) used to sign session cookies. Generate one with `openssl rand -base64 32`.

If both are set, all routes (chat, dashboard, API) require login. Session lasts 30 days. Use the **Logout** link in the header to sign out. If only one is set, auth is disabled.

**One-command setup (env vars + redeploy + wait):** From repo root, run `node apps/jarvis-ui/scripts/vercel-ui-auth-full.js [password] [auth-secret]` (or set `JARVIS_UI_PASSWORD` and `JARVIS_UI_AUTH_SECRET` in `.env.local` and run with no args). Requires `VERCEL_TOKEN` in env or `~/.clawdbot/.env`. State is logged to `~/.jarvis/logs/vercel-ui-auth-setup.log` (one JSON object per line).

**No login in incognito / auth not enforced:** Auth runs in Edge middleware and needs the env vars at **build time**. In Vercel → Project → Settings → Environment Variables, ensure **`JARVIS_UI_PASSWORD`** and **`JARVIS_UI_AUTH_SECRET`** are set for **Production** (and Preview if you want auth on preview URLs). Then **redeploy** (Deployments → … → Redeploy, or push a commit) so the new build picks them up. In incognito you should then be redirected to `/login`. If you only added the vars after the last deploy, a redeploy is required.

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
| `JARVIS_FARM_URL` or `FARM_URL` | Optional. When set **with** `NEXT_PUBLIC_JARVIS_EDGE_URL`, enables **hybrid** mode: health and chat try the farm first (e.g. `http://<pixel-ip>:18789`); if unreachable, use Edge. Session is always persisted to Edge so the same thread is available on farm or away. See [JARVIS_EDGE_AND_PIXEL_FARM.md](../../docs/JARVIS_EDGE_AND_PIXEL_FARM.md) § Hybrid app. |
| `NEXT_PUBLIC_JARVIS_CHAT_TIMEOUT_MS` | Optional. Chat request timeout in ms (default 90000). Use 90000 for farm/Nano so the UI doesn’t give up before the farm replies. |

## Features (roadmap)

- **Phase 1:** Single composer, Enter to send, streaming replies, one persistent session, scrollable thread.
- **Phase 2:** Markdown + code blocks (syntax highlighting), tool visibility when gateway exposes it, clear errors, Reconnect.
- **Phase 3:** Session hint in header, settings (gateway URL / session) in a modal or separate screen.
- **Phase 4:** Keyboard-first, themes (light/dark/system), export transcript (future).

## Port

Runs on **3001** so it doesn’t clash with the gateway (18789) or other apps. Change with `npm run dev -- -p 3002` or edit `package.json`.

## E2E tests

- **API (curl):** `npm run e2e` — hits `/`, `/api/health`, `/api/config`, `/api/chat`. Expect all OK or accepted skip when gateway/Edge is down.
- **Browser (Playwright):** `npm run test:e2e` — loads the UI, opens Settings/Skills, session dropdown, composer slash commands, export buttons. By default Playwright starts its own dev server on port 3002. If you already have `npm run dev` on 3001, use **`PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e`** so tests run against it and you avoid the Next.js dev lock. Optional: `npm run test:e2e:ui` for the Playwright UI.
