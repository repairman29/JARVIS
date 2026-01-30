# Kroger skill

Kroger/King Soopers grocery: search products, check prices, find stores, build shopping lists, **and add items to your cart**.

## Requirements

- Node 18+ (uses `fetch`)
- Env: `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`, `KROGER_LOCATION_ID`
- Optional for add-to-cart: `KROGER_REFRESH_TOKEN` (one-time OAuth)

## Install

From CLAWDBOT repo root:

```bash
clawdbot skills install ./skills/kroger
```

Or copy this folder to `~/jarvis/skills/kroger`.

## Credentials

1. [Kroger Developer Portal](https://developer.kroger.com) → create app.
2. Add to `~/.clawdbot/.env`:
   - `KROGER_CLIENT_ID`
   - `KROGER_CLIENT_SECRET`
   - `KROGER_LOCATION_ID` — 8-character store ID from kroger.com when you pick a store.
3. **Add-to-cart (optional):** Add your callback URL in the Kroger app (e.g. `http://localhost:3456/callback` or your Postman callback). Run `node skills/kroger/oauth-helper.js` (local server) or `node skills/kroger/oauth-helper.js --postman` to get the authorize URL and token-exchange steps. Log in with Kroger, then put the **refresh_token** into `.env` as `KROGER_REFRESH_TOKEN`. See `CART_API.md`.

## Tools

- **kroger_search** — Search products by term (prices if `KROGER_LOCATION_ID` set).
- **kroger_stores** — Find stores by ZIP.
- **kroger_shop** — Build list from multiple item terms; returns lines, total, product links.
- **kroger_cart** — Returns Kroger cart URL.
- **kroger_add_to_cart** — Add items by UPC to your cart (requires `KROGER_REFRESH_TOKEN`).
- **kroger_shop_and_add** — Build list by terms and add those items to your cart (requires `KROGER_REFRESH_TOKEN`).

See `SKILL.md` for AI/assistant usage and `CART_API.md` for add-to-cart setup.
