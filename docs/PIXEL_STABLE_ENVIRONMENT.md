# Stable environment: JARVIS on Pixel running all the time

**Goal:** The **Pixel is the JARVIS server** — it must run like a champ, without the Mac being responsible for it. The stack should survive backgrounding, doze, and reboots, and self-heal when it goes down. The Mac is just a client; see **PIXEL_AS_JARVIS_SERVER.md**.

---

## 1. Checklist (one-time + after reboot)

Do these once (and again after factory reset or new Termux install):

| Step | Action |
|------|--------|
| **Termux source** | Install Termux from **F-Droid or GitHub**, not Google Play (Play build is outdated/restricted). |
| **Termux:Boot** | Install [Termux:Boot](https://f-droid.org/en/packages/com.termux.boot/) from the same source. |
| **Boot script** | Copy `JARVIS/scripts/termux-boot-start-jarvis` to `~/.termux/boot/` on the Pixel. Make executable: `chmod +x ~/.termux/boot/termux-boot-start-jarvis`. |
| **Wake lock** | In Termux: **Settings → Wake lock** — turn **ON** so the device doesn’t kill Termux when the screen is off. |
| **Battery optimization** | On the phone: **Settings → Apps → Termux → Battery** → set to **Unrestricted** (or “Don’t optimize”) so Android doesn’t kill it in the background. |
| **Optional: ADB whitelist** | From Mac, after reboot, run `adb shell dumpsys deviceidle whitelist +com.termux` so Doze doesn’t restrict Termux. Requires USB debugging. See **PIXEL_UNBRIDLE.md**. |

---

## 2. What keeps the stack up

| Mechanism | Purpose |
|-----------|---------|
| **Termux:Boot** | Runs `termux-boot-start-jarvis` after device boot → starts crond and the JARVIS stack in Proot. |
| **Wake lock** | Reduces chance Android will kill Termux when the screen is off. |
| **Battery: Unrestricted** | Stops the system from aggressively killing Termux in the background. |
| **Watchdog (cron)** | Every 5 minutes, **pixel-watchdog.sh** checks the gateway (port 18789). If it’s down, the script kills any existing Proot session and runs **pixel-proot-bootstrap-and-start.sh** to bring the stack back. |

Cron is installed by **scripts/setup-jarvis-termux.sh** (adds the 5‑minute watchdog line). If you set up the device manually, add the cron entry as shown in **scripts/pixel-watchdog.sh**.

---

## 3. Verify stability

**On the Pixel (Termux):**

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18888/
```

Both should return `200` when the stack is up. To confirm cron and the watchdog are active:

```bash
pgrep -fl crond
crontab -l | grep watchdog
```

You should see a `*/5 * * * *` line for `pixel-watchdog.sh`. If the stack was down recently, `~/watchdog.log` should have restart entries.

**From the Mac (optional):**

```bash
./scripts/pixel-wtf-status.sh
```

Reports SSH, gateway/chat HTTP codes, on-device ports, and a **ONE FIX** line (e.g. `pixel-do-it-all.sh`) if something is wrong.

---

## 4. When the stack is down

1. **On Pixel (first):** Open Termux and run:
   ```bash
   bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh
   ```
   To force a full restart:
   ```bash
   bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart
   ```
2. **From Mac (if you need to sync or can’t use the device):** Run `./scripts/pixel-do-it-all.sh` (sync repo, SSH/ADB, start Proot stack). Or run `./scripts/pixel-wtf-status.sh` first to confirm what’s broken.

The **watchdog** will also restart the stack within about 5 minutes if the gateway stops responding (e.g. after a crash or kill).

---

## 5. New network (Wi‑Fi or Tailscale)

When you change Wi‑Fi or use a different network, the Pixel gets a new IP. Scripts (status, push, chat) use the IP in `.pixel-ip` or `JARVIS_PIXEL_IP`.

**On the Mac (from repo root):**

1. **Get the Pixel’s IP** — either:
   - **Same Wi‑Fi:** Connect the Pixel via USB, then run: `./scripts/pixel-refresh-ip.sh` (reads IP from ADB).  
   - **Or on the Pixel:** In Termux run `ip -4 addr show wlan0` or check **Settings → Wi‑Fi → your network** for the device IP.  
   - **Tailscale:** On the Pixel open the Tailscale app and note the **Tailscale IP** (e.g. `100.75.3.115`).
2. **Set it:** `./scripts/pixel-refresh-ip.sh <IP>` (e.g. `./scripts/pixel-refresh-ip.sh 192.168.1.50` or `./scripts/pixel-refresh-ip.sh 100.75.3.115`).
3. Then `./scripts/pixel-wtf-status.sh`, `./scripts/pixel-push-env-to-pixel.sh`, and `./scripts/jarvis-chat` use the new IP. See **PIXEL_TAILSCALE_RUNBOOK.md** for Tailscale.

---

## 6. Summary

- **One-time:** Termux (F-Droid), Termux:Boot, boot script in `~/.termux/boot/`, Wake lock ON, Termux battery = Unrestricted.
- **After boot:** Termux:Boot starts the Proot stack; cron runs the watchdog every 5 min.
- **Ongoing:** Watchdog restarts the Proot stack if the gateway (18789) is down.
- **New network:** Run `./scripts/pixel-refresh-ip.sh <pixel-ip>` so status/push/chat use the right IP (§5).
- **Docs:** Architecture and deployment phases → **JARVIS_MOBILE_COMPUTE_NODE.md**. Proot and scripts → **PIXEL_PROOT_DISTRO.md**. Troubleshooting → **PIXEL_TROUBLESHOOTING.md**.
