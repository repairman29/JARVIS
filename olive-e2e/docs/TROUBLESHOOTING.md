# Olive – Troubleshooting

**Priorities:** See [OLIVE_PRODUCT_MASTER_MANUAL.md](./OLIVE_PRODUCT_MASTER_MANUAL.md) → **Next (Olive)** for what to focus on first (e2e, onboarding, add-to-cart, bento).

---

## Production 401 / wrong Supabase (Vercel CLI)

**Already done via CLI:** `NEXT_PUBLIC_SUPABASE_URL` is set to `https://YOUR_PROJECT_REF.supabase.co` for Production. The old project (`your_other_project_ref`) vars were removed.

**You still need to set the anon key** (from [YOUR_PROJECT_REF → API](https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api), copy **anon public**):

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY='eyJ...' npm run vercel:set-supabase-key
```

Then redeploy: `vercel --prod` or Vercel Dashboard → Redeploy.

---

## Store search or save fails

**Store search shows an error (e.g. "Kroger credentials not configured" or "Location lookup failed")**  
- Kroger location search uses the same `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET` as add-to-cart. If add-to-cart is 503, fix Kroger credentials in Vercel/Railway and try again.  
- The dashboard now shows the API error message so you can see the exact reason.

**Clicking a store doesn’t save / "Could not save store"**  
- The app saves your store in `olive_user_settings`. Run the store-preference migration in Supabase so that table has `kroger_location_id` and `kroger_location_name`:  
  In the [Supabase SQL Editor](https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql), run the contents of `supabase/store-preference.sql`.

---

## Recipes with options (e.g. pork vs beef) don’t show

**Only web search results appear; no "Your recipes" with protein/sauce choices**  
- Options like "chicken or beef" and "green or red sauce" come from **saved recipes** in Supabase, not from Spoonacular.  
- Run the recipes migration so "Your recipes" has at least one recipe (e.g. Enchiladas with protein and sauce options):  
  In the [Supabase SQL Editor](https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql), run the contents of `supabase/recipes.sql`.  
- After that, open **Shop for a recipe** and pick **Enchiladas** under "Your recipes (with options like protein/sauce)" to see servings and variant choices.

---

## Console errors

### "Unchecked runtime.lastError: Could not establish connection" / "message port closed"
**Cause:** Browser extensions (Cursor, password managers, ad blockers, etc.) injecting into the page.  
**Fix:** Ignore them, or disable extensions when testing Olive. They are not from the Olive app.

### "utils.js / extensionState.js / heuristicsRedefinitions.js – Failed to load resource"
**Cause:** Same as above – extension scripts.  
**Fix:** Ignore, or run in an incognito window with extensions disabled.

### "icon-192.png / icon-512.png – 404"
**Cause:** PWA manifest asks for icons; either they weren’t deployed or the browser cached an old manifest.  
**Fix:** `public/icon-192.png` and `public/icon-512.png` exist in the repo. If you see 404 on **shopolive.xyz**, commit and push, then trigger a new Vercel deploy so `public/` is updated. Hard-refresh (Ctrl+Shift+R / Cmd+Shift+R) or clear site data for shopolive.xyz to drop the old manifest cache.

---

## Sign up / Sign in returns 401

**Error:** Supabase `/auth/v1/signup` or `/token` returns **401 Unauthorized**, or **Failed to fetch** / **net::ERR_INTERNET_DISCONNECTED**.

Olive uses project **YOUR_PROJECT_REF**: [Dashboard](https://supabase.com/dashboard/project/YOUR_PROJECT_REF).

If the error URL shows **your_other_project_ref** instead, the app is still pointed at the old project. Update env (see below) and redeploy.

**Checks:**

1. **Supabase Dashboard → Authentication → Providers → Email**
   - "Enable Email provider" is **ON**.
   - If "Confirm email" is ON, users must click the confirmation link before signing in.

2. **Env vars (e.g. `.env.local` / Vercel)**
   - `NEXT_PUBLIC_SUPABASE_URL` = **https://YOUR_PROJECT_REF.supabase.co** (Olive’s project).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the **anon public** key from [YOUR_PROJECT_REF → API](https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api) (not the service_role key).
   - **Vercel:** Project Settings → Environment Variables. Set both for Production (and Preview if you use it), then **redeploy** so the new URL is baked into the build.

3. **Project status**
   - Supabase Dashboard: project not paused and no billing/usage blocks.

4. **URL configuration**
   - Authentication → URL Configuration: **Site URL** and **Redirect URLs** include your app (e.g. `https://shopolive.xyz`, `http://localhost:3001`).

