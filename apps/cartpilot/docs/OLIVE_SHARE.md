# Olive — Your kitchen companion

**Try it:** [shopolive.xyz](https://shopolive.xyz)

---

## What is Olive?

Olive is a simple app that takes the chore out of grocery shopping. You tell her what you need (milk, eggs, sourdough, whatever). She finds your usual brands, clips digital coupons, and builds your **Kroger** cart so it’s ready when you are. You still review and checkout yourself—Olive never places the order.

Think of her as a kitchen companion: one place to keep your list, connected to your Kroger account so your cart is filled instead of you hunting and tapping.

---

## Who is it for?

- Anyone who shops at **Kroger** (or Kroger-family stores: King Soopers, Fred Meyer, Ralphs, etc.) and wants a faster way to build a cart.
- People who like their usual brands and want Olive to remember them (“My Favorites” mode).
- People who’d rather grab the best deal (“Best Value” mode).
- Friends and family who’d try something new if it’s simple and doesn’t lock them in.

---

## How Olive Helps

- **Connect Once:** Securely link your Kroger account so Olive can do the heavy lifting.
- **Talk to Her:** Type “taco night” or “organic milk.” Olive handles the search, the brand matching, and the coupon clipping.
- **The “Brain” Mode:** Toggle between **“My Favorites”** (for the brands you love) or **“Best Value”** (for the best Kroger deals).
- **Your Final Say:** Olive fills the cart; you review the total and click “Order” in the Kroger app. No surprises, just a full pantry.

**The more you use Olive, the better she gets at knowing your pantry.** She learns your favorite sourdough so you never have to search for it again. That’s her superpower—she invests in you so the next list is even easier.

---

## Life of a Grocery (the cycle)

A simple way to see it:

1. **Trigger** — You notice you’re out of milk (or you’re meal-planning).
2. **Action** — You add “milk” (or “taco night”) to Olive.
3. **Variable reward** — Olive finds it, clips a coupon, and drops it in your cart.
4. **Investment** — She remembers it for next time. Your list gets smarter; your pantry stays full.

No app-store clutter. No surprise checkouts. Just you, your list, and Olive.

---

## Why “Olive”?

Friendly, simple, and a bit different. She’s the thing you reach for when you need a little help in the kitchen—without taking over.

---

## Try it

**[shopolive.xyz](https://shopolive.xyz)** — sign up, connect Kroger, add a few items, and see your cart fill.

**Home Screen Ready.** No app store clutter. Open shopolive.xyz in your browser, tap “Add to Home Screen,” and she’s there when you open the fridge.

Not affiliated with Kroger. Built with care; Olive never places orders for you.

---

## Status

Olive is in **friends & family beta**. We’re running it at [shopolive.xyz](https://shopolive.xyz) and would love feedback from people we know. If something breaks or feels off, tell us—we’re iterating.

---

## UX ideas (for later)

### External trigger: Kitchen sticker / QR

**Why:** When Olive lives in the browser, people can forget she exists *right when* they’re out of milk. A physical cue bridges that gap.

**Idea:** A small 🫒 sticker or printable card with a QR code to **shopolive.xyz**. Stick it on the fridge or near the shopping list. “Out of milk? Scan → add to Olive.”

**Next step:** Design a simple “Kitchen Sticker” (one-sided card or sticker) with QR + shopolive.xyz + short line. Can be printed at home or ordered as stickers.

### Welcome email (post–sign up)

**Why:** The moment someone signs up at shopolive.xyz is the highest-intent moment. A short email can reinforce the habit: connect Kroger → add one item → see the cart.

**Idea:** Trigger an email right after signup (e.g. via Supabase Auth hook or a small backend job). Copy could include:
- “You’re in. One more step: connect Kroger.”
- Link to dashboard (or direct to Connect Kroger).
- Reminder: “Add one thing to your list and hit ‘Add to Kroger Cart’—you’ll see how it feels.”
- Optional: “Add shopolive.xyz to your home screen” + link.

**Next step:** Draft the welcome-email copy and wire it to signup (Supabase or your stack).
