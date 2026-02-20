# Edge function and Pixel/iPhone farm — are they connected?

**Short answer:** **By default they are not.** The Edge function and the Pixel/iPhone farm are separate backends. They connect **only if** you point Edge at a gateway that is (or talks to) the Pixel.

---

## How traffic flows

### 1. Web UI (jarvis-ui) → two modes

| Mode | When | Where chat goes |
|------|------|------------------|
| **Edge** | `NEXT_PUBLIC_JARVIS_EDGE_URL` is set (e.g. deployed app) | Browser → **Supabase Edge** → Edge calls **one gateway** (URL from Edge secret `JARVIS_GATEWAY_URL`) |
| **Direct gateway** | `NEXT_PUBLIC_JARVIS_EDGE_URL` is not set (e.g. local dev) | Browser → **gateway** at `NEXT_PUBLIC_GATEWAY_URL` (default `http://127.0.0.1:18789`) |

So when you use the **deployed web app**, chat goes: **Web UI → Edge → whatever gateway is in `JARVIS_GATEWAY_URL`**. That gateway is usually **Railway** or **your Mac** (a gateway you run), not the Pixel, unless you explicitly set it to a URL that reaches the Pixel.

### 2. Pixel/iPhone farm (the “farm”)

On the **Pixel** (and optionally iPhone):

- **Gateway** on 18789 (Clawdbot, tools, skills)
- **Chat server** on 18888 (browser UI, proxies to gateway)
- **LLM router** on 18890 (chat-task: Nano vs InferrLM)
- **Adapters** 8888 (Pixel InferrLM), 8887 (iPhone InferrLM), **Gemini Nano** 8890

So the **Pixel is itself a gateway** (port 18789). The “farm” is that stack: InferrLM + Nano + router + gateway + chat.

### 3. Mac chat GUI (localhost:9191)

- **Always** talks to the **Pixel**: `http://<pixel-ip>:18888` (chat server) or 18789 (gateway).
- So **9191 is the only path that uses the Pixel/iPhone farm by default.**

---

## Are Edge and Pixel connected?

**They are connected only if the Edge function’s gateway URL reaches the Pixel.**

- Edge reads **`JARVIS_GATEWAY_URL`** from Supabase Edge secrets (Dashboard → Edge Functions → jarvis → Secrets).
- Default (in code) is `http://127.0.0.1:18789` — useless in the cloud (Supabase runs in their infra, not your LAN).
- So in production you set **`JARVIS_GATEWAY_URL`** to one of:
  1. **A cloud gateway** (e.g. Railway) — then Edge → that gateway; **Pixel farm is not in the path**.
  2. **A public URL that reaches the Pixel** — then Edge → Pixel. That requires the Pixel (or your router) to be reachable from the internet, e.g.:
     - **Tunnel:** ngrok, Tailscale, or similar exposing `http://<pixel-ip>:18789` (or the Pixel’s gateway), then set `JARVIS_GATEWAY_URL` to that tunnel URL.
     - **Static IP + port forward:** Pixel has a public IP and you forward 18789 (not typical for a phone).

So in the **typical** setup:

- **Edge** → Railway (or Mac) gateway → **not** the Pixel.
- **Pixel farm** → used by: (1) the Pixel’s own browser (18888), (2) the **Mac chat GUI** (9191) pointing at the Pixel.

---

## Summary

| Path | Uses Pixel/iPhone farm? |
|------|-------------------------|
| Web UI (deployed) via Edge | Only if `JARVIS_GATEWAY_URL` is set to a URL that reaches the Pixel (tunnel or public IP). |
| Web UI (local, no Edge) | Only if `NEXT_PUBLIC_GATEWAY_URL` is set to `http://<pixel-ip>:18789`. Default is localhost:18789 (Mac gateway). |
| Mac chat GUI (9191) | **Yes** — always targets Pixel IP:18888 (or 18789). |

**To connect Edge to the Pixel farm:** Put the Pixel’s gateway behind a **public URL** (tunnel or port forward), then set the Edge secret **`JARVIS_GATEWAY_URL`** to that URL. Otherwise Edge and Pixel/iPhone farm stay separate.

---

## Running JARVIS in both places and having them coordinate

**Yes, you can run JARVIS in both places** (Edge/cloud gateway and Pixel/iPhone farm) and have them coordinate. Here are practical patterns.

