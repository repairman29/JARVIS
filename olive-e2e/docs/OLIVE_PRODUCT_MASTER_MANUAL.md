# 🫒 Olive: Product Master Manual & North Star

**"Your kitchen companion — turn a simple list into a Kroger cart, with recipes and your store in mind."**

---

## Next (Olive)

*Keep this list to 3–5 bullets; update as you ship.*

1. **E2E green** — Run `npm run test:e2e:dashboard-authed` (or with `TEST_USER_*`) and fix any flaky/skipped recipe or Smart Paste tests.
2. **Recipe → haul** — E2E already covers “add ingredients from recipe → haul has items”; keep it green and add more specific ingredient assertions if desired.
3. **Onboarding** — First-run guide, Connect Kroger timing, First Haul celebration copy; align with §5 and §6.
4. **Add-to-cart reliability** — If 503s or “couldn’t add” spike, use `olive-e2e/docs/ADD-TO-CART-503-REVIEW.md` and env-check; tune error messaging.
5. **Bento & progress** — Fuel points / coupons tiles, typewriter progress; ship or hide until ready. (No separate “granny narrative” — the logic is in code.)

---

## 1. Product Vision & Persona

### The Core Philosophy
Olive is a **Facilitator**, not a "Dealer." Grounded in Nir Eyal’s **Hook Model** and **Indistractable** principles, Olive aims to reduce the "mental load" of grocery shopping while maintaining healthy user agency.

*   **Persona:** The **Intuitive Pantry-Keeper**. Calm, anticipatory, and helpful. 
*   **Voice:** A peer, not a platform. Speak like a friend at the kitchen counter.
*   **Aesthetic:** **"Kitchen Table"** — warm, organic, and expressive minimalism.

---

## 2. Design System (Tokens)

To maintain the brand vibe, use these named tokens for all UI elements.

| Functional Role | Token Name | Hex Code | Psychological Context |
| :--- | :--- | :--- | :--- |
| **Primary Action** | **Sage Advice** | `#556B2F` | Trust, wisdom, and action. |
| **Success/In-Cart** | **Basil** | `#8FBC8F` | Organic growth, "Mission Complete". |
| **Warning/Error** | **Heirloom Tomato** | `#D24D33` | Natural urgency, non-alarming. |
| **Background** | **Parchment** | `#FFFDF0` | Homey, reduces eye strain. |
| **Typography/Ink** | **Cast Iron** | `#2F4F4F` | Grounded, high legibility. |

### Typography Rules
*   **Headings:** Warm Serif (e.g., *Libre Baskerville*).
*   **Body/UI:** Functional Sans-Serif (e.g., *Inter* or *Public Sans*).

---

## 3. Core Component Specifications

1.  **Command Input:** Vertical-expanding textarea. Placeholder: *"What's missing from the kitchen?"*
2.  **Haul Item Card:** 24px rounded corners. States: Grey (Pending), Pulsing Sage (Searching), Basil (In-Cart).
3.  **Mode Toggle:** Segmented pill toggle between **Budget** (sale-first) and **Splurge** (brand-first).
4.  **Quantity Toggle:** Segmented pill toggle between **"Exact"** and **"Grandma Mode"** (Overshoot).
5.  **Narrative Progress:** Typewriter-style status updates instead of a generic circular spinner.
6.  **Bento Tiles:** Modular containers for secondary content (Fuel points, coupons).

---

## 4. Granny Logic (The Brain)

*Implemented in `olive-e2e/src/app/api/kroger/add-to-cart/route.ts` — no separate narrative/copy.*

1.  **Unit Normalization:** `parseSize` + `normalizeToOz` (16 oz = 1 lb, etc.) for comparing product sizes when picking.
2.  **Cost-to-Satisfy:** Sort by best per-unit price first; sale is a tiebreaker in Budget mode (Sale Trap).
3.  **The Sale Trap:** We pick best per-unit first; only then prefer sale in Budget — we never choose sale over a better per-unit alternative.
4.  **Overshoot (Grandma mode):** Quantity rounds up (`Math.ceil(quantityRequested)`); when per-unit is tied we prefer the larger normalized size so you don’t run out.

---

## 5. The Onboarding Funnel

1.  **Empty State:** Show "Ghost Items" (Milk, Eggs, Bread) with a `+` icon to signal behavior.
2.  **Aha! Moment:** User adds first item; Olive finds it instantly.
3.  **Investment:** Ask for Kroger connection *after* the first successful match.
4.  **PWA Trigger:** Prompt "Add to Home Screen" to turn the URL into a permanent kitchen habit.

---

## 6. Interaction & Celebration Maps

### The "Sieve" Flow
*   **Input (The Blob):** Paste messy text or URL.
*   **Processing (The Sieve):** Olive parses and cleans fluff.
*   **Verification (The Haul):** User reviews cards; low-confidence items get an Heirloom Tomato flag.
*   **Completion (The Basil):** Items shift to Basil green upon successful cart addition.

