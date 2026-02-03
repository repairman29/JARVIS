# Deploy JARVIS Chat UI to Railway or Vercel

The JARVIS chat UI (`apps/jarvis-ui`) is a Next.js app that today runs locally on **port 3001** and talks to either:

- **Local gateway** — `http://127.0.0.1:18789` (Clawdbot on your machine), or  
- **Edge** — Supabase Edge Function → Railway (or local) gateway.

This doc covers **deploying the UI** so it runs on Railway or Vercel and still talks to your JARVIS backend (Edge or gateway URL).

---

## What you need

| Item | Purpose |
|------|--------|
| **Backend** | JARVIS must be reachable: either **Supabase Edge** (recommended) or a **public gateway URL** (e.g. Railway gateway). |
| **Env vars** | See below; at least one of `NEXT_PUBLIC_JARVIS_EDGE_URL` or `NEXT_PUBLIC_GATEWAY_URL`. |
| **Secrets (optional)** | `JARVIS_AUTH_TOKEN` or `CLAWDBOT_GATEWAY_TOKEN` if your backend requires auth. |

The UI is **static-friendly** for the shell; the only server logic is `/api/chat`, `/api/health`, `/api/config`. All can run on serverless (Vercel) or a long-running Node process (Railway).

---

## Fastest / most resilient?

| Concern | Vercel | Railway |
|--------|--------|---------|
| **First load (static)** | Very fast — global CDN, edge caching. | Fast — single region; no CDN by default. |
| **`/api/chat` (streaming)** | Fast when warm. **Cold start** after idle (hobby: ~1–3s; Pro can reduce). 60s timeout (Pro); hobby shorter. | Fast when service is up. **Service sleep** when idle (cold start when traffic returns). No per-request timeout. |
| **Resilience** | High — multi-region, automatic retries, DDoS/edge protection. | Good — single region; simple. Add a second region only with more config/cost. |
| **Streaming** | Supported; long streams may hit function timeout on hobby. | Supported; no function timeout; process runs until done. |
| **Cost** | Hobby free tier; Pro for longer timeouts and fewer cold starts. | Pay per use; no sleep if you keep the service always-on (extra cost). |

**Recommendation:**

- **Fastest + most resilient for “just works”:** **Vercel**. Use the Edge URL for JARVIS so the UI’s only job is to proxy/stream; Vercel’s CDN and edge make the shell snappy, and chat is “fast enough” after the first request. If you hit cold starts, upgrade to Pro or keep the UI warm with a cron ping.
- **Simplest and predictable for chat:** **Railway**. One long-running `next start`; no serverless cold start, no function timeout. Good if you already run the gateway on Railway and want the UI in the same project. Resilience is “one region + your gateway”; add a health check and restart policy.
- **Hybrid:** UI on **Vercel** (CDN + edge), JARVIS gateway on **Railway** (or local), Edge in between. Best of both: fast static + stable backend.

**TL;DR:** Prefer **Vercel** for speed and resilience of the front end; prefer **Railway** if you want no cold starts and no stream timeouts and are fine with single-region. For most setups, **Vercel + Edge → gateway** is the best balance.

---

## Recommended setup: Vercel + Edge → gateway

**Architecture:** UI on Vercel (CDN + edge) → Supabase Edge Function → gateway (Railway or local). One stable backend URL, fast static shell, resilient chat path.

**Checklist when you’re ready:**

1. **Backend in place**  
   - Supabase Edge Function **jarvis** deployed and pointing at your gateway (`JARVIS_GATEWAY_URL` = Railway URL or your tunnel).  
   - Gateway (Railway or local) running and reachable from Edge.  
   - See [JARVIS_LIFT_TO_RAILWAY.md](./JARVIS_LIFT_TO_RAILWAY.md) and [supabase/README.md](../supabase/README.md) if needed.

2. **Vercel project**  
   - New project → import CLAWDBOT repo.  
   - **Root Directory:** `apps/jarvis-ui`.

3. **Env vars on Vercel**  
   - `NEXT_PUBLIC_JARVIS_EDGE_URL` = `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis`  
   - `JARVIS_AUTH_TOKEN` = (Edge Bearer token, if you use auth) — **Secret**

4. **Deploy**  
   - Push or trigger deploy. UI at `https://your-app.vercel.app`; health and chat use Edge.

5. **Verify**  
   - Open the production URL in a browser (see **Testing** below).  
   - `/api/health` should show `ok: true` when Edge/gateway are up.  
   - Send a message in the UI → stream should come back via Edge.

That’s the full path for “fast + resilient” with Vercel + Edge → gateway.

