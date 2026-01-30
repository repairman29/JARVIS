# Kroger / King Soopers — Grocery skill

Use this skill when the user asks about **Kroger or King Soopers**: product prices, shopping lists, or store locations.

## Setup

1. Register at [Kroger Developer Portal](https://developer.kroger.com) and create an app.
2. Add to `~/.clawdbot/.env` (or your JARVIS env):
   - `KROGER_CLIENT_ID` — from your Kroger app
   - `KROGER_CLIENT_SECRET` — from your Kroger app
   - `KROGER_LOCATION_ID` — your store ID (8 chars; find at kroger.com when you select a store)
3. Install the skill: `clawdbot skills install ./skills/kroger` (from repo root) or copy `skills/kroger` to `~/jarvis/skills/kroger`.
4. **Add-to-cart (optional):** Get a refresh token once: run `node skills/kroger/oauth-helper.js` (local server) or `node skills/kroger/oauth-helper.js --postman` (use Postman for the callback). In Kroger Developer Portal, add the redirect URI you use (e.g. `http://localhost:3456/callback` or your Postman callback URL). Add the resulting `KROGER_REFRESH_TOKEN` to `~/.clawdbot/.env`. See `skills/kroger/CART_API.md`.

## When to use

- User says: "What's the price of X at Kroger?", "Search Kroger for milk", "King Soopers eggs".
- User wants a shopping list with prices: "Make me a list for tacos", "Kroger shop tortillas beef cheese salsa".
- User asks for nearby stores: "Kroger stores 80202", "King Soopers near 80123".
- User wants to open cart: "Kroger cart", "Open my Kroger cart".

## Tools

| Tool | Use for |
|------|--------|
| `kroger_search` | Single product search (e.g. milk, eggs). Returns names, prices, and product links. Optional `fulfillment`: curbside or delivery. |
| `kroger_stores` | Find stores by ZIP. |
| `kroger_shop` | Multiple items → list with prices, total, **product links**, and **order summary**. Supports quantities and fulfillment filter. |
| `kroger_cart` | Return cart URL for the user to open in browser. |
| `kroger_add_to_cart` | Add items by UPC to the user's Kroger cart. Requires `KROGER_REFRESH_TOKEN` (one-time OAuth; run `node skills/kroger/oauth-helper.js`). |
| `kroger_shop_and_add` | Build list by search terms **and** add those items to the user's cart. Requires `KROGER_REFRESH_TOKEN`. |

## Making the order flawless

- **Quantities:** Use `kroger_shop` with items like `["milk", { "term": "bread", "quantity": 2 }]` so the list and total reflect quantities.
- **Curbside / delivery:** Pass `fulfillment: "curbside"` or `fulfillment: "delivery"` so only available items are returned.
- **Handoff:** After `kroger_shop`, reply with: (1) the **orderSummary** (or a short bullet list), (2) the **total**, (3) **cartUrl** so they can open the cart, and (4) optionally "Open each product link to add to cart" or list **productLinks** so they can add items in one click.
- **Product links:** Every search and shop result includes product URLs; use them so the user can add to cart from the list without re-searching.

## Examples

- **"What does milk cost at King Soopers?"** → `kroger_search({ term: "milk", limit: 5 })`, then summarize top results, prices, and product links.
- **"Shopping list for tacos"** → `kroger_shop({ items: ["tortillas", "ground beef", "cheddar cheese", "salsa"] })`, then reply with **orderSummary**, **total**, **cartUrl**, and suggest opening product links to add to cart.
- **"Curbside list: 2 milk, eggs, bread"** → `kroger_shop({ items: [{ term: "milk", quantity: 2 }, "eggs", "bread"], fulfillment: "curbside" })`, then give summary + total + cart link.
- **"Stores near 80202"** → `kroger_stores({ zipCode: "80202" })`, then list store names and addresses.
- **"Open my Kroger cart"** → `kroger_cart()`, then tell the user to open the returned `cartUrl`.
- **"Add milk and eggs to my Kroger cart"** → If `KROGER_REFRESH_TOKEN` is set: `kroger_shop_and_add({ items: ["milk", "eggs"] })`. Otherwise use `kroger_shop` and give product links.
- **"Add my list to Kroger cart"** (after a list was built) → `kroger_add_to_cart({ items: [ { upc, quantity } from previous shop result ] })` or `kroger_shop_and_add({ items: [...] })` to build and add in one step.

## Notes

- Prices and availability are for the store set in `KROGER_LOCATION_ID`. Without it, search works but no prices.
- Keep search terms short and generic (e.g. "milk", "eggs") for best results.
