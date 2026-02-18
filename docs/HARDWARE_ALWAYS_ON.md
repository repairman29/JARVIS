# Ideal hardware for JARVIS “always online”

To have JARVIS run 24/7 (plan-execute, heartbeat, webhook, gateway) you need a **host that’s always on**. The main choice is **where that host lives** and **whether you keep using the neural farm (phones)** or switch to a cloud LLM.

---

## What has to run 24/7

| Component | Role | Where it can run |
|-----------|------|-------------------|
| **Gateway** | Receives chat, runs tools, calls LLM | Any machine with Node + env |
| **Build server** | Runs build/test for plan-execute | Same host as gateway (or reachable) |
| **Webhook server** | Receives GitHub webhooks, triggers plan-execute | Same host (port 18791) |
| **Cron** | Runs plan-execute 8/14/20, heartbeat every 6h, watchdog, farm keeper | Same host |
| **Neural farm** | Adapters + LiteLLM proxy; talks to **phones** (Pixel/iPhone) for inference | Host must be on same LAN as phones (or phones exposed via tunnel) |

So “always online” = **one always-on machine** that runs gateway, build server, webhook, cron, and (if you keep the farm) the neural-farm adapters + proxy. The phones only need to be on and on WiFi when you want **local** inference; for true 24/7 you can use a **fallback cloud LLM** when the farm is down.

---

## Option A: Always-on machine at home (recommended if you want the farm)

**Ideal hardware:**

- **Mac mini (M1/M2/M4)** or **small Linux box** (Intel NUC, Raspberry Pi 4/5, or similar) that stays on 24/7.
- Same **Wi‑Fi/LAN** as your Pixel and iPhone so the neural farm can reach them.
- **No sleep:** Disable sleep (Energy Saver / power management) so cron and services keep running.

**What runs where:**

- **On the always-on host:** JARVIS repo (gateway, build server, webhook, cron), neural-farm repo (adapters + proxy). Phones stay on same network; when they’re on and InferrLM is running, the farm uses them; when they’re off, use `JARVIS_AUTONOMOUS_FALLBACK_URL` (e.g. Groq/OpenAI) so plan-execute still runs.
- **Phones:** Pixel + iPhone on same Wi‑Fi when you want local inference; not required for “JARVIS is up” if fallback LLM is set.

**Pros:** One place for everything; farm works when phones are on; full control, no cloud dependency for LLM when farm is up.  
**Cons:** Phones must be on same network for farm; if the host or power goes down, JARVIS is down until it’s back.

---

## Option B: Cloud VPS (always on, no dependency on your home)

**Ideal setup:**

- **Small VPS** (e.g. Railway, Fly.io, DigitalOcean, Hetzner): 1 vCPU, 512MB–1GB RAM is enough for gateway + build server + webhook + cron; no GPU needed if you use a **cloud LLM**.
- Point the gateway at a **cloud OpenAI-compatible API** (OpenAI, Groq, Together, etc.) instead of the neural farm. No phones involved.
- **GitHub webhooks** point at the VPS (or at ngrok/Cloudflare Tunnel in front of it). No need for your home IP or ngrok on your laptop.

**What runs where:**

- **On VPS:** JARVIS (gateway, build server, webhook), cron (or a scheduler like GitHub Actions that hit your webhook on a schedule). Env: `JARVIS_GATEWAY_URL` = that host; LLM = cloud API.
- **Neural farm:** Not used unless you run a tunnel from VPS → your home farm (complex). So “always online” here = **cloud LLM**, not phones.

**Pros:** Real 24/7; survives home power/network issues; no phone or Mac required.  
**Cons:** LLM is paid/cloud; no local farm unless you add a tunnel.

---

## Option C: Current Mac, but “always on”

- **MacBook or desktop** that rarely sleeps (e.g. lid open, “Prevent automatic sleeping when display is off”, or caffeinate).
- Same as today: gateway, farm, webhook, cron on this Mac; phones on same Wi‑Fi for the farm.
- **Pros:** No new hardware.  
**Cons:** Sleep, travel, power loss, or closing the lid stops JARVIS unless you add a separate always-on host.

---

## Option D: Pixel 8 Pro as the “Linux box” (Termux)

**Yes, you can get close.** The Pixel 8 Pro can run a Linux-like environment via **Termux** (terminal + package manager on Android). You can run Node.js, Python, cron, and long-lived processes. So in theory the **same Pixel** that runs InferrLM for the neural farm could also run the JARVIS gateway, webhook, cron, and even the neural-farm adapter + proxy.

**Rough setup:**