**502 on /api/chat:** The UI (Vercel) calls Edge; if that fails, you get 502. Common causes: (1) **Edge unreachable** — Vercel’s server can’t reach the Supabase Edge URL (outage, DNS, or firewall). (2) **Edge → gateway fails** — Edge is up but `JARVIS_GATEWAY_URL` is wrong, or the gateway is down/unreachable from Supabase. Check: [Supabase Edge logs](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/logs/edge-logs); ensure the gateway is running and Edge has `JARVIS_GATEWAY_URL` set. (3) **Timeout** — Edge or gateway is slow; the UI allows 120s. (4) **502 with "Unauthorized"** — Edge is up but the **gateway** returned 401: fix `JARVIS_GATEWAY_URL` (must be reachable from Supabase) and `CLAWDBOT_GATEWAY_TOKEN` in Supabase Edge secrets so they match the gateway. Run `node scripts/sync-edge-gateway-token.js` to sync the token from Vault to Edge.

(5) **502 with "No API key found for provider anthropic"** (or another provider) — The gateway is reachable but its default LLM provider has no key. **LLM keys live in Supabase Vault** (`app_secrets` / `env/clawdbot/<KEY>`). Ensure: (a) The key is in Vault, e.g. `node scripts/vault-set-secret.js ANTHROPIC_API_KEY <your_key> "Anthropic API"`. (b) The gateway is started with **`node scripts/start-gateway-with-vault.js`** (so it loads from Vault). (c) If the gateway runs on **Railway**, set **`VAULT_SUPABASE_URL`** and **`VAULT_SUPABASE_SERVICE_ROLE_KEY`** in Railway so the start script can pull from Vault. (d) Restart the gateway after adding keys so it reloads env.

**ERR_INTERNET_DISCONNECTED on /api/health:** This is a **client-side** error: the browser couldn't reach the server (e.g. your machine lost internet, or a VPN/firewall blocked the request). Fix: check your network; the health poll will resume when the connection is back.

**Testing the deployed UI**

- **If Vercel Deployment Protection is on** (SSO/password): Unauthenticated `curl` to the deployment URL returns 401 and the Vercel login page. **To test:** open the production URL in a browser where you’re logged into Vercel (same team), or use a [protection bypass token](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) for automation.
- **To allow public access** (e.g. share the UI or hit `/api/health` without login): Vercel Dashboard → **jarvis-ui** → Settings → **Deployment Protection** → set Production to **Disabled** (or use “Only Preview” so production is public).

**Already deployed:** The JARVIS UI is linked to Vercel project **jarvis-ui** (jeff-adkins-projects). After adding env vars (see below), redeploy so chat uses Edge: Vercel Dashboard → jarvis-ui → Deployments → ⋮ on latest → Redeploy, or run from repo: `cd apps/jarvis-ui && npm run deploy:prod`.

