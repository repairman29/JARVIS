# What JARVIS Needs (and What’s Best)

Short list of what’s **required** for autonomous JARVIS to work, and what’s **recommended**.

---

## Needed (must have)

| Piece | Why | You have |
|-------|-----|----------|
| **Neural farm up** | Gateway calls the farm for LLM. If farm is down, plan-execute and heartbeat get “No response.” | **One starter only:** Farm keeper cron runs every hour: `cd neural-farm && ./dev_farm.sh --bg`. The script uses a lock so only one start runs at a time (no LaunchAgent + cron conflict). Farm LaunchAgent is unloaded; see neural-farm/ONE_STARTER.md. |
| **Gateway up** | Chat, autonomous scripts, and webhook all go through the gateway. | LaunchAgent (start at login) + **watchdog every 5 min** (restarts gateway if down). |
| **Build server up** | Plan-execute uses build_server_pipeline for build/test. | LaunchAgent at login. |
| **Token + env** | Scripts need `CLAWDBOT_GATEWAY_TOKEN`, optional `NTFY_TOPIC`, `JARVIS_EDGE_URL` for audit. | In `~/.clawdbot/.env`. |

So: **farm keeper + gateway + build server + env** = autonomous JARVIS can run and get LLM replies.

---

## Best (recommended)

| Thing | Why |
|-------|-----|
| **Farm keeper cron** | Farm doesn’t survive forever on its own; hourly `dev_farm.sh --bg` keeps it (or brings it back). **Done:** cron at the top of every hour. |
| **Webhook server up** | So pushes to any of your 60+ repos trigger plan-execute. | LaunchAgent at login. Start manually with `node scripts/start-jarvis-services.js` if needed. |
| **ngrok at login** | So GitHub can reach your webhook. | LaunchAgent. After reboot run `node scripts/sync-webhook-url-all-repos.js` once (free ngrok URL changes). |
| **Both phones (Pixel + iPhone)** | Faster and more reliable than one node. | Pixel was failing last run (IP/network?). Fix when you can; iPhone alone is enough to run. |
| **Goal file** | Plan-execute steers toward `~/.jarvis/autonomous-goal.txt`. | Set and edit as you like. |

---

## Optional

- **JARVIS_AUTONOMOUS_FALLBACK_URL** — When farm/gateway is down, use a backup LLM so cron still produces a report.
- **Per-tool audit** — Gateway logs every autonomous exec/deploy (gateway change).
- **Stable ngrok URL** — Paid ngrok domain or Cloudflare Tunnel so you don’t re-sync webhooks after every reboot.

---

## One-line summary

**Needed:** Farm keeper (hourly) + gateway (LaunchAgent + watchdog) + build server (LaunchAgent) + env. **Best:** Add webhook + ngrok at login, sync webhook URL after reboot, keep goal file updated; fix Pixel when you can.
