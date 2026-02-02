# Add-to-cart 503 – Back up and review

## What’s going on

- **Symptom:** `POST /api/kroger/add-to-cart` returns **503** on [shopolive.xyz](https://shopolive.xyz). The page used to crash; the dashboard handler is now defensive so it shows an error message instead.
- **We never saw the 503 response body** (network drops when running the console script), so we don’t know which of the three 503 paths the server is taking.

---

## The three 503 paths in the API

The add-to-cart route returns 503 in **exactly three** cases (in order):

| # | Condition | Response body (short) |
|---|-----------|------------------------|
| 1 | Missing `NEXT_PUBLIC_KROGER_SERVICE_URL` or `KROGER_SERVICE_SECRET` | "Kroger service not configured (missing...)" |
| 2 | Missing `KROGER_CLIENT_SECRET` (empty) | "set KROGER_CLIENT_ID and KROGER_CLIENT_SECRET in Vercel... then redeploy." |
| 3 | `getKrogerToken()` threw (Kroger API rejected credentials) | "check KROGER_CLIENT_ID / KROGER_CLIENT_SECRET" |

- **1 or 2** → The **deployment currently serving shopolive.xyz** doesn’t see those env vars (wrong project, or that deployment was built before vars were set).
- **3** → Env vars are present but **Kroger’s token API** rejected the request (wrong secret, app disabled, etc.).

---

## Deployment vs domain (why we might still get 503)

- **Vercel project:** `jeff-adkins-projects/cartpilot`. We ran `vercel env ls` and confirmed `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET` are set for **Production**.
- **Important:** The **production domain** (shopolive.xyz) is assigned to one specific deployment. That deployment is usually “latest from the **production branch** of the **connected Git repo**” (e.g. `repairman29/olive` main).
- When we ran `vercel --prod` from **olive-e2e** (CLAWDBOT), we created a **new** deployment from **local files**. That deployment gets a URL like `cartpilot-xxx.vercel.app`, but **shopolive.xyz might still be pointing at an older Git-based deployment** that was built when env vars were missing or different. So the live site can still be an old build.

**Takeaway:** For shopolive.xyz to use the env vars, the deployment that **Vercel assigns to the production domain** must be one that was built **after** the vars were set. That usually means:
- **Redeploy from the Vercel Dashboard** (Deployments → ⋯ on latest **Production** → Redeploy, **uncheck** “Use existing Build Cache”), **or**
- **Push a commit** to the connected repo’s production branch so Vercel builds from Git.

Deploying from the CLI from olive-e2e does **not** by itself change which deployment serves shopolive.xyz unless the project is configured to use “latest deployment” for production (some setups do that).

---

## Step 1: See what the live deployment actually sees

A small **diagnostic route** was added: **GET** `/api/kroger/env-check`. It returns (no secrets):

- Which Kroger-related env vars are set (booleans).
- Whether the add-to-cart route would pass the env checks (`addToCartReady`).
- A **token check**: it calls Kroger’s token endpoint once and reports `ok: true` or `krogerError: "..."`.

**You need to deploy this route first** (see Step 2). Then:

1. Open: **https://shopolive.xyz/api/kroger/env-check**
2. You’ll see JSON like:
   - `env`: `NEXT_PUBLIC_KROGER_SERVICE_URL`, `KROGER_SERVICE_SECRET`, `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET` (true/false).
   - `addToCartReady`: true only if all four are set.
   - `tokenCheck`: `{ ok: true }` or `{ ok: false, krogerError: "..." }`.

**How to interpret:**

- **Any env false** → That deployment doesn’t have the var. Fix: ensure the **project that serves shopolive.xyz** has the var for Production, then redeploy **that project** (Dashboard redeploy from latest Production, cache off).
- **addToCartReady true but tokenCheck.ok false** → Env is present but Kroger API rejected the token request. Use `krogerError` (e.g. `invalid_client`) and fix the secret in [Kroger Developer Portal](https://developer.kroger.com/) and in Vercel, then redeploy.
- **addToCartReady true and tokenCheck.ok true** → Env and Kroger token are OK on that deployment; if add-to-cart still returns 503, the failure is later (e.g. cart service or network). Check Vercel function logs for the add-to-cart request.

---

## Step 2: Deploy the diagnostic (and fixes) to the live site

The diagnostic route and the dashboard crash fix live in **olive-e2e** (CLAWDBOT). For shopolive.xyz to get them:

**Option A – Vercel is connected to repairman29/olive**

1. Copy the new/updated files from CLAWDBOT into **repairman29/olive**:
   - `olive-e2e/src/app/api/kroger/env-check/route.ts` → `src/app/api/kroger/env-check/route.ts`
   - `olive-e2e/src/app/dashboard/page.tsx` (add-to-cart handler + safe results) → `src/app/dashboard/page.tsx`
2. Commit and push to the production branch (e.g. `main`).
3. Wait for Vercel to build and assign the new deployment to Production (if that’s how the project is set up). Confirm **Settings → Domains** that shopolive.xyz is on this project and production.

**Option B – Deploy from olive-e2e and make that deployment production**

1. From CLAWDBOT: `cd olive-e2e && npx vercel --prod --yes`
2. In Vercel Dashboard → **cartpilot** → **Deployments**: find this new deployment and **promote it to Production** (e.g. ⋯ → “Promote to Production”) so that shopolive.xyz serves it.
3. Then open https://shopolive.xyz/api/kroger/env-check and use the interpretation above.

---

## Step 3: Confirm which project serves shopolive.xyz

- Vercel Dashboard → **cartpilot** (or the project you use for Olive) → **Settings → Domains**.
- Check that **shopolive.xyz** is listed and assigned to **Production** for **this** project. If the domain is on another project, set the same env vars **there** and redeploy that project; use env-check on that deployment.

---

## Checklist

- [ ] Open https://shopolive.xyz/api/kroger/env-check (after deploying the env-check route).
- [ ] If any env is false: set missing vars on the **project that serves shopolive.xyz** (Production), then redeploy (Redeploy, cache off).
- [ ] If tokenCheck.ok is false: fix `KROGER_CLIENT_SECRET` (Kroger Developer Portal + Vercel), then redeploy.
- [ ] Confirm **Settings → Domains**: shopolive.xyz is on the project you’re editing.
- [ ] Redeploy from **latest Production** in the Dashboard (uncheck “Use existing Build Cache”) so the deployment that gets the domain is a fresh build with current env.

Once env-check shows all green and tokenCheck.ok is true, add-to-cart should succeed unless the failure is elsewhere (e.g. Railway Kroger service or cart API).

### Per-item add and out-of-stock

The **Railway kroger-oauth** service adds items to Kroger **one at a time** and returns `itemResults` (per-item `added` / `error`). Olive uses this to show which items were added and which failed (e.g. out of stock). Redeploy **services/kroger-oauth** (e.g. push to repo or `railway up`) after changing `server.js` so production uses the new behavior.
