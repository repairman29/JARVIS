# JARVIS always on the Pixel + chat anywhere via Discord

**Goal:** JARVIS runs 24/7 on the Pixel, and you can chat with him from anywhere (phone, laptop, any network) via Discord.

---

## Overview

- **Pixel** runs the full stack: gateway (with Discord), chat server, adapters, voice (optional). The gateway connects to Discord outbound, so no port forwarding or public IP is needed.
- **Always-on:** Wake lock + Termux:Boot so the stack starts after reboot and keeps running when the screen is off.
- **Discord:** You DM the bot (or mention it in a server); the gateway on the Pixel receives the message, runs the agent, and sends the reply back to Discord.

---

## Prerequisites

- JARVIS already runs on the Pixel (you can open http://127.0.0.1:18888 and chat). If not, follow [PIXEL_MAKE_IT_WORK.md](./PIXEL_MAKE_IT_WORK.md) or [PIXEL_PROOT_DISTRO.md](./PIXEL_PROOT_DISTRO.md) (Proot is the default path).
- A **Discord bot** created in the [Discord Developer Portal](https://discord.com/developers/applications), with **Message Content Intent** and **Server Members Intent** enabled. See [DISCORD_SETUP.md](../DISCORD_SETUP.md) §1–3.
- **Interactions Endpoint URL:** Leave it **blank**. JARVIS uses the Discord **Gateway** (WebSocket) for DMs and messages; the interactions endpoint is for HTTP POST slash-commands to your own server and is not used here.

**Proot note:** The stack runs in **Proot (Ubuntu)** by default. Discord pairing, `add-discord-alias`, and `enable-discord-dm-scope` must run **inside Proot** so they use the same `~/.clawdbot` (sessions, config) as the gateway. Use the helper below or enter Proot first.

---

## 1. Put the Discord bot token on the Pixel

The gateway on the Pixel needs `DISCORD_BOT_TOKEN` in **Termux’s** `~/.clawdbot/.env` (the Proot start script sources this path).

**Option A — Push from Mac (recommended)**  
If your Mac already has `DISCORD_BOT_TOKEN` in `~/.clawdbot/.env`:

1. **Push env only (fast):** From the Mac:  
   `cd ~/JARVIS && ./scripts/pixel-push-env-to-pixel.sh --restart`  
   This copies your Mac’s `~/.clawdbot/.env` to the Pixel and restarts the Proot stack so the gateway picks up Discord.

2. **Or full sync (repo + env):**  
   `cd ~/JARVIS && ./scripts/pixel-sync-and-start-proot.sh` (or `pixel-do-it-all.sh`)  
   Pushes the repo and **your Mac’s** `~/.clawdbot/.env` to the Pixel, then starts the Proot stack.

**Option B — Set on the Pixel manually**  
1. On the Pixel, open **Termux**.  
2. Run: `mkdir -p ~/.clawdbot`  
3. Edit or create: `nano ~/.clawdbot/.env` and add:  
   `DISCORD_BOT_TOKEN=your_bot_token_here`  
   (Token from Discord Developer Portal → your app → Bot → Token.)  
4. Save and exit.

After either option, **restart the stack** on the Pixel so the gateway picks up Discord:

```bash
bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart
```

**Check the gateway log (Proot):** The gateway runs inside Proot, so logs are in Proot’s root. From **Termux**:

```bash
proot-distro login ubuntu -- tail -30 /root/gateway.log
```

You should see something like `[discord] logged in to discord as …`. If you see "Failed to resolve Discord application id", the token is missing or wrong (check `~/.clawdbot/.env` in **Termux**).

---

## 2. Run Discord setup inside Proot (pairing + alias + dmScope)

The gateway runs **inside Proot**, so session store and `clawdbot.json` live in Proot’s home (`/root/.clawdbot`). You must run **pairing**, **add-discord-alias**, and **enable-discord-dm-scope** inside Proot so they see the same data as the gateway.

**Helper (from Termux):** Run any one-off command in Proot:

```bash
bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && <your command>"
```

### 2.1 Enable DM scope (do once)

So Discord DMs get replies instead of “typing then nothing”:

```bash
bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/enable-discord-dm-scope.js"
```

Then restart the stack: `bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart`

### 2.2 Pair your Discord user (first time only)

1. In Discord, open a DM with your bot and send any message (e.g. "hi").  
2. The bot replies with a pairing code (e.g. "Your pairing code is: ABC123").  
3. On the **Pixel** in Termux (replace `ABC123` with the code):

   ```bash
   bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && npx clawdbot pairing approve discord ABC123"
   ```

4. Send another message in Discord. JARVIS should reply.

### 2.3 If "No session found" or no reply: add Discord alias

Link your Discord user ID to the main session so DMs use the same thread:

```bash
bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID"
```

Get your Discord user ID: Discord → User Settings → Advanced → Developer Mode ON → in the DM with the bot, right‑click your name → Copy User ID. Then restart the stack: `bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart`.

---

## 3. Make JARVIS always-on on the Pixel

So the stack (and Discord) keep running and survive reboots.

### 3.1 Wake lock (required)

- **Termux** → **Settings** (or long‑press the terminal) → enable **Wake lock**.  
Without this, Android can kill Termux when the screen is off and Discord will go offline.

### 3.2 Start after reboot (recommended)

1. Install **Termux:Boot** from F-Droid (same source as Termux). Open the Termux:Boot app once so Android registers it at boot.  
2. On the **Pixel** in Termux:

   ```bash
   mkdir -p ~/.termux/boot
   cp ~/JARVIS/scripts/termux-boot-start-jarvis ~/.termux/boot/
   chmod +x ~/.termux/boot/termux-boot-start-jarvis
   ```

3. Reboot the Pixel. After boot, the script runs: wake lock, crond, then **Proot** stack (`pixel-proot-bootstrap-and-start.sh`; fallback `start-jarvis-pixel.sh`). Check `~/jarvis-boot.log` for "boot started" and any errors. See [PIXEL_STABLE_ENVIRONMENT.md](./PIXEL_STABLE_ENVIRONMENT.md).

See [JARVIS_AUTONOMOUS_ON_PIXEL.md](./JARVIS_AUTONOMOUS_ON_PIXEL.md) for more (cron, ntfy, goals).

---

## 4. Use it

- **From anywhere:** Open Discord (phone or desktop), DM your JARVIS bot (or mention it in a server where it’s added). Chat as usual.  
- **On the Pixel:** You can still use the browser at http://127.0.0.1:18888 or /voice; same gateway, same brain.

---

## Fallback: Discord replies from Mac

If the Pixel gateway never delivers DM replies (typing then nothing) even after running enable-discord-dm-scope and add-discord-alias **inside Proot**, run the **gateway on your Mac** for Discord and keep the Pixel for the rest:

1. On **Mac:** Ensure `~/.clawdbot/.env` has `DISCORD_BOT_TOKEN` and run `node scripts/enable-discord-dm-scope.js` and `node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID`. Start the gateway (e.g. `node scripts/start-gateway-with-vault.js`).
2. **Discord** will talk to the Mac gateway (same bot token = same bot). Pixel keeps running adapter, chat server, and local/voice; only Discord DM traffic uses the Mac.
3. For Pixel to use Mac’s gateway for chat: point the Pixel chat server or clients at the Mac gateway URL (e.g. over Tailscale). Optional; you can also use Pixel only for on-device chat and voice.

See [PIXEL_SERVICES_RUNBOOK.md](./PIXEL_SERVICES_RUNBOOK.md) § Discord: bot receives DMs but doesn’t reply.

---

## Bot not responding — quick checklist

1. **Gateway on Pixel:** On the Pixel (Termux), check that the gateway is running and Discord logged in:  
   `proot-distro login ubuntu -- tail -50 /root/gateway.log`  
   Look for `[discord] logged in to discord as …`. If you see "Failed to resolve Discord application id", the token is wrong or missing (check Termux `~/.clawdbot/.env` and push again from Mac with `pixel-push-env-to-pixel.sh --restart`).
2. **First-time pairing:** DM the bot → it sends a pairing code → on Pixel run:  
   `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && npx clawdbot pairing approve discord <code>"`  
   Then send another DM.
3. **Typing but no reply:** Run **inside Proot**:  
   `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/enable-discord-dm-scope.js"`  
   then  
   `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID"`  
   then restart: `bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart`.
4. **Message Content Intent:** In [Developer Portal](https://discord.com/developers/applications) → your app → **Bot** → **Privileged Gateway Intents** → **Message Content Intent** must be **ON**.

---

## Troubleshooting

| Issue | What to do |
|-------|------------|
| Bot never replies in Discord | 1) On Pixel (Termux): `proot-distro login ubuntu -- tail -50 /root/gateway.log` — look for `[discord] logged in` or errors. 2) Restart: `bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart`. 3) Check token: **Termux** `~/.clawdbot/.env` must have `DISCORD_BOT_TOKEN`. |
| "No session found" / session errors | Run **inside Proot**: `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID"`, then restart the stack. |
| Discord WebSocket 1005 / "offline" | Gateway’s Discord connection dropped. On the Pixel restart the stack; if on a flaky network, consider keeping the Pixel on Wi‑Fi when you want Discord. |
| Stack stops after screen off | Enable **Wake lock** in Termux. Optionally: ADB whitelist (`adb shell dumpsys deviceidle whitelist +com.termux`) and [PIXEL_AS_BRAIN.md](./PIXEL_AS_BRAIN.md). |
| Nothing after reboot | Ensure Termux:Boot ran (check `~/jarvis-boot.log`). If the boot script isn’t there, re-copy `termux-boot-start-jarvis` to `~/.termux/boot/` and `~/.config/termux/boot/`. |
| **Typing dots but no reply** | Run **inside Proot**: (1) `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/enable-discord-dm-scope.js"`. (2) Restart stack. (3) Send one DM. (4) `pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID"`. Restart again. See [DISCORD_SETUP.md](../DISCORD_SETUP.md) § "If the bot never replies in DMs". |

