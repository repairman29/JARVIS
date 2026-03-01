# Pixel as the JARVIS server — Mac is just a client

**Principle:** The **Pixel runs JARVIS**. It’s the little JARVIS server that runs like a champ. The Mac is **not** responsible for JARVIS; the Mac **uses** JARVIS by connecting to the Pixel. No gateway on the Mac by default.

---

## 1. Roles

| Role | What it does |
|------|----------------|
| **Pixel** | **JARVIS server.** Gateway (18789), chat (18888), AI proxy (4000), Discord bot, skills, cron (plan-execute, heartbeat). Starts at boot via Termux:Boot; watchdog restarts the stack if it goes down. See **PIXEL_STABLE_ENVIRONMENT.md**, **JARVIS_MOBILE_COMPUTE_NODE.md**. |
| **Mac** | **Client.** Cursor, jarvis-ui, CLI chat, and other tools **point at the Pixel’s gateway/chat**. No need to run the gateway on the Mac. |

---

## 2. Using JARVIS from the Mac (client only)

**Pixel must be reachable** (same Wi‑Fi or Tailscale). Set the Pixel’s IP once:

- **Tailscale (recommended):** In Tailscale app on the Pixel, note the IP (e.g. `100.75.3.115`). From Mac: `./scripts/pixel-refresh-ip.sh 100.75.3.115` (writes `.pixel-ip`).
- **Same Wi‑Fi:** Use the Pixel’s Wi‑Fi IP; `pixel-refresh-ip.sh <IP>` or set `JARVIS_PIXEL_IP`.

Then from the Mac:

| Use case | How |
|----------|-----|
| **Chat (CLI)** | `./scripts/jarvis-chat "hello"` or `./scripts/jarvis-chat` (interactive). Uses `.pixel-ip` or `JARVIS_PIXEL_IP`; default port 18888 (chat) or set `JARVIS_PIXEL_PORT=18789` for gateway. |
| **Chat (GUI)** | `./scripts/jarvis-chat-gui` → http://localhost:9191; it talks to the Pixel. |
| **Cursor / IDE** | Point your JARVIS/OpenAI base URL at `http://<PIXEL_IP>:18789` (gateway) or 4000 (LiteLLM) as needed. |
| **jarvis-ui** | Run the UI on the Mac; set `NEXT_PUBLIC_GATEWAY_URL=http://<PIXEL_IP>:18789` so the UI hits the Pixel gateway. |

**Discord:** The **bot token and session live on the Pixel**; JARVIS responds to DMs from the Pixel server. To get Discord → JARVIS working:

1. Put `DISCORD_BOT_TOKEN` in your **Mac’s** `~/.clawdbot/.env`, then **push from Mac:**  
   `./scripts/pixel-push-env-to-pixel.sh --restart`  
   (Or do a full sync: `./scripts/pixel-sync-and-start-proot.sh` — that also includes .env.)
2. Restart the stack: `bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart`.
3. Run **inside Proot** (same env as the gateway):  
   `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/enable-discord-dm-scope.js"` then restart again.
4. First DM: bot sends a pairing code → approve with  
   `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && npx clawdbot pairing approve discord <code>"`.
5. If the bot types but doesn’t reply:  
   `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID"` then restart.

Full runbook: **PIXEL_ALWAYS_ON_DISCORD.md**.

---

## 3. What the Mac is *not* responsible for

- **Not** running the gateway.
- **Not** starting or babysitting the Pixel stack (Pixel starts itself at boot; watchdog restarts it).
- **Not** required for JARVIS to be “on” — the Pixel is the server.

The Mac can still **sync** the repo to the Pixel (`pixel-sync-and-start-proot.sh`, `pixel-do-it-all.sh`) and **check** status (`pixel-wtf-status.sh`) when you’re doing setup or recovery. Day to day, the Pixel runs JARVIS; you use it from the Mac by pointing at the Pixel’s IP.

---

## 4. Summary

- **JARVIS server = Pixel.** Stable, always-on, self-healing (Termux:Boot + watchdog).  
- **Mac = client.** Set Pixel IP (e.g. via `pixel-refresh-ip.sh`), then chat, UI, and Cursor talk to the Pixel.  
- **Docs:** Stable setup → **PIXEL_STABLE_ENVIRONMENT.md**. Architecture → **JARVIS_MOBILE_COMPUTE_NODE.md**. Chat from Mac → **JARVIS_CHAT_FROM_MAC.md**. Tailscale → **PIXEL_TAILSCALE_RUNBOOK.md**.