**Verify deployment (CLI):** From repo root: `bash apps/jarvis-ui/scripts/check-deployment.sh`. This runs: `vercel env ls`, `supabase secrets list`, Edge GET/POST, deployed `/api/health`, and optionally Supabase Edge logs. To fetch logs via API: create a [Personal Access Token](https://supabase.com/dashboard/account/tokens), then `export SUPABASE_ACCESS_TOKEN=<your_PAT>` and re-run the script. Otherwise the script prints the dashboard URL for [Edge logs](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/logs/edge-logs).

---

## Environment variables

Set these in Railway or Vercel (or in `.env.production` if you build locally and deploy artifacts).

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_JARVIS_EDGE_URL` | One of these | Supabase Edge URL, e.g. `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis`. UI uses this for health + chat when set. |
| `NEXT_PUBLIC_GATEWAY_URL` | One of these | Public gateway URL, e.g. `https://jarvis-gateway-production.up.railway.app`. Use if the UI talks to the gateway directly (no Edge). |
| `JARVIS_AUTH_TOKEN` | If Edge uses auth | Bearer token for Edge; set in Vercel/Railway **secrets** (not public). |
| `CLAWDBOT_GATEWAY_TOKEN` | If gateway uses auth | Gateway auth; set in **secrets**. |

**Recommendation:** Prefer **Edge** for the hosted UI: set `NEXT_PUBLIC_JARVIS_EDGE_URL` and `JARVIS_AUTH_TOKEN` (if needed). That way one URL (Edge) handles auth and proxies to your Railway (or local) gateway.

**Locked down:** Edge requires `JARVIS_AUTH_TOKEN` in Supabase Edge secrets; the UI (Vercel) sends it via `JARVIS_AUTH_TOKEN` env. The **exact same value** must be in both places (no newlines/whitespace). Set both via CLI: `supabase secrets set JARVIS_AUTH_TOKEN=<token>` and `printf '%s' '<token>' | vercel env add JARVIS_AUTH_TOKEN production`, then redeploy Vercel (`npm run deploy:prod` in apps/jarvis-ui).

**401 Unauthorized:** If the token in Supabase and Vercel don’t match exactly, Edge returns 401. **Current setup:** Edge auth is **off** (no `JARVIS_AUTH_TOKEN` in Supabase) so the Vercel UI works without token sync issues. **To lock down later:** (1) Generate a strong token. (2) In [Supabase Dashboard](https://supabase.com/dashboard) → Edge Functions → jarvis → Settings → Secrets, add `JARVIS_AUTH_TOKEN` = that value. (3) In Vercel Dashboard → jarvis-ui → Settings → Environment Variables, add `JARVIS_AUTH_TOKEN` = the **exact same** value (paste, don’t use CLI echo). (4) Redeploy Vercel. Edge and UI must use the identical string.

---

## Deploy to Vercel

1. **Connect repo**  
   Vercel → New Project → import CLAWDBOT repo.

2. **Root directory**  
   Set **Root Directory** to `apps/jarvis-ui` (so build runs from there).

3. **Build / start**  
   Vercel detects Next.js; default is fine:
   - Build: `npm run build` (or `next build`)
   - Output: Next.js (no override needed)

4. **Env vars**  
   Project → Settings → Environment Variables (Production / Preview):
   - `NEXT_PUBLIC_JARVIS_EDGE_URL` = `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis`
   - `JARVIS_AUTH_TOKEN` = (your Edge Bearer token) — mark as **Secret**

5. **Deploy**  
   Push or trigger deploy. The UI will be at `https://your-app.vercel.app`. Health and chat go to the Edge URL.

**Monorepo:** If the repo root is the project root, set "Root Directory" to `apps/jarvis-ui` so Vercel only builds that app.

---

## Deploy to Railway

1. **New service**  
   Railway → New Project → Deploy from GitHub repo (CLAWDBOT).

2. **Root / build**  
   - **Root Directory:** `apps/jarvis-ui` (so the service is only the UI).
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start` (runs `next start`; Railway sets `PORT`).

3. **Port**  
   Railway injects `PORT`. The app uses `next start` (no `-p`), so Next.js picks up `PORT` automatically.

4. **Env vars**  
   Railway → **jarvis-ui** (or your service) → Variables:
   - `NEXT_PUBLIC_JARVIS_EDGE_URL` = `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis`
   - `JARVIS_AUTH_TOKEN` = (secret)

5. **Generate domain**  
   Railway → Settings → Generate Domain. Your UI will be at `https://your-ui.up.railway.app`.

---

## Optional: Use PORT in start command

So the same app runs locally (3001) and on Railway/Vercel (injected PORT):

In `apps/jarvis-ui/package.json`:

```json
"start": "next start -p ${PORT:-3001}"
```

On Railway/Vercel, `PORT` is set; locally, it falls back to 3001. (On Windows you may need a small script that reads `process.env.PORT` or use `cross-env`.)

---

## After deploy

1. **Health**  
   Open `https://your-ui.vercel.app/api/health` (or Railway URL). You should see `{"ok":true,...}` when the backend (Edge or gateway) is reachable.

2. **Chat**  
   Use the UI; it will use the Edge URL (or gateway URL) from env. If you see "Backend unreachable", check:
   - Edge/gateway is up.
   - `NEXT_PUBLIC_JARVIS_EDGE_URL` or `NEXT_PUBLIC_GATEWAY_URL` is correct.
   - CORS: Next.js API routes call your backend from the server, so browser CORS doesn’t apply to that; only the browser talks to your Vercel/Railway domain.

3. **Secrets**  
   Never put `JARVIS_AUTH_TOKEN` or `CLAWDBOT_GATEWAY_TOKEN` in `NEXT_PUBLIC_*`; use the platform’s **secrets** so they stay server-side.

---

## Summary

| Where | Use case |
|-------|----------|
| **Local 3001** | Dev; UI talks to local gateway or Edge. |
| **Vercel** | Hosted UI; minimal config; set `NEXT_PUBLIC_JARVIS_EDGE_URL` (+ optional `JARVIS_AUTH_TOKEN`). Root: `apps/jarvis-ui`. |
| **Railway** | Hosted UI as a service; same env; root `apps/jarvis-ui`, build + `next start`. |

Both platforms work with the same Next.js app; choose Vercel for serverless and quick deploys, or Railway if you already run the gateway there and want UI in the same project.
