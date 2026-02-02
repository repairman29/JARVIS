# JARVIS Status Check

**Checked:** Edge, Edge→Railway, Railway direct, repo config.

---

## 1. Supabase Edge (jarvis)

| Check | Result |
|-------|--------|
| **GET** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis` | ✅ **200** — `{"ok":true,"mode":"edge"}`. Edge is up. |
| **POST** (chat) without auth | **401 Unauthorized** — Edge has `JARVIS_AUTH_TOKEN` set, so POST requires `Authorization: Bearer <token>`. |

**Conclusion:** Edge is running. For chat (and MCP), callers must send the Bearer token if you have `JARVIS_AUTH_TOKEN` set in Edge secrets.

---

## 2. Edge → Railway (chat)

| Check | Result |
|-------|--------|
| **POST** with message (no auth) | 401 (auth required). |
| **POST** with correct Bearer token | Not tested (no token in check). |

So we didn’t verify the full path Edge → Railway gateway. If you have the token, test with:

```bash
curl -s -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JARVIS_AUTH_TOKEN" \
  -d '{"message":"What time is it?"}'
```

If you get JSON with `content`, Edge → Railway is working.

---

## 3. Railway gateway (direct) — CLI/API done

- **Variables:** `railway variables` shows **VAULT_SUPABASE_URL**, **VAULT_SUPABASE_SERVICE_ROLE_KEY**, **PORT=3000** already set.
- **Redeploy:** Triggered via `railway redeploy -y`. Latest deployment was BUILDING/DEPLOYING; earlier ones CRASHED/FAILED — check logs for `ERR_MODULE_NOT_FOUND` (clawdbot) or "Proxy listening on 3000".
- **Set vars via CLI:** `railway variables --set "SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co"` (done). Optional: same via API script if you prefer (`RAILWAY_TOKEN=xxx node scripts/railway-set-variables.js`).

## 3a. Railway gateway (direct) — URL check

| Check | Result |
|-------|--------|
| **GET** `https://jarvis-gateway-production.up.railway.app/` | **Timeout / no response** (≈10s). |

So the gateway at that URL either:

- Isn’t running yet (build failed, or no successful deploy),
- Isn’t ready (e.g. still starting, or crash loop),
- Or needs **Railway variables** to start: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (start script pulls secrets from Vault).

**What to do:** In Railway → **jarvis-gateway** → **Variables**, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then check **Deployments → View logs** for “Proxy listening on 3000” and any errors.

---

## 4. Repo / config

| Item | Status |
|------|--------|
| **Memory migration** | ✅ `supabase/migrations/20250201120000_jarvis_memory_tables.sql` exists; you ran the SQL earlier. |
| **Edge memory (load/append)** | ✅ Implemented in `supabase/functions/jarvis/index.ts` for REST and MCP. |
| **JARVIS_GATEWAY_URL** (Edge secret) | ✅ Set to `https://jarvis-gateway-production.up.railway.app` (we set it). |
| **UI .env.example** | ✅ `NEXT_PUBLIC_JARVIS_EDGE_URL` set to Edge URL; `JARVIS_AUTH_TOKEN` commented (set in `.env.local` if Edge uses auth). |

---

## 5. Summary

| Component | Status | Action if needed |
|-----------|--------|-------------------|
| **Edge** | ✅ Up | None. |
| **Edge auth** | POST requires Bearer | Use `JARVIS_AUTH_TOKEN` in UI `.env.local` and in MCP/Cursor config when calling Edge. |
| **Railway gateway** | ❓ Not responding direct | Vault vars already set; redeploy triggered. Check Railway logs (CRASHED/FAILED may be clawdbot ERR_MODULE_NOT_FOUND). Optional: set SUPABASE_URL via CLI `railway variables --set "SUPABASE_URL=..."` or via API script. |
| **Edge → Railway** | Not verified (401 without token) | After Railway is up, test POST with Bearer token. |
| **Memory (DB + Edge)** | ✅ Migration applied; Edge code in place | None. |
| **UI → hosted** | Config in .env.example | Copy to `.env.local`, add `JARVIS_AUTH_TOKEN` if Edge uses auth, restart UI. |

**Next actions:**  
1) Set Railway variables and confirm gateway starts (logs show “Proxy listening on 3000”).  
2) Test Edge chat with Bearer token once Railway is up.  
3) Optionally use [JARVIS_LIFT_TO_RAILWAY.md](./JARVIS_LIFT_TO_RAILWAY.md) for the full checklist.
