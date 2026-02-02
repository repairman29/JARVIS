# Lift JARVIS to Railway — Checklist

You started this earlier: Railway project **jarvis-gateway** and domain **https://jarvis-gateway-production.up.railway.app** exist. Use this checklist to finish the lift so JARVIS runs in the cloud (Edge → Railway gateway).

---

## Prereqs (already done)

- [x] **Railway:** Project + service **jarvis-gateway**, public domain `https://jarvis-gateway-production.up.railway.app`
- [x] **Repo:** `railway.json` (start: `node scripts/start-gateway-with-vault.js`), `config/railway-openclaw.json`, start script with Vault + proxy
- [x] **Supabase:** Edge function **jarvis** deployed (project ref `rbfzlqmkwhbvrrfdcain`)

---

## 1. Set Railway variables (Vault)

From repo root with Railway CLI linked to **jarvis-gateway**:

```bash
railway variables --set "VAULT_SUPABASE_URL=https://rbfzlqmkwhbvrrfdcain.supabase.co" --set "VAULT_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" --set "PORT=3000"
```

Use the **service role key** from [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/settings/api). The start script uses these to pull all other secrets from Vault at startup.

**Optional (compatibility):** Set **SUPABASE_URL** too so code paths that expect it have it:

```bash
railway variables --set "SUPABASE_URL=https://rbfzlqmkwhbvrrfdcain.supabase.co"
```

**Alternative:** Railway Dashboard → **jarvis-gateway** → **Variables**, or use the API script with `RAILWAY_TOKEN`: `node scripts/railway-set-variables.js`.

---

## 2. Deploy to Railway

```bash
railway up
```

Watch the deployment in [Railway Dashboard](https://railway.app) → **jarvis-gateway** → Deployments. In logs you should see **"Proxy listening on …"** immediately, then **"Gateway ready on port 18789"** once clawdbot is up. If you see 502: (1) the proxy now listens on `PORT` immediately and returns 503 until the gateway is ready; (2) `config/railway-openclaw.json` uses `agents.defaults` (not legacy `agent`) so clawdbot accepts the config. See [JARVIS_RAILWAY.md](./JARVIS_RAILWAY.md) → Troubleshooting for more.

---

## 3. Point Supabase Edge at Railway

In **Supabase Dashboard** → **Edge Functions** → **jarvis** → **Secrets** (or `supabase secrets set`):

- **`JARVIS_GATEWAY_URL`** = `https://jarvis-gateway-production.up.railway.app`  
  (no trailing slash; use the exact URL from Railway → Settings → Domains.)

Redeploy the Edge function once so it picks up the secret:

```bash
supabase functions deploy jarvis
```

---

## 4. (Optional) Use Edge from the JARVIS UI

To have the UI talk to **hosted** JARVIS (Edge → Railway) instead of the local gateway:

In **`apps/jarvis-ui/.env`** or **`.env.local`**:

```bash
NEXT_PUBLIC_JARVIS_EDGE_URL=https://rbfzlqmkwhbvrrfdcain.supabase.co/functions/v1/jarvis
# If your Edge uses Bearer auth:
# JARVIS_AUTH_TOKEN=<your_token>
```

Restart the UI (`npm run dev`). Health and chat will use the Edge function, which proxies to Railway.

---

## 5. Verify

- **Edge:**  
  `curl -s "https://rbfzlqmkwhbvrrfdcain.supabase.co/functions/v1/jarvis"`  
  → should return `{"ok":true,"mode":"edge"}`.

- **Edge → Railway:**  
  `curl -s -X POST "https://rbfzlqmkwhbvrrfdcain.supabase.co/functions/v1/jarvis" -H "Content-Type: application/json" -d '{"message":"What time is it?"}'`  
  → should return JSON with `content` (JARVIS reply). If 502, Railway gateway may still be starting or check Edge secret `JARVIS_GATEWAY_URL`.

- **UI:** Open the JARVIS UI; send a message. If you set `NEXT_PUBLIC_JARVIS_EDGE_URL`, you’re on hosted JARVIS.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in Railway (and optionally `PORT=3000`) |
| 2 | `railway up` |
| 3 | Set `JARVIS_GATEWAY_URL` in Supabase Edge to your Railway URL; redeploy Edge |
| 4 | (Optional) Set `NEXT_PUBLIC_JARVIS_EDGE_URL` in UI so the UI uses Edge |
| 5 | Verify with curl and/or UI |

After this, JARVIS runs in the cloud; your machine doesn’t need to be on. More detail and troubleshooting: [JARVIS_RAILWAY.md](./JARVIS_RAILWAY.md).
