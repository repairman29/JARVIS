# Olive — Project overview, feedback & expansion

**Olive** turns a simple list into a Kroger cart: paste a list or recipe link, connect your Kroger (or King Soopers) account, and Olive finds items and adds them to your cart. Built for friends, family, and beta testers.

---

## Try Olive

- **Live app:** [shopolive.xyz](https://shopolive.xyz)
- **What to do:** Sign in (Google or email) → add items (type, paste a list, or paste a recipe URL) → connect Kroger when prompted → add to cart → open cart on King Soopers / Kroger to checkout.
- **Stores:** King Soopers and Kroger (same account). Set your store on the dashboard after connecting.

---

## Give feedback

We want feedback from friends and family to improve Olive before widening the beta.

**How to share feedback**

1. **In-app (after a haul)**  
   If you see “How did we do?” or “Nailed it / Not quite,” use it. Responses are stored and used to improve picks.

2. **Direct**  
   Send a short note (email, text, or DM) with:
   - What you did (e.g. “Added milk, eggs, pasta, then added to cart”).
   - What worked well.
   - What was confusing or wrong (e.g. “Wrong milk size,” “Connect Kroger button was hard to find,” “Recipe link didn’t work”).

3. **GitHub (if you use it)**  
   Open an issue at [github.com/repairman29/olive/issues](https://github.com/repairman29/olive/issues): bug report, idea, or “it was great.”

**What we care about**

- Ease of sign-in and connecting Kroger.
- List and recipe paste (Smart Paste, recipe link) working as you expect.
- Add-to-cart: right items, right sizes, no 503 or “couldn’t add” without a clear reason.
- Any moment you thought “I don’t know what to do next” or “this doesn’t look right.”

---

## What Olive does today

- **Lists:** Type items or use **Smart Paste** (paste a messy list; Olive parses it and you confirm before adding).
- **Recipes:** Paste a recipe URL (AllRecipes, Food Network, etc.) or search recipes; add ingredients to your list with optional servings.
- **Budget vs Splurge:** Toggle for sale-first vs preferred brands.
- **Quantity:** “Exact” (closest match) or “Grandma mode” (round up / prefer larger size so you don’t run out).
- **Kroger:** Connect once; Olive adds to your cart. You review and pay on Kroger/King Soopers.
- **Help:** [shopolive.xyz/help](https://shopolive.xyz/help) — FAQs and trust (we never place orders; OAuth only).

---

## Known limitations

- **Kroger only** — No other grocery chains yet.
- **No digital coupons in Olive** — We use sale flags from Kroger’s API; clip digital coupons on Kroger/King Soopers for extra savings.
- **Recipe extract/search** — Depends on Spoonacular; some recipe URLs may fail or return “not configured” if keys aren’t set.
- **Store** — You pick one store (ZIP search on dashboard); we use it for product search and add-to-cart.

If something breaks (e.g. “Add to cart” always fails or sign-in doesn’t work), note the exact step and we’ll treat it as a priority.

---

## For beta testers (friends & family)

1. Go to [shopolive.xyz](https://shopolive.xyz) and sign in (Google is fastest).
2. Add a few items (e.g. “milk,” “eggs”) or paste a short list.
3. When prompted, connect Kroger (or King Soopers). You’ll sign in on Kroger’s site and be sent back to Olive.
4. Click “Add to Kroger cart,” then “Open cart” and confirm the right items are in the cart on King Soopers / Kroger.
5. Send us one sentence: what was smooth, and what was confusing or wrong.

No install required — it’s a website. Works best in a modern browser (Chrome, Safari, Edge, Firefox).

---

## For contributors & expansion

**Code and issues**

- **Repo:** [github.com/repairman29/olive](https://github.com/repairman29/olive)
- **Tech:** Next.js (App Router), Supabase (auth + optional DB), Vercel (hosting), Railway (Kroger OAuth service).

**Docs in the Olive repo (when cloned)**

- **Product & design:** `docs/OLIVE_PRODUCT_MASTER_MANUAL.md` — voice, tokens, onboarding, Granny logic.
- **Troubleshooting:** `docs/TROUBLESHOOTING.md` — auth, 503, store save, recipes.
- **Add-to-cart 503:** `docs/ADD-TO-CART-503-REVIEW.md` — env-check, deployment, Kroger credentials.
- **E2E tests:** `e2e/README.md` — how to run Playwright tests (smoke, auth, recipe, Smart Paste).

**Deploy**

- **Vercel:** Project `cartpilot`; production domain shopolive.xyz. Deploy from repo or `npx vercel --prod` from the Olive app root.
- **Kroger OAuth:** Railway service; see Olive repo for env and callback URL.

**Expansion ideas (backlog)**

- More chains (e.g. other grocers).
- Saved lists / recurring hauls.
- Better “first run” and onboarding.
- Fuel points / coupons surface in the app (where API allows).

---

## One-line summary

**Olive:** Your kitchen list → Kroger cart. Sign in, add items (or paste a list/recipe), connect Kroger once, then add to cart and checkout on King Soopers / Kroger. Feedback welcome so we can make it better for everyone.
