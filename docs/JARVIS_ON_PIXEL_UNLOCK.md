# Unlock more JARVIS power on the Pixel

You already have the full stack on the Pixel (adapter → InferrLM, proxy, gateway, webhook, cron). Here are concrete ways to get more out of it.

---

## 1. Push reports to your phone (ntfy)

When plan-execute or heartbeat runs, get a notification on the Pixel.

- **On the Pixel (Termux):** Install the [ntfy app](https://play.google.com/store/apps/details?id=io.heckel.ntfy) (or use the web sub). Create a topic at [ntfy.sh](https://ntfy.sh) (e.g. `jarvis-pixel`) or use your own server.
- **In `~/.clawdbot/.env` on the Pixel** (in Termux, edit `~/JARVIS` is in home so env is `~/.clawdbot/.env` — or set it when you next push from Mac): add  
  `NTFY_TOPIC=jarvis-pixel`  
  (and `NTFY_URL=https://ntfy.sh` if using ntfy.sh).
- Plan-execute and heartbeat already post to ntfy when the topic is set. Restart cron or re-run a script once; after that you’ll get a push when each report is ready.

**Result:** You see “JARVIS plan-execute” or “JARVIS heartbeat” on the lock screen without opening Termux.

---

## 2. Chat with JARVIS in the phone’s browser

The gateway on the Pixel is on port 18789. You can’t open `http://127.0.0.1:18789` from Chrome on the same device without binding to `0.0.0.0`. If you bind the gateway to `0.0.0.0` (see below), then on the Pixel open Chrome and go to:

- **JARVIS UI (if you host it):** Any app that points at `http://127.0.0.1:18789` (or `http://localhost:18789`) for the chat API.
- **Built-in chat:** Run `start-jarvis-pixel.sh` then open **http://127.0.0.1:18888** in Chrome for a ready-made chat UI (see **docs/JARVIS_ON_ANDROID_COMMUNICATE.md**).
- **Minimal test:** Save a one-page HTML that POSTs to `http://127.0.0.1:18789/v1/chat/completions` and shows the reply; open that file in Chrome (e.g. from `~/storage/downloads/chat.html`).

To make the gateway reachable from the browser on the same device, start it listening on all interfaces. In Termux, when you start the gateway, set:

```bash
export HOST=0.0.0.0
# then start gateway (e.g. npx clawdbot gateway run --port 18789)
```

(You’d need to adjust your start script or the setup to use `HOST=0.0.0.0` so the gateway binds to `0.0.0.0:18789`.)

**Result:** Chat with JARVIS from the Pixel’s browser using the local LLM (InferrLM).

---

## 3. GitHub webhooks to the Pixel (ngrok in Termux)

Right now the webhook server on the Pixel is only reachable on the device (and via ADB forward). To let GitHub trigger plan-execute when you push:

- **In Termux on the Pixel:** Install ngrok (download the ARM64 binary or use a package if available). Run:  
  `ngrok config add-authtoken YOUR_TOKEN`  
  then  
  `ngrok http 18791`  
  and note the HTTPS URL (e.g. `https://xxxx.ngrok-free.app`).
- **GitHub:** In each repo (or use your existing script), set the webhook URL to  
  `https://YOUR-NGROK-URL/webhook/github`  
  and set `GITHUB_WEBHOOK_SECRET` in `~/.clawdbot/.env` on the Pixel to match GitHub.
- Keep the ngrok session running in Termux (or run it in the background). After a reboot, start ngrok again and update the webhook URL if it changed (free tier).

**Result:** Pushes to your repos trigger plan-execute on the Pixel, no Mac needed.

---

## 4. Termux widget / quick run (trigger from home screen)

- **Termux:Widget** (add-on from F-Droid): Create a script in `~/.shortcuts/` that runs a one-liner, e.g.  
  `cd ~/JARVIS && node scripts/jarvis-autonomous-plan-execute.js --no-webhook`  
  and have the widget run that script.
- Add a widget to the home screen that runs “Plan-execute now” or “Heartbeat now”.

**Result:** One tap to run plan-execute or heartbeat without opening Termux.

---

## 5. “Share to JARVIS” (link or text → reply)

Concept: an Android app or shortcut that takes shared text/URL and POSTs it to the gateway as a user message, then shows the reply. Options:

- **Tasker + Termux plugin:** Tasker “Share” profile → run a Termux script that reads the shared text, curls the gateway, and shows a notification with the reply.
- **Custom tiny app:** Simple app with a “Share” target that sends the shared content to `http://127.0.0.1:18789/v1/chat/completions` and displays the result.

**Result:** Share an article or question from any app and get a JARVIS reply on the device.

---

## 6. Voice / “Hey JARVIS” on the Pixel (future)

JARVIS has wake-word and voice on other platforms (e.g. jarvis-wake-mac). On the Pixel you could:

- Run a lightweight “listener” in Termux (or a small Android app) that records when a wake word is detected and streams audio to a speech-to-text API, then sends the text to the local gateway and speaks the reply (TTS).
- Or use the **Google Assistant** with a custom action that forwards to your gateway (more setup, possible with App Actions / shortcuts).

**Result:** Hands-free “Hey JARVIS, what’s the status?” on the Pixel.

---

## 7. Offline-first / airplane mode

The Pixel already runs InferrLM locally, so the LLM is offline-capable. For true “airplane mode JARVIS”:

- Ensure cron and scripts don’t fail when the network is down: use `--no-webhook` for plan-execute/heartbeat when you know you’re offline, or add a small check (e.g. ping or curl) and skip webhook/ntfy if unreachable.
- Optionally queue reports and send when back online (would need a small wrapper script).

**Result:** JARVIS still runs plan-execute and heartbeat on the Pixel when there’s no internet; only notifications and webhooks are skipped.

---

## 8. Second node: add the iPhone from the Pixel

If your iPhone runs InferrLM on the same Wi‑Fi:

- In Termux, add a second adapter pointing at the iPhone’s IP (e.g. `PIXEL_URL=http://192.168.1.42:8889 ADAPTER_PORT=8887 python3 inferrlm_adapter.py`).
- Use a config that includes both 8888 (local) and 8887 (iPhone), like the Mac’s `config.yaml` (or add the 8887 model block to `config-termux.yaml`).

**Result:** Pixel + iPhone both used for inference, same as on the Mac.

---

## One-time unlock setup (ntfy + widget)

On the Pixel, in **Termux**, run (same folder as the other scripts):

```bash
cd /storage/emulated/0/Download
bash setup-unlock-pixel.sh jarvis-pixel
```

Use a different topic if you like (e.g. `jarvis-jeff`). The script will:

- Add `NTFY_TOPIC` and `NTFY_URL` to `~/.clawdbot/.env`.
- Create `~/.shortcuts/plan-execute.sh` and `~/.shortcuts/heartbeat.sh` for Termux:Widget.

Then:

1. **Install Termux:Widget** from F-Droid. Add a widget to your home screen → choose “plan-execute” or “heartbeat.”
2. **Install the ntfy app** (Play Store or [ntfy.sh](https://ntfy.sh)). Subscribe to the topic you used (e.g. `jarvis-pixel`). You’ll get a push when plan-execute or heartbeat finishes.

The script is at **`scripts/setup-unlock-pixel.sh`** in the JARVIS repo; push it to the Pixel with `adb push scripts/setup-unlock-pixel.sh /sdcard/Download/` if you haven’t already.

---

## Quick wins to do first

| Priority | What | Effort |
|----------|------|--------|
| 1 | **ntfy** — run `setup-unlock-pixel.sh`, subscribe in ntfy app | Low |
| 2 | **Termux:Widget** — install add-on, add widget from `~/.shortcuts/` | Low |
| 3 | **ngrok in Termux** — GitHub webhooks to the Pixel | Medium |
| 4 | **Bind gateway to 0.0.0.0** — then chat from Chrome on the Pixel | Medium (script change) |

See **JARVIS_ON_PIXEL_WIFI.md** for setup and **HARDWARE_ALWAYS_ON.md** (Option D) for caveats and reliability.