After changing Auth or env, restart the dev server or redeploy.

---

## 503 on Add to cart (full review)

**See [ADD-TO-CART-503-REVIEW.md](./ADD-TO-CART-503-REVIEW.md)** for a full back-up-and-review: the three 503 causes, why “deploy from CLI” might not fix shopolive.xyz (domain vs deployment), a **diagnostic route** (`GET /api/kroger/env-check`), and a step-by-step checklist.

---

## 500 on `/api/memory/usuals`, `/api/memory/settings`, or `/api/kroger/add-to-cart`

**Cause:** Server-side APIs need env vars that are **not** exposed to the client. If they’re missing on Vercel, you get 500 (or 503 after recent changes).

**Required on Vercel (Project → Settings → Environment Variables):**

| Variable | Used by | Where to get it |
|----------|---------|-----------------|
| `SUPABASE_URL` | Memory APIs, add-to-cart (preferences) | Same as `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://YOUR_PROJECT_REF.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Memory APIs, add-to-cart (events/preferences) | Supabase Dashboard → API → **service_role** (secret; server only) |
| `NEXT_PUBLIC_KROGER_SERVICE_URL` | Add-to-cart, Connect Kroger | e.g. `https://kroger-oauth-production.up.railway.app` |
| `KROGER_SERVICE_SECRET` | Add-to-cart (calls Kroger service) | Same secret as your Railway Kroger OAuth service |
| `KROGER_CLIENT_ID` / `KROGER_CLIENT_SECRET` | Add-to-cart (product search) | Kroger Developer Portal – same app as OAuth |
| `NEXT_PUBLIC_KROGER_CART_DOMAIN` | Cart link (Open Cart / View Cart) | `www.kroger.com` (default) or `www.kingsoopers.com` for King Soopers |
| `KROGER_LOCATION_ID` | Product search store (zip/region) | Store location ID; for King Soopers in 80904 call `GET /api/kroger/locations?zip=80904` and use one of the returned `locationId` values |

**King Soopers (e.g. 80904):** Set `NEXT_PUBLIC_KROGER_CART_DOMAIN=www.kingsoopers.com` so cart links go to King Soopers. Set `KROGER_LOCATION_ID` to a King Soopers store ID (get one via `GET /api/kroger/locations?zip=80904&chain=King Soopers`). Redeploy after changing env.

**If memory tables don’t exist:** Run the SQL in `supabase/memory.sql` and `supabase/settings.sql` in the Supabase SQL Editor (project YOUR_PROJECT_REF). Otherwise usuals/settings queries can still return 500 with a “relation does not exist”–style error.

**Per-user store preference:** Run `supabase/store-preference.sql` in the same Supabase project to add `kroger_location_id` and `kroger_location_name` to `olive_user_settings`. Then each user can set their store on the dashboard (Your store → Set your store → search by ZIP → pick a location); add-to-cart uses that store for product search.

**Recipes (“shop for a recipe”):** Run `supabase/recipes.sql` in the same Supabase project to create `recipes` and `recipe_ingredients` and seed Enchiladas (protein: chicken/beef, sauce: green/red). Users can click “Shop for a recipe” → pick a recipe → set servings and choices (e.g. chicken, green sauce) → add ingredients to the list.

**After adding or changing these:** You **must redeploy** — env vars are only applied to **new** deployments, not the one that’s already live.

1. Vercel Dashboard → your Olive project (e.g. **cartpilot**) → **Deployments**.
2. Open the **⋯** menu on the latest **Production** deployment → **Redeploy**.
3. Leave **“Use existing Build Cache”** **unchecked** so the build uses the latest env vars.
4. Confirm. Wait for the new deployment to be Ready, then try Add to cart again.

If you use a different Vercel project for shopolive.xyz (e.g. under another team), set `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET` there too and redeploy that project.
