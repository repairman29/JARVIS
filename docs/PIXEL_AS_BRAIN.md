# Pixel as the Brain — Keep It Awake

Use the **Pixel** as JARVIS’s always-on brain: gateway, InferrLM (Pixel + iPhone), chat server, cron (plan-execute, heartbeat). The Mac talks to the Pixel; the Pixel stays awake so it’s always ready.

---

## 1. Keep the Pixel awake

| Setting | Where | What to do |
|--------|--------|------------|
| **Wake lock** | Termux → Settings | **ON** — so Termux (and cron) keep running when the screen is off. |
| **termux-wake-lock** | Boot script | The **termux-boot-start-jarvis** script runs `termux-wake-lock` at boot so the device doesn’t sleep during startup. Leave it in; don’t add `termux-wake-unlock` if you want the Pixel as the brain. |
| **Stay awake when charging** | Settings → System → Developer options | **ON** (optional) — screen stays on while charging so the device doesn’t sleep when plugged in. |

With these, the Pixel stays awake (or at least doesn’t deep-sleep), cron runs on schedule, and the stack is always reachable from the Mac.

---

## 2. Stack + cron on the Pixel

- **Stack:** Run `bash ~/JARVIS/scripts/start-jarvis-pixel.sh` in Termux (or use Termux:Boot so it starts after reboot).
- **Cron:** plan-execute at 8 / 14 / 20, heartbeat every 6h (from setup-jarvis-termux.sh or your crontab). Requires Wake lock so cron fires when the screen is off.
- **InferrLM:** Pixel (127.0.0.1:8889) + iPhone (JARVIS_IPHONE_LLM_URL) so the brain has both backends.

---

## 3. Mac → Pixel

- **Chat:** `./scripts/jarvis-chat` or `./scripts/jarvis-chat-gui` (default port 18888). Set `.pixel-ip` or `JARVIS_PIXEL_IP` to the Pixel’s IP; on new WiFi run `./scripts/pixel-refresh-ip.sh`.
- **SSH:** `./scripts/ssh-pixel.sh` for a shell; `./scripts/ssh-pixel-start-jarvis.sh` to restart the stack.
- **Overnight builds:** If you want scheduled plan-execute overnight, either (a) keep the Pixel awake (this doc) and let Pixel cron run 2 AM / 8 AM etc., or (b) run plan-execute on the **Mac** and point it at the Pixel gateway (`JARVIS_GATEWAY_URL=http://<pixel-ip>:18789`). Option (a) = Pixel is the brain 24/7; option (b) = Mac triggers overnight, Pixel is still the LLM.

---

## 4. Checklist: Pixel as brain

| Step | Action |
|------|--------|
| ☐ | Termux → **Wake lock** → **ON** |
| ☐ | (Optional) Developer options → **Stay awake when charging** → **ON** when plugged in |
| ☐ | Use **termux-boot-start-jarvis** (with `termux-wake-lock`, no `termux-wake-unlock`) in `~/.termux/boot/` and `~/.config/termux/boot/` so stack + cron start after reboot |
| ☐ | Stack running: `start-jarvis-pixel.sh` (Pixel + iPhone adapters, router, gateway, chat, webhook) |
| ☐ | Mac chat uses Pixel IP (`.pixel-ip` or `JARVIS_PIXEL_IP`); on new WiFi run `pixel-refresh-ip.sh` |
| ☐ | (Optional) **Unbridle** the Pixel so Android doesn’t kill the stack: see **PIXEL_UNBRIDLE.md**. Use Wireless debugging (IP:port from the phone); port changes after reboot — reconnect with `adb connect <ip>:<new-port>`. |

Result: the Pixel stays awake (or avoid deep sleep), runs JARVIS and cron, and the Mac uses it as the brain for chat and optional overnight runs.
