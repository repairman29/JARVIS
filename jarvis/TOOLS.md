# Available Tools / Skills

Tools and skills JARVIS can use. Call the appropriate tool when the user asks; then summarize the result.

---

## Kroger / King Soopers (grocery)

**Skill:** `kroger` (installed). Use for any Kroger/King Soopers product search, prices, shopping lists, or store lookup.

| Tool | When to use |
|------|--------------|
| `kroger_search` | User asks for price or search: "price of milk at Kroger", "search Kroger for eggs" |
| `kroger_stores` | User asks for stores: "Kroger near 80202", "King Soopers stores 80123" |
| `kroger_shop` | User wants a list with prices: "shopping list for tacos", "Kroger shop milk eggs bread". Supports quantities and fulfillment (curbside/delivery). Reply with orderSummary, total, cartUrl, and product links for a flawless handoff. |
| `kroger_cart` | User wants to open cart: "open my Kroger cart", "Kroger cart" |
| `kroger_add_to_cart` | Add items by UPC to user's Kroger cart. Requires `KROGER_REFRESH_TOKEN` (run oauth-helper.js once). |
| `kroger_shop_and_add` | Build list by search terms **and** add those items to user's Kroger cart. Requires `KROGER_REFRESH_TOKEN`. Prefer this when user says "add X to my Kroger cart" or "order X from Kroger". |

**Env:** `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`, `KROGER_LOCATION_ID` (required for prices). For add-to-cart: `KROGER_REFRESH_TOKEN` (one-time OAuth; see `skills/kroger/CART_API.md`).

---

## Other skills

Add sections here for each skill you install (Spotify, Hue, GitHub, etc.) so the agent knows when to use them. Example:

| Tool / skill | When to use |
|--------------|-------------|
| (e.g. spotify-player) | Music: play, pause, search, skip |
| (e.g. openhue) | Smart lights: turn on/off, dim, scenes |
| (e.g. gog / google) | Gmail, Calendar, Drive (see ~/jarvis/skills/google/SKILL.md) |
