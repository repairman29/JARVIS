# Notes: Edge, Pixel farm, hybrid app, manage from MacBook

Consolidated reference for: Edge ↔ Pixel/iPhone farm, hybrid UI (farm first / Edge fallback), and running/managing from your Mac.

---

## Edge and Pixel farm — are they connected?

**By default, no.** They connect only if the Edge function’s gateway URL reaches the Pixel.

- **Edge** receives chat from the web UI and forwards to **one gateway** (`JARVIS_GATEWAY_URL` secret).
- That gateway is usually Railway or your Mac, not the Pixel, unless you set it to a URL that reaches the Pixel (e.g. tunnel).

| Path | Uses Pixel/iPhone farm? |
|------|-------------------------|
| Web UI via Edge | Only if `JARVIS_GATEWAY_URL` points at the Pixel (tunnel or public URL). |
| Web UI (local, no Edge) | Only if `NEXT_PUBLIC_GATEWAY_URL` = `http://<pixel-ip>:18789`. |
| Mac chat GUI (9191) | Yes — always targets Pixel :18888 or :18789. |

**Pixel farm:** Gateway 18789, chat server 18888, LLM router 18890, adapters 8888/8887, Gemini Nano 8890.

**Quick ref:** Edge secret = Supabase Dashboard → Edge Functions → jarvis → Secrets → `JARVIS_GATEWAY_URL`. Pixel gateway = `http://<pixel-ip>:18789`.

---

## Deployed site using the farm (we have Tailscale)

We use **Tailscale** so the Pixel is reachable from the cloud. That lets **https://jarvis-ui-xi.vercel.app** use the farm instead of a cloud LLM.

**Steps:**