### 1. Shared session memory (same conversation on both)

**Idea:** Edge and Pixel both read/write the **same** Supabase `session_messages` and `session_summaries` using the same `session_id`. Whichever backend handles a given request, the thread stays in sync.

- **Today:** Only the **Edge** function loads and appends to `session_messages` / `session_summaries` (see [JARVIS_MEMORY_WIRING.md](./JARVIS_MEMORY_WIRING.md)). The Pixel gateway does not persist to Supabase by default.
- **To coordinate:** Add a small “memory layer” in front of (or inside) the Pixel gateway: on each chat request with a `session_id`, load the last N messages from Supabase before calling the LLM, and after each turn append user + assistant to `session_messages` (and optionally update `session_summaries` when the thread is long). Use the same Supabase project and tables as Edge; credentials via env (e.g. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` on the Pixel or in your proxy). Then:
  - **Web UI → Edge** and **Web UI → Pixel** (e.g. via a toggle or different entry URL) can share one thread as long as the client sends the same `session_id`.
  - **Mac chat GUI → Pixel** can also use that `session_id` (if the GUI sends it and the Pixel gateway uses the Supabase layer), so the same conversation is visible from the cloud UI and from 9191.

Result: one logical JARVIS conversation, backed by two physical backends that share the same stored thread.

### 2. Explicit delegation (one calls the other)

**Idea:** One backend has a **tool** that sends a request to the other (e.g. “ask the Pixel” or “ask the cloud”). No shared DB required; you pass context in the request (e.g. a short summary or the last few messages).

- **Implementation:** Add a skill or tool (e.g. `ask_pixel` on Edge, `ask_cloud` on Pixel) that POSTs to the other gateway’s `/v1/chat/completions` (or Edge REST) with a message and optional `session_id` or minimal context. The other JARVIS replies; the result is shown or inlined in the current chat.
- **Use case:** “Use the Pixel for this one” (fast local Nano) or “Escalate to cloud for heavy tools/repo” from the Pixel. Each side keeps its own session unless you explicitly pass history.

### 3. Routing / failover (use one or the other per request)

**Idea:** A single entry point (e.g. Edge or a small proxy) decides per request whether to call the Pixel gateway or the cloud gateway (e.g. by availability, latency, or user preference). No shared memory or delegation; you’re just choosing which backend answers.

- **Implementation:** Edge (or a BFF) reads a config or env (e.g. “prefer Pixel when reachable”) and sets `JARVIS_GATEWAY_URL` dynamically, or you run a thin router that tries Pixel first and falls back to Railway. Same `session_id` only helps if the chosen backend persists to the same Supabase tables (e.g. Edge always does; Pixel would need the memory layer from §1).

---

**Summary**

| Pattern | Shared thread? | What you need |
|--------|----------------|----------------|
| **Shared session memory** | Yes | Wire Pixel gateway (or proxy) to read/write Supabase `session_messages` / `session_summaries` with same `session_id` as Edge. |
| **Explicit delegation** | Optional | Add a tool on one (or both) backends that POSTs to the other; pass context in the request. |
| **Routing / failover** | Only if backends use same store | Route requests to Pixel or cloud; for same thread, use §1. |

You can combine them: e.g. shared memory so both see the same conversation, plus an “ask the other JARVIS” tool for explicit handoff when you want the other backend’s strengths.

---

## Hybrid app (try farm first, fall back to Edge)

The **JARVIS UI** supports a **hybrid** mode: one app, one URL; when you're on the same network as your farm, chat goes **directly to the farm** (low latency); when the farm is unreachable (e.g. you're away), chat goes to **Edge** (which uses whatever gateway is in `JARVIS_GATEWAY_URL`). Session memory is **always** in Supabase: when using the farm, the app appends each turn to Edge so the same thread is available when you switch to Edge or refresh.

### Setup

1. **Edge** and **session**: set `NEXT_PUBLIC_JARVIS_EDGE_URL` and `JARVIS_AUTH_TOKEN` so the app can talk to Edge (for session load and append).
2. **Farm URL** (server-side): set **`JARVIS_FARM_URL`** or **`FARM_URL`** in the app env (e.g. `apps/jarvis-ui/.env` or Vercel) to your farm gateway URL, e.g. `http://192.168.86.209:18789` (Pixel on LAN) or `http://127.0.0.1:18789`.
3. **Gateway token**: the app uses `CLAWDBOT_GATEWAY_TOKEN` (or `OPENCLAW_GATEWAY_TOKEN`) when calling the farm.

### Behavior

- **Health check:** If both Edge and Farm URL are set, the app probes the farm first (~2.5s). If reachable, UI shows **Farm** and chat uses the farm; else it uses Edge and shows **Edge**.
- **Chat:** When backend is **farm**, the app sends to the farm's `/v1/chat/completions`, then appends that turn to Edge via `action=append_session` so `session_messages` stays in sync.
- **Session load:** Session history is loaded from Edge (same `session_id`), so the same thread is shown on farm or edge.

### Env summary (hybrid)

| Env | Where | Purpose |
|-----|--------|---------|
| `NEXT_PUBLIC_JARVIS_EDGE_URL` | App (build) | Edge URL for chat fallback and session load/append |
| `JARVIS_AUTH_TOKEN` | App (server) | Auth for Edge |
| `JARVIS_FARM_URL` or `FARM_URL` | App (server) | Farm gateway URL; with Edge URL, enables hybrid |
| `CLAWDBOT_GATEWAY_TOKEN` | App (server) | Token for farm (and local gateway) |

The Edge function supports **`action: "append_session"`**: POST with `session_id` and `messages` (array of `{ role, content }`) to append a turn without calling the gateway.

### Manage from your MacBook

Use the same Pixel IP workflow as the rest of JARVIS so you don’t have to hardcode the farm URL.

1. **Pixel IP** (same as chat-from-Mac / SSH):
   - **On new WiFi:** connect Pixel via USB and run **`./scripts/pixel-refresh-ip.sh`**, or on the Pixel run `ifconfig`, then on the Mac run **`./scripts/pixel-refresh-ip.sh 192.168.x.x`**.
   - IP is stored in **`.pixel-ip`** at repo root; all scripts (chat-gui, SSH, hybrid UI) use it.

2. **Start the hybrid UI from the Mac:**
   ```bash
   cd ~/JARVIS && ./scripts/start-jarvis-ui-hybrid.sh
   ```
   This script reads the Pixel IP from **`.pixel-ip`** (or **`JARVIS_PIXEL_IP`**), sets **`JARVIS_FARM_URL=http://<pixel-ip>:18789`**, and runs **`npm run dev`** in `apps/jarvis-ui`. Open **http://localhost:3001**. If the Pixel is reachable you’ll see **Farm** in the header; otherwise **Edge**.

3. **App env** in **`apps/jarvis-ui/.env`** (for hybrid):
   - **`NEXT_PUBLIC_JARVIS_EDGE_URL`** — your Edge URL (required for hybrid).
   - **`JARVIS_AUTH_TOKEN`** — Edge auth.
   - **`CLAWDBOT_GATEWAY_TOKEN`** — optional; use if your Pixel gateway requires a token.
   - You do **not** need to set `JARVIS_FARM_URL` in `.env` when using the script; the script exports it from `.pixel-ip`.

4. **Optional:** Run the UI yourself and set the farm URL manually:
   ```bash
   cd ~/JARVIS/apps/jarvis-ui
   JARVIS_FARM_URL="http://$(cat ../.pixel-ip 2>/dev/null || echo '192.168.86.209'):18789" npm run dev
   ```

5. **Other Mac workflows** (unchanged): **`./scripts/jarvis-chat-gui`** (localhost:9191 → Pixel chat server), **`./scripts/jarvis-chat "msg"`**, **`./scripts/ssh-pixel-start-jarvis.sh`** to start the stack on the Pixel.

---

## Quick reference

- **Edge gateway URL:** Supabase Dashboard → Edge Functions → jarvis → Secrets → `JARVIS_GATEWAY_URL`.
- **Pixel gateway:** `http://<pixel-ip>:18789` (same machine as the farm).
- **Expose Pixel to the internet:** Use ngrok, Tailscale, or similar; point `JARVIS_GATEWAY_URL` at the resulting URL.
- **Session memory:** Edge already uses `session_messages` / `session_summaries`; see [JARVIS_MEMORY_WIRING.md](./JARVIS_MEMORY_WIRING.md). For Pixel to share that thread, add Supabase read/write there.
