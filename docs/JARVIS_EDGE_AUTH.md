# JARVIS Edge Function: Auth (cloud vs local)

**Single reference for how auth works on the JARVIS Edge Function and how to keep UI and Edge in sync.**

---

## Behavior

| Environment | Auth required? | How |
|-------------|----------------|-----|
| **Cloud** (Supabase hosted) | **Yes**, when `JARVIS_AUTH_TOKEN` is set | Edge detects production via `DENO_DEPLOYMENT_ID` or `SB_REGION`; requires `Authorization: Bearer <JARVIS_AUTH_TOKEN>`. |
| **Local** (`supabase functions serve`) | **No** | Those env vars are not set locally, so the Edge does not enforce auth. |

So: **auth is required when the Edge is online in the cloud** (and you have set a token). Local dev has no auth so you can test without token sync.

---

## Keeping UI and Edge in sync (cloud)

The UI sends the token from **`apps/jarvis-ui/.env.local`** → `JARVIS_AUTH_TOKEN`. The Edge checks the token from **Supabase Edge secrets** → `JARVIS_AUTH_TOKEN`. They must match or you get **401 Unauthorized**.

**Sync token from UI to Edge (run from repo root):**

```bash
node scripts/sync-edge-auth-token.js
```

This reads `JARVIS_AUTH_TOKEN` from `apps/jarvis-ui/.env.local` and sets the same value in Supabase Edge secrets. Then redeploy so the function picks it up:

```bash
supabase functions deploy jarvis
```

**When to run sync:** After changing the token in `.env.local`, or after setting up a new UI instance. No need to run it for local-only dev (auth is off locally).

---

## UI config (quick ref)

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_JARVIS_EDGE_URL` | `apps/jarvis-ui/.env.local` | Edge URL (e.g. `https://YOUR_PROJECT_REF.supabase.co/functions/v1/jarvis`). When set, UI uses Edge instead of local gateway. |
| `JARVIS_AUTH_TOKEN` | `apps/jarvis-ui/.env.local` | Bearer token the UI sends to the Edge. Must match Edge secret when using cloud. |

See **apps/jarvis-ui/README.md** and **apps/jarvis-ui/.env.example** for full env reference.

---

## Troubleshooting

| Symptom | Fix |
|--------|-----|
| **401 Unauthorized** when using UI against Edge | Token mismatch. Run `node scripts/sync-edge-auth-token.js`, then `supabase functions deploy jarvis`. Restart UI dev server so it reloads `.env.local`. |
| **401** only in production, not locally | Expected: cloud requires auth, local does not. Ensure Edge secret `JARVIS_AUTH_TOKEN` matches UI `.env.local` (use sync script). |
| Want to **turn off auth in cloud** | Not recommended. To do it anyway: remove or unset `JARVIS_AUTH_TOKEN` in Supabase Edge secrets (Dashboard → Edge Functions → jarvis → Secrets). Redeploy. |

---

## Code reference

- **Edge auth logic:** `supabase/functions/jarvis/index.ts` — checks `DENO_DEPLOYMENT_ID` / `SB_REGION` and `JARVIS_AUTH_TOKEN`; requires `Authorization: Bearer <token>` only when running in cloud and token is set.
- **Sync script:** `scripts/sync-edge-auth-token.js` — copies `JARVIS_AUTH_TOKEN` from `apps/jarvis-ui/.env.local` to Supabase secrets.
- **UI sending token:** `apps/jarvis-ui/app/api/chat/route.ts` and `apps/jarvis-ui/app/api/health/route.ts` — read `JARVIS_AUTH_TOKEN` and set `Authorization: Bearer <token>` when calling the Edge.

---

## Related

- **supabase/README.md** — Deploy Edge, all secrets (JARVIS_GATEWAY_URL, CLAWDBOT_GATEWAY_TOKEN, JARVIS_AUTH_TOKEN).
- **docs/JARVIS_MCP_CURSOR.md** — MCP auth when Cursor calls the Edge.
- **docs/JARVIS_WHERE_AM_I_RUNNING.md** — Local vs Railway + Supabase.
