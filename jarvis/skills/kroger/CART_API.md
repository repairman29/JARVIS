# Kroger Cart API — Add to cart

The Kroger **Cart API** lets you add items to a customer's cart. The skill supports it when you log in once with your Kroger account and store a **refresh token**.

## One-time setup (add-to-cart)

**Option A — Local server (default)**  
1. In [Kroger Developer Portal](https://developer.kroger.com) → your app → add redirect URI: `http://localhost:3456/callback`.  
2. Run: `node skills/kroger/oauth-helper.js` — browser opens, log in, terminal prints **refresh token**.  
3. Add `KROGER_REFRESH_TOKEN=<paste>` to `~/.clawdbot/.env`.

**Option B — Postman for the callback**  
1. **Import the collection:** In Postman, import `skills/kroger/postman/Kroger-OAuth-Token.postman_collection.json`.  
2. In Kroger Developer Portal → your app → add redirect URI: **your Postman callback URL** (e.g. `https://oauth.pstmn.io/v1/callback`).  
3. Run: `node skills/kroger/oauth-helper.js --postman` — prints the **authorize URL** (no local server).  
4. Open that URL in a browser → log in with Kroger → you’re redirected to a URL with `?code=...`. Copy the **code**.  
5. In Postman: set collection variables **client_id**, **client_secret**, **redirect_uri** (same as in Kroger), **code** (paste). Send **Exchange code for tokens**. Copy **refresh_token** from the response into `~/.clawdbot/.env` as `KROGER_REFRESH_TOKEN=...`.  
   See **skills/kroger/postman/README.md** for step-by-step.

4. **Optional:** `KROGER_MODALITY=PICKUP` (default), `DELIVERY`, or `SHIP` for cart modality.

After that, JARVIS can add items directly to your Kroger cart.

## Tools that use the cart

| Tool | What it does |
|------|--------------|
| `kroger_add_to_cart` | Add items by UPC to your cart. Items: `[ { upc, quantity?, modality? } ]`. |
| `kroger_shop_and_add` | Build a list by search terms **and** add those items to your cart in one step. |

Without `KROGER_REFRESH_TOKEN`, those tools return a clear message and the link to run the OAuth helper; search, shop (list only), and cart URL still work.

## Cart API (reference)

- **GET /v1/carts** — List the user's carts (used to get or create).
- **POST /v1/carts** — Create a cart with items: `{ "items": [ { "upc", "quantity", "modality", "allowSubstitutes" } ] }`.
- **POST /v1/carts/{cartId}/items** — Add one item: `{ "upc", "quantity", "modality", "allowSubstitutes" }`.
- Modality: `PICKUP` (curbside), `DELIVERY`, or `SHIP`.
- Requires OAuth2 **Authorization Code** (user login); the skill uses the stored refresh token to get access tokens.

## Multi-user (future)

Right now one refresh token per env (single user). To support multiple users (e.g. Discord/Telegram), the gateway would pass user identity and the skill would look up a refresh token per user from a store (file or DB).
