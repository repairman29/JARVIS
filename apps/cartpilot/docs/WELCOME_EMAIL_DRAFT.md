# Welcome Email — Draft Copy

**Trigger:** User signs up at shopolive.xyz (Supabase Auth: `auth.user.created` or equivalent).

**Goal:** Reinforce the habit in the first 5 minutes—connect Kroger, add one item, see the cart. Low friction, high clarity.

---

## Subject line options

- **You’re in. One more step.** (short, action-oriented)
- **Olive’s ready. Connect Kroger and add your first item.** (clear, two-step)
- **Your kitchen companion is ready** (friendly, brand)

---

## Body (plain text / simple HTML)

**Version A — Minimal**

```
Hey,

You’re in. Olive’s ready to help.

→ Connect your Kroger account (one-time): [Link to dashboard or /dashboard?connectKroger=1]

Then add something to your list—milk, eggs, whatever—and hit “Add to Kroger Cart.” You’ll see your cart fill. You still checkout in Kroger when you’re ready.

Tip: Add shopolive.xyz to your phone’s home screen so she’s there when you open the fridge.

— Olive
```

**Version B — Slightly warmer**

```
Hey,

Thanks for joining Olive. She’s your kitchen companion—you tell her what you need, she fills your Kroger cart. You stay in control and hit “Order” when you’re ready.

Next step: Connect Kroger (takes a minute). Then add one thing to your list and tap “Add to Kroger Cart.” That’s it.

[Connect Kroger →]

Want her handy? Add shopolive.xyz to your home screen. No app store, no clutter—just Olive when you need her.

— Olive
```

---

## CTA link

- **Primary:** `https://shopolive.xyz/dashboard?connectKroger=1` (signed-in user lands on dashboard with “Connect Kroger” message).
- **Secondary:** `https://shopolive.xyz/dashboard` (if they’re already connected).

---

## Implementation notes

- **Send time:** Immediately after signup (or within 1–2 minutes if you batch).
- **From name:** “Olive” or “Olive at shopolive.xyz”.
- **One email only** for now (no drip unless you add later).
- **Unsubscribe:** Include a one-click unsubscribe; for beta you can keep it simple (“Reply STOP to opt out”).

To wire this up you’ll need: Supabase Auth hook (or Edge Function) → your email provider (Resend, SendGrid, Postmark, etc.) or a small serverless function that sends on `user.created`.
