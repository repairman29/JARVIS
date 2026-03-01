# Bring everything up and run smoothly

One place for: Neural Farm + JARVIS (gateway, build server, webhook).

**If your JARVIS server is the Pixel** (see **docs/PIXEL_AS_JARVIS_SERVER.md**), you don't need to start the gateway on the Mac. Ensure the Pixel is up (Termux:Boot + watchdog); use the Mac as a client pointing at the Pixel's IP. The commands below are for when you run JARVIS on the Mac (or in addition to the Pixel).

---

## One command (recommended)

From **JARVIS** repo root:

```bash
cd /Users/jeffadkins/JARVIS
node scripts/start-all.js
```

This will:

1. **Start Neural Farm** (if not already running): Pixel + optional iPhone adapters, then LiteLLM proxy on port 4000. Uses `../neural-farm` or `~/neural-farm` (or set `NEURAL_FARM_DIR`).
2. **Start JARVIS services** (only what’s down): build server (18790), gateway (18789), webhook trigger (18791).

Idempotent: safe to run after a reboot or when something has stopped. Check status:

```bash
node scripts/operation-status.js
```

From **neural-farm** you can run `./status.sh` for adapter + proxy; `./test_farm.sh` for a quick completion test.

---

## Per-piece (if you prefer)

| What | Command |
|------|--------|
| **Farm only** | `cd neural-farm && ./dev_farm.sh` (foreground) or `./dev_farm.sh --bg` |
| **JARVIS only** | `cd JARVIS && node scripts/start-jarvis-services.js` |
| **Status** | `cd JARVIS && node scripts/operation-status.js` |

---

## Smoother after reboot / login

- **Farm:** A cron job can start the farm (e.g. hourly) so it’s usually up; see neural-farm `ONE_STARTER.md` and `WHAT_JARVIS_NEEDS.md`. One starter only (lock in `dev_farm.sh --bg`).
- **JARVIS:** Install LaunchAgents so gateway and webhook start at login:
  - `node scripts/install-webhook-trigger-launchagent.js` → webhook on 18791 at login
  - Gateway: run `node scripts/start-gateway-with-vault.js` in a terminal when you need it, or add a LaunchAgent that runs `start-gateway-background.js` with `PORT=18789` and env from `~/.clawdbot/.env`.

Then after login you can run `node scripts/start-all.js` once to ensure farm + any missing JARVIS services are up, or rely on cron + LaunchAgents and only run start-all when something is down.

---

## Order that works

1. **Farm first** (adapters + proxy on 4000) so the gateway has an LLM to call.
2. **Gateway** (18789) — talks to farm at localhost:4000.
3. **Build server** (18790) and **webhook** (18791) — order doesn’t matter.

`start-all.js` and `start-jarvis-services.js` follow this order.
