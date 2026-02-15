# JARVIS on Pixel over WiFi (one-time setup)

Everything is prepared so you can push JARVIS + neural-farm to your Pixel 8 Pro over WiFi and run the full stack (adapter, proxy, gateway, webhook, cron) in Termux. The Mac does the push; the Pixel runs setup once.

---

## Prerequisites on the Pixel

1. **Termux** — Install from [F-Droid](https://f-droid.org/packages/com.termux/) (not Play Store).
2. **Wireless debugging** — Settings → Developer options → Wireless debugging → On. Note the IP and port (e.g. `10.1.10.50:5555`).
3. **One-time link storage** — In Termux run: `termux-setup-storage` and allow access so `~/storage/downloads` points to the Download folder.

---

## One-time ADB connection (from the Mac)

If you’ve never connected over WiFi:

- **Option A:** Connect the Pixel via USB. Run: `adb tcpip 5555` then `adb connect <pixel-ip>:5555`. Unplug; next time you can use WiFi only.
- **Option B:** On the Pixel, open Wireless debugging → “Pair device with pairing code” and pair from the Mac. Then `adb connect <pixel-ip>:5555`.

Replace `<pixel-ip>` with the IP shown in Wireless debugging (e.g. `10.1.10.50`).

---

## Push and run setup (from the Mac)

From the JARVIS repo, with the Pixel on the **same Wi‑Fi** as the Mac:

```bash
cd /Users/jeffadkins/JARVIS
./scripts/push-jarvis-to-pixel.sh 10.1.10.50
```

Use your Pixel’s IP if different. The script will:

1. Create tarballs of JARVIS and neural-farm (excluding `node_modules`, `.venv`, `.git`).
2. Copy your `~/.clawdbot/.env` as `clawdbot.env` so the gateway has tokens.
3. Connect to the Pixel via ADB and push everything to `/sdcard/Download`.
4. Try to start the Termux setup automatically; if that fails, it prints a single command to run in Termux.

---

## If auto-start doesn’t work: run setup in Termux

On the Pixel, open **Termux** and run:

```bash
termux-setup-storage   # only if you haven’t already
bash ~/storage/downloads/setup-jarvis-termux.sh
```

The script will: install Node/Python/cronie, extract the tarballs, install deps, configure adapter → `127.0.0.1:8889`, start proxy (4000), gateway (18789), webhook (18791), and set crontab for plan-execute and heartbeat.

---

## After setup on the Pixel

- **InferrLM** — Keep the Android app running with **Server ON** (port 8889).
- **Wake lock** — In Termux: Settings → Wake lock (so cron runs when the screen is off).
- **Plugged in** — For 24/7, keep the Pixel plugged in.
- **Check** — In Termux: `curl -s http://127.0.0.1:4000/` and `curl -s http://127.0.0.1:18789/` should respond.

Logs on the Pixel: `~/adapter.log`, `~/litellm.log`, `~/gateway.log`, `~/webhook.log`, `~/jarvis-setup.log`.

**Make JARVIS autonomous** (schedule survives screen-off, reboots, notifications): see **docs/JARVIS_AUTONOMOUS_ON_PIXEL.md**.  
**Chat with JARVIS on the Pixel** (browser, one-tap, notifications): see **docs/JARVIS_ON_ANDROID_COMMUNICATE.md**.

---

## Running JARVIS optimally (start stack + health check)

**On the Pixel (Termux)** — Start or restart the full stack (adapter, proxy, gateway, webhook). Clipboard stubs are applied automatically so the gateway starts; then services are started:

```bash
bash ~/JARVIS/scripts/start-jarvis-pixel.sh
```

You should see `Proxy: 200` and `Gateway: 200`. If Gateway shows `000` or down, see **docs/PIXEL_GATEWAY_CLIPBOARD_FIX.md**.

**Health check (on Pixel):**

```bash
curl -s -o /dev/null -w "Proxy: %{http_code}\n" http://127.0.0.1:4000/
curl -s -o /dev/null -w "Gateway: %{http_code}\n" http://127.0.0.1:18789/
```

**From the Mac** — SSH and logs (Pixel and Mac on same Wi‑Fi, SSH set up in Termux with `sshd`):

```bash
cd /Users/jeffadkins/JARVIS
./scripts/ssh-pixel.sh          # interactive shell (stay in)
./scripts/ssh-pixel-logs.sh     # one-shot: gateway + plan-execute logs + curl checks
```

See **docs/TERMUX_REMOTE_ACCESS.md** for SSH setup and password tips.

---

## Files added

| File | Purpose |
|------|--------|
| **scripts/push-jarvis-to-pixel.sh** | Mac: tars repos, pushes to Pixel via ADB, triggers setup. |
| **scripts/setup-jarvis-termux.sh** | Pixel (Termux): installs deps, extracts, starts services, sets cron. |
| **scripts/start-jarvis-pixel.sh** | Pixel (Termux): apply clipboard stubs, start adapter/proxy/gateway/webhook. |
| **scripts/pixel-stubs/** | Clipboard stubs (android + linux arm64) so gateway runs on Termux. |
| **neural-farm/config-termux.yaml** | LiteLLM config for Pixel-only (adapter on 8888 → InferrLM 8889). |

You only need to run the push script again if you change JARVIS or neural-farm and want to update the Pixel.
