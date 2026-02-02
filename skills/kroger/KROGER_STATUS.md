# Kroger Integration Status

## Current Setup ✓

| Component | Status | Details |
|-----------|--------|---------|
| **Railway Service** | ✅ Running | `https://kroger-oauth-production.up.railway.app` |
| **Supabase Tokens** | ✅ Connected | Project: `YOUR_PROJECT_REF` |
| **Token Refresh** | ✅ Scheduled | Every Sunday at 3am |
| **Your User ID** | `jeff` | Stored in `~/.clawdbot/.env` |
| **Store** | King Soopers Westside/Uintah | ID: `62000006` |

## How to Use

### Via Jarvis
Just ask naturally:
- "Add milk and eggs to my Kroger cart"
- "Put bananas, bread, and cheese in my King Soopers cart"
- "Search Kroger for orange juice"

### What Happens
1. Jarvis searches your King Soopers store for products
2. Finds the best match with current prices
3. Adds items to your cart via the Kroger API
4. You get a link to checkout

## Ordering Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Ask Jarvis │ --> │ Items Added │ --> │  Checkout   │ --> │   Pickup    │
│  to add     │     │  to Cart    │     │ (manual)    │     │  at Store   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     ^                    ^                   ^                    ^
     |                    |                   |                    |
  Automated           Automated          You do this         You do this
```

**Note:** Checkout requires payment and is done on kroger.com - the API can't complete orders.

## Quick Test

```bash
cd ~/CLAWDBOT && node -e "
require('./skills/kroger/index.js').kroger_status().then(s => {
  console.log('Search:', s.searchWorking ? '✓' : '✗');
  console.log('Cart:', s.cartWorking ? '✓' : '✗');
});
"
```

## If Token Expires

The service automatically refreshes tokens weekly. If it ever fails:
1. Jarvis will return an `authUrl`
2. Click it to re-login to Kroger
3. Done - no code changes needed

## Service Monitoring

- Health check: `curl https://kroger-oauth-production.up.railway.app/`
- Status: `curl -H "X-API-Secret: $SECRET" https://kroger-oauth-production.up.railway.app/api/status/jeff`

## Files

- `skills/kroger/index.js` - Main skill (uses Railway service when configured)
- **Kroger OAuth / Olive app** — [repairman29/olive](https://github.com/repairman29/olive) (shopolive.xyz, Kroger OAuth service)
- `~/.clawdbot/.env` - Credentials (KROGER_SERVICE_URL, KROGER_USER_ID, etc.)
