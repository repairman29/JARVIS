# Olive (cartpilot) – Vercel build fix

The Olive app source lives in the **repairman29/olive** repo. This folder in CLAWDBOT only has build output (`.next`) and Vercel link config, so it has **no `app` or `pages` directory** and cannot be built here.

## "No Next.js version detected" or "Couldn't find any pages or app directory"

**Cause:** The project is building from a directory that has no Next.js app. If it’s connected to **CLAWDBOT**, the root `package.json` there has no `"next"` — Olive lives in **repairman29/olive**.

**Fix:**

1. **Connect to the Olive repo**
   - [Vercel Dashboard](https://vercel.com) → **cartpilot** → **Settings** → **Git**.
   - **Connected Git Repository** must be **repairman29/olive**. If it’s CLAWDBOT or something else, change it to **repairman29/olive**.

2. **Root Directory**
   - **Settings** → **General** → **Root Directory**.
   - Use **`.`** or leave **blank** (repo root). Olive has `package.json` with `next` at the root. Don’t use `apps/cartpilot` or another subfolder.

3. **Redeploy**
   - **Deployments** → **⋯** on latest → **Redeploy**.

## 503 "Kroger product search unavailable" on Add to cart

**Cause:** The live deployment was built without `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET`. Env vars are applied only to **new** deployments.

**Fix:**

1. **Confirm env vars** — **Settings** → **Environment Variables**. For **Production** (and Preview if you use it), ensure:
   - `KROGER_CLIENT_ID` (e.g. `jarvisshopping-bbccng3h`)
   - `KROGER_CLIENT_SECRET` (from Kroger Developer Portal, same app as OAuth)
2. **Redeploy with fresh build** — **Deployments** → **⋯** on latest Production → **Redeploy** → **uncheck** "Use existing Build Cache" → confirm.
3. Wait for the new deployment to be **Ready**, then try Add to cart again on [shopolive.xyz](https://shopolive.xyz).

**If 503 persists (and "Use existing Build Cache" was off):**

- **Which 503?** In DevTools → Network → click the `add-to-cart` request → **Response** tab. The body will tell you:
  - *"set KROGER_CLIENT_ID and KROGER_CLIENT_SECRET in Vercel"* → the **running** deployment still doesn’t see `KROGER_CLIENT_SECRET`. Confirm the project that serves shopolive.xyz (Settings → Domains) and that `KROGER_CLIENT_SECRET` is set for **Production** (no typo, no extra spaces). Then redeploy that project again.
  - *"check KROGER_CLIENT_ID / KROGER_CLIENT_SECRET"* → the secret is present but **Kroger’s token API rejected** the credentials (wrong app, wrong secret, or Kroger issue). Re-check the value in [Kroger Developer Portal](https://developer.kroger.com/) (same app as `jarvisshopping-bbccng3h`) and update the env var if needed, then redeploy.
- **Right project?** Vercel → **Settings → Domains**. Ensure **shopolive.xyz** is assigned to this project. If it’s on another project, set the same env vars there and redeploy that one.
- **Vercel logs:** Deployments → latest Production → **Functions** (or **Logs**). Reproduce Add to cart and check for errors; the log may show the exact Kroger or env error.
