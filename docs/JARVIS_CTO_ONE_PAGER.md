# JARVIS — One-Page CTO Overview

**What it is:** A chat interface and gateway that routes user messages to an LLM (OpenAI primary; others as fallback). Same backend serves web UI, Discord, and CLI. Secrets live in a Supabase-backed vault; no keys in repo or build artifacts.

---

## Architecture

| Layer | Where | Role |
|-------|--------|------|
| **Front end** | Vercel (Next.js) | Static shell + `/api/chat`, `/api/health`, `/api/config`. Serverless; CDN for static. |
| **Proxy** | Supabase Edge (Deno) | Single stable URL; forwards chat to gateway, streams response; optional Bearer auth. |
| **Gateway** | Railway (Node) | `start-gateway-with-vault.js` → loads env from Vault + `.env`, then `clawdbot gateway run`. HTTP chat completions; model config (primary/fallbacks) in repo config. |
| **Secrets** | Supabase (same or separate project) | Vault (`app_secrets` + RPC); gateway and scripts resolve `env/clawdbot/<KEY>`. |

**Flow:** Browser → Vercel → Edge → Railway gateway → LLM. Edge and gateway authenticate via shared token; gateway pulls LLM keys from Vault at startup.

---

## Tradeoffs

- **Vercel:** Fast cold start for static; serverless chat can hit timeout on long streams (Pro extends). No persistent process.
- **Edge:** Low ops, one URL, but Supabase region and rate limits apply. Auth is optional (token in Edge + Vercel env).
- **Railway:** Single-region; gateway is long-lived so no serverless cold start. Restart/redeploy picks up new config and Vault keys.
- **Vault:** Centralized secrets, no keys in code; requires one Supabase project with Vault SQL and service-role access from gateway/scripts.

---

## Security

- **Secrets:** API keys and gateway token in Vault (or `~/.clawdbot/.env` local only). Edge secrets (gateway URL, token) in Supabase Edge env; Vercel env for UI (e.g. Edge URL); no `NEXT_PUBLIC_*` for keys.
- **Auth:** Edge can require Bearer token; gateway validates token from Edge. UI server-side forwards token from env. Optional; can run Edge without auth for internal use.
- **Network:** Gateway is not public-by-default; Edge is the only caller. Railway exposes one HTTP endpoint; no DB or Vault exposed to the internet.

---

## Ops

- **Deploy:** UI via Vercel (git or CLI); Edge via `supabase functions deploy jarvis`; gateway via Railway (git or `railway up`). Config in repo (`config/railway-openclaw.json`); start script forces agent model on cloud start so redeploys use intended primary (e.g. OpenAI).
- **Secrets sync:** Scripts to sync gateway token to Edge and list Vault vars; add/rotate keys in Vault then redeploy or restart gateway.
- **Health:** UI polls `/api/health`; health endpoint pings Edge (or local gateway). 502 from chat → Edge or gateway down / misconfigured; error message surfaced in UI.

---

## Summary

Single-tenant setup: Vercel (UI) + Supabase Edge (proxy) + Railway (gateway) + Supabase Vault (secrets). One public chat URL; one gateway process; keys out of repo and loaded at runtime. Suitable for a small team or personal use; scale would mean multiple gateway replicas or a different gateway topology.
