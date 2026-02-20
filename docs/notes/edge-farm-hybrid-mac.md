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
- **Expose Pixel to internet:** ngrok, Tailscale, etc.; set `JARVIS_GATEWAY_URL` to that URL.
- **Session memory:** Edge uses `session_messages` / `session_summaries`; see `JARVIS_MEMORY_WIRING.md`.
