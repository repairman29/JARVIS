# Stripe setup (done)

Products and prices were created in your Stripe account via the Stripe CLI.

## Created

| Item | ID | Amount |
|------|-----|--------|
| **UpshiftAI Pro** (product) | `prod_Tt4tduioqGtGLt` | — |
| **Pro** (price) | `price_1SvIjbGa3zSfMp7osc4GCMHD` | $19/mo |
| **UpshiftAI Team** (product) | `prod_Tt4tLBKt5xzURV` | — |
| **Team** (price) | `price_1SvIjhGa3zSfMp7o3VZydU8k` | $99/mo |

## What you need to do

1. **Copy `.env.example` to `.env`** and set:
   - `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`)
   - `STRIPE_SECRET_KEY` (from [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys))
   - `STRIPE_WEBHOOK_SECRET` (see below)

2. **Webhook (local dev):** In a separate terminal:
   ```bash
   stripe listen --forward-to localhost:3001/api/stripe/webhook
   ```
   Stripe prints a signing secret (`whsec_...`). Put it in `.env` as `STRIPE_WEBHOOK_SECRET`.

3. **Webhook (production):** In [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks), add endpoint:
   - URL: `https://your-app.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   Use that endpoint’s signing secret in production `.env`.

4. **Run the platform:** `npm run dev` → http://localhost:3001. Sign in (any email + password `demo`), click “Upgrade to Pro” → Stripe Checkout. After payment, the webhook marks you Pro and the dashboard shows Pro.

## Re-create products (different account)

To create the same products in another Stripe account (or if you delete them):

```bash
# API script (requires STRIPE_SECRET_KEY in env)
STRIPE_SECRET_KEY=sk_test_... npm run stripe:create

# Or Stripe CLI (uses your stripe login)
stripe products create --name="UpshiftAI Pro" --description="Hosted dashboard, approval queue, priority support."
stripe prices create --product=prod_XXX --unit-amount=1900 --currency=usd -d "recurring[interval]=month"
# (repeat for Team with product id and unit-amount=9900)
```

Then update `.env` with the new price IDs.
