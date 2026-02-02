# Olive E2E Tests (Playwright)

## Run all tests

```bash
npm run test:e2e
```

Uses `http://localhost:3001` (starts dev server if not running).

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

These tests need a signed-in user. You can use **saved login (Google)** or **email/password**.

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
