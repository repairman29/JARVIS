# Supabase — JARVIS Edge Function

Host and call JARVIS on Supabase. The **jarvis** Edge Function is a REST API that proxies chat to your Clawdbot gateway so you can call JARVIS from anywhere (web, mobile, cron, Cursor, etc.).

## What’s here

| Path | Purpose |
|------|---------|
| **config.toml** | Supabase project config; `[functions.jarvis]` sets `verify_jwt = false` (auth via `JARVIS_AUTH_TOKEN` in the function). |
| **functions/jarvis/index.ts** | Edge Function: REST chat, MCP (tools/list, tools/call jarvis_chat), and action web_search/current_time. Proxies to gateway. |

## Prerequisites

1. **Clawdbot gateway** reachable from the internet (so the Edge Function can call it). Options:
   - Run locally and expose via tunnel (e.g. ngrok, cloudflared).
   - Deploy gateway to Railway, Fly, or another host and use that URL.
2. **Supabase project** (same one as your Vault is fine). [Create one](https://database.new) if needed.

## 1. Link and deploy

```bash
cd /path/to/CLAWDBOT

# Install Supabase CLI if needed: npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets (gateway URL and token; optional auth token for callers)
supabase secrets set JARVIS_GATEWAY_URL=https://your-gateway.example.com
supabase secrets set CLAWDBOT_GATEWAY_TOKEN=your_gateway_token
# Optional: require callers to send this token
supabase secrets set JARVIS_AUTH_TOKEN=your_public_caller_token

# Deploy the function
supabase functions deploy jarvis
```

## 2. Call from anywhere

**URL:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis` (your project)

**REST (any HTTP client):**

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_JARVIS_AUTH_TOKEN' \
  -d '{"message": "What time is it in Denver?"}'
```

If you did **not** set `JARVIS_AUTH_TOKEN`, omit the `Authorization` header (or use your Supabase anon key if you switch to JWT verification).

**Response:** `{ "content": "..." }`

**MCP (Cursor):** Same URL. POST JSON-RPC 2.0: `initialize`, `tools/list`, `tools/call` with tool `jarvis_chat` (argument: `message`). See **docs/JARVIS_MCP_CURSOR.md**.

**Convenience:** Body `{ "action": "web_search", "query": "..." }` or `{ "action": "current_time", "timezone": "America/Denver" }` → returns `{ "content": "..." }`.

**From JavaScript (fetch):**

```js
const res = await fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_JARVIS_AUTH_TOKEN' },
  body: JSON.stringify({ message: 'What time is it in Denver?' }),
});
const { content } = await res.json();
```

**From Supabase client:**

```js
const { data } = await supabase.functions.invoke('jarvis', {
  body: { message: 'What time is it in Denver?' },
});
console.log(data.content);
```

## 3. Secrets (Edge Function)

Set these in the Supabase Dashboard (**Edge Functions → jarvis → Secrets**) or via CLI (`supabase secrets set KEY value`):

| Secret | Required | Purpose |
|--------|----------|---------|
| **JARVIS_GATEWAY_URL** | Yes | Full URL of the Clawdbot gateway (e.g. `https://your-gateway.up.railway.app` or ngrok URL). |
| **CLAWDBOT_GATEWAY_TOKEN** | If gateway uses auth | Same token as in your gateway config. |
| **JARVIS_AUTH_TOKEN** | No | If set, callers must send `Authorization: Bearer <this value>`. Use for “call from anywhere” with a shared secret. |

## 4. Local dev

```bash
supabase start   # if you use local Supabase
supabase functions serve jarvis --no-verify-jwt
# Then: curl -X POST http://localhost:54321/functions/v1/jarvis -H 'Content-Type: application/json' -d '{"message":"Hi"}'
```

Set env for local: create `.env.local` in `supabase/functions/jarvis/` with `JARVIS_GATEWAY_URL`, `CLAWDBOT_GATEWAY_TOKEN` (see Supabase docs for local secrets), or use `supabase functions serve` with `--env-file`.

## Summary

- **Host:** Supabase (Edge Function).
- **Call:** Any HTTP client → `POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis` with `{ "message": "..." }`.
- **Auth:** Optional `JARVIS_AUTH_TOKEN`; set in secrets and send as `Authorization: Bearer <token>`.
- **Gateway:** Must be reachable from Supabase (deploy or tunnel). All skills (web search, clock, etc.) run on the gateway as today.

See **docs/JARVIS_MCP_SUPABASE.md** for MCP (Cursor) and full spec.

---

## Post-deploy: set gateway URL

The Edge Function proxies to your Clawdbot gateway. Supabase cannot reach `http://127.0.0.1:18789`. Set **JARVIS_GATEWAY_URL** to a URL Supabase can call:

1. **Option A — Tunnel (local gateway):** Run your gateway locally and expose it with [ngrok](https://ngrok.com) or [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps):  
   `ngrok http 18789` → use the HTTPS URL (e.g. `https://abc123.ngrok.io`) as `JARVIS_GATEWAY_URL`.
2. **Option B — Deployed gateway:** Deploy the Clawdbot gateway to Railway, Fly, etc., and set `JARVIS_GATEWAY_URL` to that base URL.

Then set the secret:

```bash
supabase secrets set JARVIS_GATEWAY_URL=https://your-public-gateway-url
```

Or in **Supabase Dashboard → Edge Functions → jarvis → Secrets**, add `JARVIS_GATEWAY_URL`.