1. **Termux** — Install from [F-Droid](https://f-droid.org/packages/com.termux/) (not Play Store for full compatibility). `pkg update && pkg install nodejs python cronie`.
2. **Clone repos** — JARVIS and neural-farm (or copy) into Termux home (`~/storage` or `~`). Use `git clone` or `rsync` from your Mac.
3. **InferrLM** — Keep the Android app running (Server ON, port 8889). The Termux-side adapter points at `http://127.0.0.1:8889` (same device).
4. **Adapter + proxy** — In Termux: run neural-farm’s `inferrlm_adapter.py` with `PIXEL_URL=http://127.0.0.1:8889`, then LiteLLM proxy. Gateway and webhook (Node) run in Termux too.
5. **Cron** — `pkg install cronie`, `crond -b`, `crontab -e` with **absolute paths** to your scripts (e.g. `/data/data/com.termux/files/home/jarvis/scripts/...`). Use full paths; cron doesn’t load your shell profile.
6. **Wake lock** — So Android doesn’t kill Termux when the screen is off: enable “Wake lock” in Termux settings, or use a “keep Termux running” / “run in background” option. Otherwise scheduled jobs can be skipped.
7. **Plugged in** — For 24/7, keep the Pixel plugged in and consider “Stay awake” in Developer options so it doesn’t sleep.

**What runs where:**

- **On the Pixel:** InferrLM (app) + Termux (adapter → localhost:8889, LiteLLM proxy, JARVIS gateway, build server, webhook, cron). One device = farm + orchestrator.
- **iPhone** (optional): Still on same Wi‑Fi; add a second adapter in Termux pointing at the iPhone’s IP:8889 if you want two nodes.

**Caveats:**

- **Android can kill Termux** when the app is in the background or the device dozes. Wake lock + “Don’t optimize” for Termux in battery settings help but aren’t guaranteed.
- **Updates** — Android/Play system updates can change behavior or kill long-running apps.
- **Build server** — Running heavy builds (e.g. `npm run build`) on the Pixel may be slow and compete with InferrLM for RAM/CPU. Consider a lightweight build or delegating builds elsewhere.
- **Webhooks** — GitHub needs to reach the Pixel. Run **ngrok** (or similar) inside Termux and point it at port 18791, or use a tunnel from a small cloud endpoint to your Pixel’s gateway.

**Summary:** Using the Pixel 8 Pro as the “Linux box” is **possible** with Termux: one device can be both the neural-farm inference (InferrLM) and the JARVIS host (gateway, webhook, cron). Reliability is lower than a Mac mini or VPS (doze, app lifecycle, updates). Best for experimentation or a portable “JARVIS in my pocket” setup; for true always-on, a dedicated always-on host (Option A) or VPS (Option B) is more predictable.

---

## Recommendation summary

| Goal | Suggested setup |
|------|------------------|
| **JARVIS always on + keep using phones when they’re on** | **Option A:** Mac mini (or NUC/Pi) at home, always on, same Wi‑Fi as phones. Set `JARVIS_AUTONOMOUS_FALLBACK_URL` so when phones are off, plan-execute still runs via cloud LLM. |
| **JARVIS always on, don’t care about local farm** | **Option B:** Small VPS running gateway + build server + webhook + cron, LLM = cloud API. |
| **Minimal change, accept gaps when Mac is off** | **Option C:** Current Mac, disable sleep when you want “almost always” on. |
| **Single device: Pixel = farm + JARVIS** | **Option D:** Pixel 8 Pro + Termux: InferrLM + adapter + proxy + gateway + webhook + cron on one phone. See caveats (doze, wake lock, ngrok for webhooks). |

**Practical “ideal” for you (with farm):** A **Mac mini** (or equivalent small machine) dedicated to JARVIS + neural farm, same network as the phones, sleep disabled, fallback LLM set. That gives you “always online” plus local inference when the phones are on. **If you want to try the Pixel as the host:** use Option D (Termux) with wake lock and plugged in; treat it as experimental until you’re happy with stability.

---

## Moving JARVIS to an always-on host

1. **Clone repos** (JARVIS, neural-farm) on the new host; install Node, Python, same as today.
2. **Copy env:** `~/.clawdbot/.env` (tokens, webhook URL, fallback URL, etc.) and neural-farm `.env` / `.iphone_ip`.
3. **Cron:** Copy your crontab (plan-execute 8/14/20, heartbeat, watchdog, farm keeper) and fix paths to the new home dir.
4. **Start services:** Use `node scripts/start-all.js` (or LaunchAgents) so gateway, build server, webhook, and farm start on boot.
5. **Webhook URL:** Point GitHub webhooks at the new host (or at ngrok/Cloudflare Tunnel in front of it). If the host is at home, use ngrok or a tunnel so GitHub can reach port 18791.
6. **Optional:** Run `operation-status.js` from cron or a simple health check so you get alerted if the stack is down.

See **OPERATIONS_PLAN.md** and **START_EVERYTHING.md** for what to run and in what order.