---

## Summary checklist

| Step | Action |
|------|--------|
| ☐ | Discord bot created; token in Mac’s `~/.clawdbot/.env` (see [DISCORD_SETUP.md](../DISCORD_SETUP.md)) |
| ☐ | Pixel has token: push with `pixel-sync-and-start-proot.sh` (or `pixel-do-it-all.sh`) or add to **Termux** `~/.clawdbot/.env` |
| ☐ | Restart stack: `bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart`; confirm `[discord] logged in` in Proot: `proot-distro login ubuntu -- tail -30 /root/gateway.log` |
| ☐ | Run **inside Proot**: `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/enable-discord-dm-scope.js"` then restart |
| ☐ | First time: DM bot → get pairing code → `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && npx clawdbot pairing approve discord <code>"` |
| ☐ | If no reply: `bash ~/JARVIS/scripts/pixel-proot-run.sh "cd \$JARVIS_DIR && node scripts/add-discord-alias.js YOUR_DISCORD_USER_ID"` then restart |
| ☐ | Termux **Wake lock** ON; Termux:Boot with `termux-boot-start-jarvis` in `~/.termux/boot/` |

See also: [DISCORD_SETUP.md](../DISCORD_SETUP.md), [PIXEL_AS_JARVIS_SERVER.md](./PIXEL_AS_JARVIS_SERVER.md), [PIXEL_STABLE_ENVIRONMENT.md](./PIXEL_STABLE_ENVIRONMENT.md).
