# JARVIS Setup — Simple Explanation for Devs

A short overview of how JARVIS is set up so you can run it locally or understand the hosted stack.

---

## What is it?

**JARVIS** is a chat assistant (LLM-backed) with a web UI. You send a message, it hits a gateway that calls an LLM (e.g. OpenAI), and the reply streams back. The repo also has Discord, CLI, and other ways to talk to the same backend.

---

## Architecture (hosted)

```
You (browser)  →  Vercel (Next.js UI)  →  Supabase Edge  →  Railway (gateway)  →  OpenAI (or other LLM)
                       jarvis-ui              jarvis              start-gateway-with-vault
```

- **Vercel** — Serves the chat UI (Next.js). Only server logic: `/api/chat`, `/api/health`, `/api/config`. Fast static shell, serverless.
- **Supabase Edge** — Thin proxy: receives chat from the UI, forwards to the gateway, streams the reply back. One stable URL; auth and secrets live here.
- **Railway** — Runs the actual “brain”: `node scripts/start-gateway-with-vault.js`, which starts the Clawdbot gateway. It loads API keys from **Supabase Vault** and talks to OpenAI (or Groq, etc.).
- **Vault** — Supabase project that stores secrets (API keys, tokens). The gateway and scripts read from Vault so we don’t put keys in repo or env files.

So: **UI on Vercel, proxy on Supabase, gateway on Railway, secrets in Vault.**

---

## Try it

- **Hosted:** Open the deployed UI (e.g. `https://jarvis-ui-xi.vercel.app`). Send a message; it goes UI → Edge → Railway gateway → LLM.
- **Local:**  
  1. Put API keys and `CLAWDBOT_GATEWAY_TOKEN` in `~/.clawdbot/.env` (or in Vault; see below).  
  2. Start the gateway: `node scripts/start-gateway-with-vault.js` (or `npx clawdbot gateway run`).  
  3. Start the UI: `cd apps/jarvis-ui && npm run dev`.  
  4. Open `http://localhost:3001` and chat. The UI talks to the local gateway by default unless you set `NEXT_PUBLIC_JARVIS_EDGE_URL` to use the hosted Edge.

---

## Secrets (Vault)

We use **Supabase Vault** (table `app_secrets` + `get_vault_secret_by_name`) so the gateway and scripts get keys without putting them in the repo.

- **List what’s in Vault:** `node scripts/list-vault-vars.js` (names only; values stay secret).
- **Add a key:** `node scripts/vault-set-secret.js ANTHROPIC_API_KEY <your_key> "Anthropic API"`.
- **Sync gateway token to Edge:** `node scripts/sync-edge-gateway-token.js` (so Edge can call the gateway).

The gateway is started with `start-gateway-with-vault.js`, which pulls env from Vault (and `~/.clawdbot/.env`) before running the Clawdbot process.

---

## Config in one place

| Thing | Where |
|-------|--------|
| UI env (e.g. Edge URL) | Vercel project env vars, or `apps/jarvis-ui/.env.local` for local |
| Edge secrets (gateway URL, tokens) | Supabase Dashboard → Edge Functions → jarvis → Secrets, or `supabase secrets set` |
| Gateway model (OpenAI vs Groq etc.) | `config/railway-openclaw.json` (and start script forces agent to use it in cloud) |
| API keys for the gateway | Supabase Vault (`env/clawdbot/<KEY>`), or `~/.clawdbot/.env` for local |

---

## Repo layout (what to open)

- **Chat UI:** `apps/jarvis-ui/` — Next.js app; `app/api/chat/route.ts` is the serverless chat handler.
- **Edge function:** `supabase/functions/jarvis/index.ts` — Proxy that forwards to the gateway.
- **Gateway start:** `scripts/start-gateway-with-vault.js` — Loads Vault/env, then runs `npx clawdbot gateway run`.
- **Railway config:** `config/railway-openclaw.json` — Model (e.g. `openai/gpt-4o-mini`) and gateway options for cloud.

That’s the setup in a nutshell. For deploy checklists and env details, see [JARVIS_UI_DEPLOY_RAILWAY_VERCEL.md](./JARVIS_UI_DEPLOY_RAILWAY_VERCEL.md) and [JARVIS_WHERE_AM_I_RUNNING.md](./JARVIS_WHERE_AM_I_RUNNING.md).