### Post-Haul Celebration
After the first checkout, show the **Smart Shopper Stats**:
*   **Time Saved:** (e.g., "12 minutes back in your life").
*   **Savings Found:** (Total pennies saved vs regular prices).
*   **Fuel Points:** Progress toward pump discounts.

---

## 7. Help & Trust (Radical Transparency)

*   **Agency Rule:** Olive fills the cart; you review and pay on Kroger. Olive **never** places orders.
*   **Security Handshake:** OAuth-only. Olive never sees or stores your password or credit card.
*   **Humility:** If Olive is confused, she asks for help (Tomato icon) rather than making a wrong guess.

---

## 8. Operations & Verification

### Kroger token check (env-check)
- **URL:** `https://shopolive.xyz/api/kroger/env-check`
- **Purpose:** Confirm the deployment has correct Kroger env vars and that the Kroger API accepts client credentials (no secrets exposed).
- **Expected:** `"tokenCheck":{"ok":true}`. If `ok: false`, fix `KROGER_CLIENT_ID` / `KROGER_CLIENT_SECRET` in Vercel (and Railway for kroger-oauth), then redeploy.

### OAuth → Connect Success
- **Flow:** User clicks “Connect Kroger” on Olive → Olive calls Railway kroger-oauth `/auth/url` with `return_url=https://shopolive.xyz/connect/success?userId=...&store=...` → User authorizes on Kroger → Railway callback exchanges code, saves token, then **redirects immediately** to that `return_url` so the user lands on Olive’s “You’re all set!” page.
- **Railway service:** `services/kroger-oauth` (SERVICE_URL must match Railway URL in Kroger Developer Portal redirect URIs).

### Deploy
- **Olive (Next.js):** Vercel project **cartpilot**; production domain **shopolive.xyz**. Deploy from repo or `npx vercel --prod` from `olive-e2e`.
- **Kroger OAuth:** Railway; env: `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`, `SUPABASE_*`, `KROGER_SERVICE_SECRET`, `SERVICE_URL`.

---

## 9. Help Center & Copy (North Star)

**Voice:** Peer, not platform. Clarity over cleverness. Radical transparency.

### Trust & Privacy
- **Q: Does Olive place the order for me?** — "Never. Olive's job is to do the heavy lifting of finding your items and filling your cart. Once your haul is ready, we hand the baton to you on the Kroger site so you can review deals and hit the final 'checkout' button yourself."
- **Q: Is my Kroger password safe?** — "Absolutely. Olive never sees or stores your password. We use a secure 'handshake' with Kroger (OAuth) that lets us tuck items into your cart without ever having access to your sensitive login info or credit cards."

### Using the "Magic"
- **Q: How does 'Magic Paste' work?** — "It's like a kitchen sieve for your screen! Just paste a recipe link or a messy text list into the main box. Olive reads the text, ignores the 'fluff' like cooking instructions, and identifies exactly which ingredients you need for your cart."
- **Q: What is 'Budget vs. Splurge' mode?** — "You're the pilot of your pantry. Budget mode tells Olive to hunt for store brands and sale items to save you money. Splurge mode tells her to prioritize your favorite premium brands and the items you usually love."

### Troubleshooting
- **Q: Why couldn't Olive find an item?** — "Sometimes items are out of stock or described in a way that confuses Olive's search. If she's not 100% sure, she'll flag it with an Heirloom Tomato icon so you can give it a quick look."

### Kroger Connection Success Screen
- **Headline:** You're all set!
- **Sub-headline:** Olive is now connected to your **[Store Name]**. She's ready to start tucking items into your cart.
- **What's Next bento tiles:** Magic Paste (Paste a Link) | Pantry Staples (Quick Add Essentials).
- **Security Handshake FAQ:** "Now that I'm connected, what can Olive see?" — "Just enough to be helpful! Olive can see your preferred store and your past purchases so she can suggest your favorite brands. She **cannot** see your password, your credit card, or place an order without you. You're always the pilot."
- **Footer:** "Add Olive to your home screen for one-tap access."

### First Haul Celebration
- **Headline:** Mission accomplished!
- **Sub-headline:** Olive is so happy she could help with your first haul. Here's how you did today:
- **Savings Report:** Compared to regular prices, Olive saved you $X.XX on this haul (or placeholder until first haul).
- **Stats:** Time Saved | Savings Found | Fuel Points.
- **Mentor Feedback:** "Did I get your brands right today?" — Nailed it! | Not quite.
- **CTA:** "Back to My Kitchen" (Sage Advice).

---

**Source of Truth Version:** 1.2 (Jan 2026)  
**Status:** Deployed & Live  
**URL:** [shopolive.xyz](https://shopolive.xyz)
