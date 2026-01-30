# Kroger OAuth with Postman

Use this collection to exchange a Kroger authorization code for **access_token** and **refresh_token** (then put `refresh_token` in `~/.clawdbot/.env` as `KROGER_REFRESH_TOKEN`).

## 1. Import the collection

In Postman: **Import** → choose **Kroger-OAuth-Token.postman_collection.json**.

## 2. Get the authorize URL

From the project root (CLAWDBOT), with Kroger credentials in `.env` or `~/.clawdbot/.env`:

```bash
node skills/kroger/oauth-helper.js --postman
```

Copy the **authorize URL** it prints.

(If you don’t have a `.env` yet: copy `.env.example` to `.env`, set `KROGER_CLIENT_ID` and `KROGER_CLIENT_SECRET`, then run the command again.)

## 3. Register redirect URI in Kroger

In [Kroger Developer Portal](https://developer.kroger.com) → your app → add a redirect URI. Use the **exact** URL you’ll use for the callback, e.g.:

- `https://oauth.pstmn.io/v1/callback` (Postman’s OAuth callback), or  
- Any URL you control that shows the redirect (you’ll copy the `code` from the query string).

## 4. Log in and get the code

1. Open the **authorize URL** from step 2 in a browser.
2. Log in with your Kroger account and approve.
3. You’ll be redirected to your callback URL with `?code=...&state=...`.
4. Copy the value of the **code** parameter (the long string).

## 5. Set variables and send in Postman

1. Open the collection **Kroger OAuth Token** → **Variables**.
2. Set:
   - **client_id** — your Kroger app client ID  
   - **client_secret** — your Kroger app client secret  
   - **redirect_uri** — **exact same** redirect URI you added in Kroger (e.g. `https://oauth.pstmn.io/v1/callback`)  
   - **code** — the code you copied from the redirect URL  
3. Send the request **Exchange code for tokens**.

## 6. Save the refresh token

From the response body, copy **refresh_token**. Add to `~/.clawdbot/.env`:

```bash
KROGER_REFRESH_TOKEN=<paste_here>
```

Restart the gateway; add-to-cart will then use this token.
