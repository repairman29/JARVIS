# Olive E2E Tests (Playwright)

## Run all tests — checklist

To run **all 50 tests** (including authenticated dashboard and chromium-authed):

1. **Credentials in `.env.test`**  
   `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` for a user that exists in the **same Supabase project** as the app.  
   Example (already set locally): `jeffadkins1@gmail.com` / `OliveE2eTest123!`  
   (`.env.test` is gitignored.)

2. **App can reach Supabase**  
   In `olive-e2e`, the dev server needs Supabase (e.g. `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) so login and dashboard work. If you use shopolive.xyz’s project, point those env vars at that project.

3. **Saved login for chromium-authed (20 tests)**  
   Run once (browser opens; sign in with Google or the same email/password):

   ```bash
   npm run test:e2e:auth-setup
   ```

   This writes `.auth/user.json` (gitignored). Without it, the **chromium-authed** project fails with `ENOENT: .auth/user.json`.

4. **Run the full suite**

   ```bash
   cd olive-e2e && npm run test:e2e
   ```

   Playwright starts the dev server on **port 3003** if needed (`reuseExistingServer: true`).  
   To run against production instead: `PLAYWRIGHT_TEST_BASE_URL=https://shopolive.xyz npm run test:e2e` (and do auth-setup against prod if you want chromium-authed to pass).

**TL;DR:** `.env.test` with TEST_USER_* → run `npm run test:e2e:auth-setup` once (headed) → then `npm run test:e2e`. App must have Supabase env (e.g. `.env.local`) so login works.

---

## Run all tests (command)

```bash
npm run test:e2e
```

Uses `http://localhost:3003` (starts dev server if not running). Port 3003 avoids clash with jarvis-ui on 3001.

## Run against production (shopolive.xyz)

**Smoke (no prod user required):**

```bash
npm run test:e2e:prod:smoke
```

Runs home, login, and “redirect to login when not signed in” (12 tests). No `TEST_USER_*` needed.

**Full prod (includes add-to-cart, King Soopers cart):**

```bash
npm run test:e2e:prod
```

Requires `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env.test` for a user in the **same Supabase project** as shopolive.xyz (Vercel env `NEXT_PUBLIC_SUPABASE_URL`). Otherwise login stays on `/login` and authenticated tests fail.

You can also set `PLAYWRIGHT_TEST_BASE_URL=https://shopolive.xyz` and run `npx playwright test` (no local server).

## Run with UI

```bash
npm run test:e2e:ui
```

## Authenticated dashboard tests (add-to-cart, King Soopers cart)

These tests need a signed-in user. The **chromium-authed** project uses `.auth/user.json`; if that file is missing, those tests fail with `ENOENT: no such file or directory, open '.auth/user.json'`. Run `npm run test:e2e:auth-setup` once (headed) to create it, or use **email/password** (see below).

### Option A — Use your Google login (e.g. jeffadkins1@gmail.com)

1. **Save your session once** (browser opens; log in with Google when it does):

   ```bash
   npm run test:e2e:auth-setup
   ```

   For **prod** (shopolive.xyz), so add-to-cart tests run against prod:

   ```bash
   PLAYWRIGHT_TEST_BASE_URL=https://shopolive.xyz npm run test:e2e:auth-setup
   ```

   You have 2 minutes to sign in with Google; after redirect to the dashboard, the session is saved to `.auth/user.json` (ignored by git).

2. **Run dashboard tests with that session:**

   ```bash
   npm run test:e2e:dashboard-authed
   ```

   For prod:

   ```bash
   PLAYWRIGHT_TEST_BASE_URL=https://shopolive.xyz npm run test:e2e:dashboard-authed
   ```

### Option B — Email/password

Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env.test` (user must exist in the same Supabase project as the app). Then run `npm run test:e2e`; the dashboard tests will log in with the form.

**Option B2 — create a test user:** copy `.env.test.example` to `.env.test`, set Supabase URL and anon key, set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`, then:

```bash
npm run create-test-user
npm run test:e2e
```

## What’s covered

- **Home**: Olive branding, CTAs (Join the Beta, Continue with Kroger, View Kroger Cart), How it Works, FAQ, Kroger family
- **Login**: Form, Continue with Kroger link, `?then=connect` message, sign in / create account toggle, invalid creds stay on login
- **Dashboard (unauthenticated)**: Redirect to login when not signed in
- **Dashboard (authenticated, optional)**: Olive UI, Budget vs Splurge, add/remove item, quick add, add to Kroger cart (no 503; success or connect message), item results (Added / Couldn't add / Out of stock), open King Soopers cart URL and verify page loads
- **Recipes**: Recipe modal shows paste-link input; paste recipe URL → Get recipe → either recipe name + "Add ingredients to list" or error; recipe search (e.g. "pasta") → "From the web" or "No results" → if results, select recipe and see "Add ingredients to list" and Servings; add ingredients from recipe to list → haul shows at least one item and "Added ingredients for" message
- **Smart Paste (paste lists)**: Paste blob (e.g. "2x milk, avocados (soft), trash bags") → "Sort my list" → modal shows exact parsed items (milk with Qty 2, avocados with Note: soft, trash bags) → "Add to list" → haul shows milk ×2, avocados, trash bags. Granny logic: "2x milk, 3x milk" merges to Milk ×5 in list
