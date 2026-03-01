# Pixel services runbook — get JARVIS running and keep it there

**Goal:** Start all services on the Pixel, verify they’re up, and fix common failures (including Discord DM replies).

---

## 1. One command to start everything

**On the Pixel (Termux):**

```bash
bash ~/JARVIS/scripts/start-jarvis-pixel.sh
```

Leave that terminal open, or run in background and check logs. The script starts:

- **Adapter (8888)** → InferrLM (default `http://127.0.0.1:8889`). By default a **Node pass-through proxy** so completion content is returned; requires **InferrLM app** with **Server ON**.
- **Proxy (4000)** — optional if litellm is installed; otherwise gateway uses adapter at 8888.
- **Gateway (18789)** — Discord, chat completions, session store. Needs `DISCORD_BOT_TOKEN` in `~/.clawdbot/.env` for Discord.
- **Webhook (18791)** — trigger server.
- **Chat server (18888)** — browser UI at http://127.0.0.1:18888.

**From Mac (push repo + start on Pixel):**

```bash
cd ~/JARVIS && bash scripts/pixel-sync-and-start.sh
```

Uses `.pixel-ip` or `JARVIS_PIXEL_IP`; you may need to enter SSH password unless keys are set up.

---

## 2. Verify services are up

**On the Pixel:**

```bash
# Quick checks (expect 200)
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/   # Gateway
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18888/   # Chat UI
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/    # Proxy (if litellm)
# Or LLM router when using dual backend:
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18890/health
```

**If Gateway (18789) is not 200:**

- **Self-heal:** A **watchdog** runs every 5 min on the Pixel (`pixel-watchdog.sh` from cron). If the gateway is down, it restarts the full stack. Check `~/watchdog.log` to see restarts.
- Otherwise: ensure **InferrLM app** is running with **Server ON** (port 8889); `tail -30 ~/gateway.log`; restart: `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`.

**If Chat (18888) is not 200:**

- Check: `tail -20 ~/chat-server.log`.
- Restart the script or: `pkill -f pixel-chat-server; nohup node ~/JARVIS/scripts/pixel-chat-server.js >> ~/chat-server.log 2>&1 &`

---

## 3. Discord: bot receives DMs but doesn’t reply

**Symptom:** You see eyes emoji + typing in Discord, then no message.

**Do this first (Proot stack):**

1. Send **one DM** to the bot so the gateway can create the session (or confirm it already exists).
2. From Mac, run the alias script **inside Proot** (replace with your Pixel IP and your Discord user ID):
   ```bash
   bash scripts/pixel-proot-run.sh 10.1.10.50 'cd /root/JARVIS && node scripts/add-discord-alias.js 1468216626682794067'
   ```
3. **Restart the stack** on the Pixel (e.g. `bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh` or re-run your start script).
4. **Sync repo** from Mac so Pixel has the latest `jarvis/AGENTS.md` (sessions_send fallback uses your Discord ID):  
   `bash scripts/pixel-sync-and-start-proot.sh 10.1.10.50` (optional `--restart` to restart after sync).

After that, either automatic delivery works, or the agent will use **sessions_send** to `agent:main:1468216626682794067` so the reply reaches your DM.

**When the stack runs in Proot (default):** Pairing, `add-discord-alias`, and `enable-discord-dm-scope` must run **inside Proot** so they use the same `~/.clawdbot` as the gateway. Use: `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/..."`. See [PIXEL_ALWAYS_ON_DISCORD.md](./PIXEL_ALWAYS_ON_DISCORD.md).

**Option A — sessions_send workaround (on Pixel)**  
The agent is instructed to use **sessions_send** to your Discord user ID when normal reply isn’t delivered. Ensure `jarvis/AGENTS.md` is synced to the Pixel. Restart the gateway and try a DM again.

**Option B — Run Discord gateway on Mac**  
For reliable Discord DM replies, run the **gateway on your Mac** (with the same bot token and `session.dmScope` + alias). Pixel keeps running adapter, chat server, and local/voice; Discord traffic goes to the Mac gateway. See [PIXEL_ALWAYS_ON_DISCORD.md](./PIXEL_ALWAYS_ON_DISCORD.md) § Fallback: Discord on Mac.

**Option C — Wait for clawdbot fix**  
When a clawdbot release fixes “mirror outbound sends into target session keys” (or equivalent), `npm update clawdbot`, re-sync to Pixel, restart.

---

## 4. Keep the stack running (always-on)

- **Wake lock:** Termux → Settings → **Wake lock** ON (so Android doesn’t kill the process when the screen is off).
- **After reboot:** Use [Termux:Boot](https://wiki.termux.com/wiki/Termux:Boot) and copy `termux-boot-start-jarvis` into `~/.termux/boot/` and `~/.config/termux/boot/` (see [PIXEL_ALWAYS_ON_DISCORD.md](./PIXEL_ALWAYS_ON_DISCORD.md) §3).
- **Logs:** `~/gateway.log`, `~/tmp/clawdbot.log`, `~/chat-server.log`, `~/adapter.log`, `~/jarvis-boot.log`.

---

## 5. Quick reference

| Need | Command or doc |
|------|-----------------|
| Start stack | `bash ~/JARVIS/scripts/start-jarvis-pixel.sh` |
| Sync from Mac + start | `bash scripts/pixel-sync-and-start.sh` |
| Gateway down | InferrLM Server ON; `tail ~/gateway.log`; restart script |
| Discord no reply | AGENTS.md has sessions_send workaround; or run gateway on Mac |
| Always-on | Wake lock + Termux:Boot (see PIXEL_ALWAYS_ON_DISCORD) |
| **Run Gemini Nano** | Install bridge APK, tap **Start bridge** on Pixel; then `JARVIS_GEMINI_NANO_BRIDGE=1 bash ~/JARVIS/scripts/start-jarvis-pixel.sh` — see [PIXEL_GEMINI_NANO_BRIDGE.md](./PIXEL_GEMINI_NANO_BRIDGE.md) |
| **Gateway keeps dying** | Pixel **watchdog** (cron every 5 min) restarts the stack when 18789 is down. Log: `~/watchdog.log`. Ensure **Android isn’t killing Termux:** run `bash scripts/verify-pixel-unbridle.sh` (PPK + Battery Unrestricted + Wake lock). See [PIXEL_UNBRIDLE.md](./PIXEL_UNBRIDLE.md). |
| SSH from Mac | `ssh -p 8022 u0_a310@<pixel-ip>` (see .pixel-ip or PIXEL_TAILSCALE_RUNBOOK) |

See also: [PIXEL_MAKE_IT_WORK.md](./PIXEL_MAKE_IT_WORK.md), [PIXEL_ALWAYS_ON_DISCORD.md](./PIXEL_ALWAYS_ON_DISCORD.md), [PIXEL_TROUBLESHOOTING.md](./PIXEL_TROUBLESHOOTING.md).
