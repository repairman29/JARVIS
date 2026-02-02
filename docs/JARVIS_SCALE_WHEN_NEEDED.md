# When to Scale JARVIS (and What to Do)

**You’re already set up to scale.** Until you hit limits, you don’t need to change anything. This doc is for when you do.

---

## When do I need to scale?

You need to scale when:

- **Requests start timing out** or feel slow when several people (or bots) talk to JARVIS at once.
- **You add a lot of clients** — e.g. many Cursor windows, Slack, API, webhooks — and the gateway can’t keep up.

Until then: **do nothing.** Edge and DB scale with Supabase. The only part that might need scaling is the **gateway** (the process that runs skills and talks to the LLM).

---

## What to do when you need to scale

**One idea:** Run **more copies of the gateway** and send traffic to all of them (load balancing). Then Edge keeps using one URL; that URL points at the load balancer, which spreads work across the copies.

### If you run the gateway on Railway

1. Open your Railway project for the JARVIS gateway.
2. **Scale replicas:** In the service, set **Replicas** to 2 or more (e.g. 2–4). Railway will run that many gateways and load-balance over them.
3. **Edge:** Keep `JARVIS_GATEWAY_URL` as the **same** Railway URL (the one they gave you). Railway’s URL already goes to the load balancer when you have multiple replicas.
4. Redeploy if needed. No code changes.

### If you run the gateway yourself (e.g. Docker or a VPS)

1. Run **multiple gateway processes** (e.g. 2–4), each on a different port:
   - `PORT=18789 node scripts/start-gateway-with-vault.js`
   - `PORT=18790 node scripts/start-gateway-with-vault.js`
   - (or use Docker and run 2–4 containers with different ports)
2. Put a **load balancer** in front (e.g. nginx, Caddy, or your host’s LB). It listens on one port and forwards to `localhost:18789`, `localhost:18790`, etc.
3. Set **`JARVIS_GATEWAY_URL`** (in Supabase Edge secrets) to the load balancer’s URL (e.g. `http://your-server:80` or the public URL of the LB).
4. Restart or redeploy the Edge function so it uses the new URL.

---

## Summary

- **Right now:** You’re set up to scale. No change needed until you see timeouts or heavy concurrency.
- **When you need it:** Run more gateway copies and point Edge at a single URL that load-balances to them (Railway: increase replicas; self-host: multiple gateways + LB, set `JARVIS_GATEWAY_URL` to the LB).

For the full picture (one URL, adding clients, scaling layers), see [JARVIS_SCALE_AND_CONNECTIVITY.md](./JARVIS_SCALE_AND_CONNECTIVITY.md).