1. **Pixel:** Install Tailscale (Play Store or [tailscale.com/download/android](https://tailscale.com/download/android)), sign in (same account as Mac). Note the Pixel’s **Tailscale IP** (e.g. `100.x.x.x`) in the app.
2. **Pixel:** JARVIS stack running with gateway bound for network (e.g. `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`; gateway listens on 18789). If using Termux + Tailscale, ensure the gateway binds `0.0.0.0` so it’s reachable on the Tailscale IP.
3. **Supabase:** Dashboard → **Edge Functions** → **jarvis** → **Secrets** → set **`JARVIS_GATEWAY_URL`** to **`http://<pixel-tailscale-ip>:18789`** (e.g. `http://100.95.114.35:18789`). Replace with your Pixel’s actual Tailscale IP.
4. **Result:** If Edge could reach Tailscale, the deployed app would use the farm. **In practice Supabase Edge runs in the cloud and cannot reach a Tailscale IP (100.x.x.x).** So for the *deployed* site to use the farm you need a public-facing path: Tailscale Funnel, a cloud relay on your tailnet, or ngrok (see § Making JARVIS better → Reachability). Setting the secret to the Tailscale IP is still correct for *local* or *relay* use (e.g. a relay on your tailnet that Edge calls).

**Check:** From a machine on the same Tailscale network, `curl -s http://<pixel-tailscale-ip>:18789/` should return 200 before you set the Edge secret. See [PIXEL_OPTIONAL_STEPS.md §2 Tailscale](../PIXEL_OPTIONAL_STEPS.md#2-tailscale-remote-access-to-jarvis) and [PIXEL_VOICE_RUNBOOK.md §12](../PIXEL_VOICE_RUNBOOK.md#12-optional-tailscale-proot-and-latency).

---

## Hybrid app (try farm first, fall back to Edge)

One app, one URL: when you’re on the same network as your farm, chat goes **directly to the farm**; when the farm is unreachable, chat goes to **Edge**. Session is always in Supabase (app appends each turn to Edge when using the farm).

### Setup

1. **Edge:** `NEXT_PUBLIC_JARVIS_EDGE_URL` and `JARVIS_AUTH_TOKEN` in app env.
2. **Farm URL:** `JARVIS_FARM_URL` or `FARM_URL` (e.g. `http://192.168.86.209:18789`) — or use the Mac script so it’s set from `.pixel-ip`.
3. **Token:** `CLAWDBOT_GATEWAY_TOKEN` (or `OPENCLAW_GATEWAY_TOKEN`) if the farm gateway uses auth.

### Behavior

- **Health:** App probes farm first (~2.5s). If reachable → UI shows **Farm**, chat uses farm; else → **Edge**.
- **Chat (farm):** Request goes to farm `/v1/chat/completions`, then app appends that turn to Edge via `action=append_session`.
- **Session:** Loaded from Edge (same `session_id`) so the same thread on farm or edge.

### Env summary

| Env | Where | Purpose |
|-----|--------|---------|
| `NEXT_PUBLIC_JARVIS_EDGE_URL` | App (build) | Edge URL for fallback + session load/append |
| `JARVIS_AUTH_TOKEN` | App (server) | Auth for Edge |
| `JARVIS_FARM_URL` or `FARM_URL` | App (server) | Farm gateway; with Edge URL = hybrid |
| `CLAWDBOT_GATEWAY_TOKEN` | App (server) | Token for farm |

Edge supports **`action: "append_session"`**: POST `session_id` + `messages` (array of `{ role, content }`).

---

## Manage from your MacBook

Use the same Pixel IP workflow as the rest of JARVIS (no hardcoded farm URL).

### 1. Pixel IP

- **New WiFi:** Connect Pixel via USB → **`./scripts/pixel-refresh-ip.sh`**. Or on Pixel run `ifconfig`, then on Mac: **`./scripts/pixel-refresh-ip.sh 192.168.x.x`**.
- Stored in **`.pixel-ip`** at repo root. Chat-gui, SSH, and hybrid UI all use it.

### 2. Start hybrid UI from Mac

```bash
cd ~/JARVIS && ./scripts/start-jarvis-ui-hybrid.sh
```

- Reads Pixel IP from **`.pixel-ip`** (or **`JARVIS_PIXEL_IP`**), sets **`JARVIS_FARM_URL=http://<pixel-ip>:18789`**, runs `npm run dev` in `apps/jarvis-ui`.
- Open **http://localhost:3001**. Header shows **Farm** or **Edge** depending on reachability.

### 3. App env (`apps/jarvis-ui/.env`) for hybrid

- **`NEXT_PUBLIC_JARVIS_EDGE_URL`** — Edge URL (required).
- **`JARVIS_AUTH_TOKEN`** — Edge auth.
- **`CLAWDBOT_GATEWAY_TOKEN`** — optional (if Pixel gateway uses token).
- Do **not** set `JARVIS_FARM_URL` in `.env` when using the script; the script sets it from `.pixel-ip`.

### 4. Manual farm URL (optional)

```bash
cd ~/JARVIS/apps/jarvis-ui
JARVIS_FARM_URL="http://$(cat ../.pixel-ip 2>/dev/null || echo '192.168.86.209'):18789" npm run dev
```

### 5. Other Mac commands

| What | Command |
|------|--------|
| Chat GUI (direct to Pixel, 9191) | `./scripts/jarvis-chat-gui` |
| CLI chat to Pixel | `./scripts/jarvis-chat "message"` |
| Refresh Pixel IP | `./scripts/pixel-refresh-ip.sh` or `./scripts/pixel-refresh-ip.sh <ip>` |
| Start JARVIS stack on Pixel | `./scripts/ssh-pixel-start-jarvis.sh` |

---

## Running JARVIS in both places (coordination patterns)

If you ever want Edge and Pixel both running and coordinating:

1. **Shared session memory** — Pixel gateway (or proxy) reads/writes same Supabase `session_messages` / `session_summaries` with same `session_id` as Edge.
2. **Explicit delegation** — Tool on one backend (e.g. `ask_pixel` / `ask_cloud`) that POSTs to the other with context.
3. **Routing / failover** — Single entry point chooses farm or cloud per request; same thread only if both use same store (e.g. §1).

---

## Quick reference

- **Edge gateway URL:** Supabase Dashboard → Edge Functions → jarvis → Secrets → `JARVIS_GATEWAY_URL`.
- **Pixel gateway:** `http://<pixel-ip>:18789`.
- **Expose Pixel:** We use **Tailscale**. Set Edge secret `JARVIS_GATEWAY_URL` to `http://<pixel-tailscale-ip>:18789` so the deployed site uses the farm. See § Deployed site using the farm (Tailscale) above.
- **Session memory:** Edge uses `session_messages` / `session_summaries`; see `JARVIS_MEMORY_WIRING.md`.

---

## Making JARVIS better in this setup

Concrete improvements for: Pixel farm + Mac + Edge + deployed UI (jarvis-ui-xi.vercel.app).

### Reachability (deployed app → farm)

- **Reality:** Supabase Edge runs in the cloud and **cannot** reach a Tailscale IP (100.x.x.x). Tailscale is a private mesh; the cloud is not on your tailnet.
- **Options so the deployed site uses the farm:**
  1. **Tailscale Funnel or Serve** — Expose the Pixel (or a machine that proxies to it) via [Tailscale Funnel](https://tailscale.com/kb/1243/tailscale-funnel/) so the app gets a public HTTPS URL. Set `JARVIS_GATEWAY_URL` to that URL.
  2. **Relay in the cloud** — Run **`scripts/farm-relay.js`** on a VPS that has Tailscale (forwards to Pixel Tailscale IP). Or run any tiny proxy on your tailnet and forwards to `http://100.75.3.115:18789`. Set `JARVIS_GATEWAY_URL` to the proxy’s public URL. Edge → proxy → Pixel.
  3. **ngrok (or similar) on Pixel/Mac** — Expose 18789 via ngrok; set `JARVIS_GATEWAY_URL` to the ngrok URL. Simpler but ngrok URL can change unless you use a reserved domain.

### Reliability (Pixel + gateway)

- **Termux:Boot** — So the JARVIS stack starts after a Pixel reboot (see [JARVIS_AUTONOMOUS_ON_PIXEL.md](../JARVIS_AUTONOMOUS_ON_PIXEL.md)).
- **Health + recheck** — The UI already has “Recheck”; optional: run **`./scripts/pixel-health-check-and-restart.sh`** from cron (e.g. every 5 min) so the Mac probes the Pixel gateway and restarts the stack via SSH if 18789 is down.
- **Gateway bind** — Ensure the Pixel gateway listens on `0.0.0.0:18789` (not only 127.0.0.1) so Tailscale and LAN can reach it (start script already uses BIND_LAN).

### Speed and model choice

- **Nano for chat** — Use `PIXEL_LLM_ROUTE=chat-task` and Gemini Bridge so short chat goes to Nano (8890); tasks to InferrLM. See [PIXEL_LLM_MODEL_GUIDE.md](../PIXEL_LLM_MODEL_GUIDE.md).
- **Timeouts** — `JARVIS_CHAT_TIMEOUT_MS` (e.g. 90s) so the UI doesn’t give up before the farm replies.

### Context and “smarter” JARVIS

- **Repo on farm** — If the Pixel gateway has a workspace and repo index, JARVIS can use `repo_summary`, `repo_search`, `repo_file` from the web UI when talking to the farm. Index from Mac and sync to Pixel, or run index on a cloud gateway and keep farm for fast chat only.
- **Identity** — [jarvis/IDENTITY.md](../../jarvis/IDENTITY.md) and prompts already tell JARVIS what this project is; reduces “wrong JARVIS” or “no repo access” answers.

### UX and observability

- **Which backend** — UI already shows Farm / Edge in the header when hybrid; optional: show “Used: Farm” or “Used: Edge” in the message meta so you know which path answered.
- **Voice** — On Pixel: browser `/voice` at 18888 or voice node; on Mac: use the hybrid UI or chat GUI; TTS/speak when you want spoken replies.
- **Logs** — Edge: Supabase Dashboard → Edge Logs. Pixel: `./scripts/ssh-pixel-logs.sh` or watch Termux. Gateway token in sync so Edge can call the gateway (see RUNBOOK).

### Security

- **Gateway token** — Use `CLAWDBOT_GATEWAY_TOKEN` (or equivalent) on the farm and set the same token in Edge secrets so only Edge can call the Pixel gateway when you expose it.
- **Tailscale ACLs** — Restrict which machines can reach the Pixel if you add a relay node.

### Doc correction

- The notes previously said “set JARVIS_GATEWAY_URL to Tailscale IP and the deployed app will use the farm.” That only works if Edge can reach that IP; in practice **the cloud cannot reach a Tailscale IP**. Use one of the “Reachability” options above for the deployed site.
