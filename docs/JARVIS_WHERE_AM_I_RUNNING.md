# Where Is JARVIS Running? (Local vs Railway + Supabase)

**Short answer:** It depends on your env and deployments. By default the repo is set up for **local** JARVIS. You can switch to **hosted** (Railway + Supabase) when you want.

---

## Two ways to run JARVIS

| Mode | Gateway | Edge | UI talks to |
|------|---------|------|-------------|
| **Local** | On your machine (`node scripts/start-gateway-with-vault.js`, port 18789) | Optional; if used, Edge needs a *public* gateway URL (e.g. ngrok or Railway) | Local gateway (default) or Edge |
| **Hosted (Railway + Supabase)** | On Railway (`railway.json` + same start script) | Supabase Edge function `jarvis` (deployed) | Edge URL → Edge → Railway gateway |

---

## How to tell what you’re running

### 1. JARVIS UI (apps/jarvis-ui)

- **If `NEXT_PUBLIC_JARVIS_EDGE_URL` is set** in `.env` or `.env.local`  
  → UI is using **Supabase Edge** (hosted backend). Chat goes: UI → Edge → gateway (whatever Edge’s `JARVIS_GATEWAY_URL` points to).

- **If `NEXT_PUBLIC_JARVIS_EDGE_URL` is not set**  
  → UI is using the **local gateway** at `NEXT_PUBLIC_GATEWAY_URL` (default `http://127.0.0.1:18789`). So you’re on **local** JARVIS unless you changed that.

### 2. Supabase Edge (jarvis function)

- **Edge is deployed** when you’ve run `supabase functions deploy jarvis` (or deployed via dashboard). Your project ref (e.g. `rbfzlqmkwhbvrrfdcain`) gives URL:  
  `https://<project-ref>.supabase.co/functions/v1/jarvis`

- **Edge only works in production** if it can reach the gateway. In **Supabase Dashboard → Edge Functions → jarvis → Secrets** (or `supabase secrets set`):
  - **`JARVIS_GATEWAY_URL`** = public URL of the gateway (e.g. `https://your-app.up.railway.app`).  
  - If it’s `http://127.0.0.1:18789` or unset, Edge in the cloud **cannot** reach your machine; so “hosted” JARVIS via Edge only works when this points to something like Railway (or ngrok).

### 3. Gateway on Railway

- **You’re running JARVIS on Railway** if:
  - You deployed this repo (or the gateway service) to Railway, and
  - The Railway service is running and has a public URL, and
  - That URL is set as **`JARVIS_GATEWAY_URL`** in Supabase Edge secrets.

So: **Railway + Supabase** = gateway on Railway, Edge on Supabase, and Edge’s `JARVIS_GATEWAY_URL` = Railway URL.  
**Local** = gateway on your machine; UI points at local gateway (and optionally Edge + ngrok if you want to use Edge from the UI).

---

## Summary

| Question | Check |
|----------|--------|
| Am I on **local** JARVIS? | UI has no `NEXT_PUBLIC_JARVIS_EDGE_URL` and gateway runs on your machine (e.g. `http://127.0.0.1:18789`). |
| Am I on **Railway + Supabase**? | Gateway is deployed on Railway; Supabase Edge has `JARVIS_GATEWAY_URL` = Railway URL; optionally UI has `NEXT_PUBLIC_JARVIS_EDGE_URL` = your Supabase Edge URL. |
| Is Edge deployed? | Yes, if you’ve run `supabase functions deploy jarvis` (we did earlier). URL: `https://<project-ref>.supabase.co/functions/v1/jarvis`. |
| Is the gateway on Railway? | Only if you deployed the gateway service to Railway and it’s running; check your Railway dashboard. |

**Default in this repo:** Local gateway, Edge deployed but Edge needs a public `JARVIS_GATEWAY_URL` to work from the cloud. To go fully hosted: **[JARVIS_LIFT_TO_RAILWAY.md](./JARVIS_LIFT_TO_RAILWAY.md)** (checklist) or [JARVIS_RAILWAY.md](./JARVIS_RAILWAY.md) (full doc).
