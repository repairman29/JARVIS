# Communicate with JARVIS on Android (Pixel)

Ways to talk to JARVIS from your Pixel: **voice** (tap mic, hear replies), chat in the browser, one-tap reports, and notifications.

---

## 1. Voice: tap mic, JARVIS speaks (recommended)

Use the **Web Speech API** in Chrome on the Pixel: tap the mic, speak your message, and JARVIS replies in text and (optionally) reads the reply aloud.

**On the Pixel:**

1. Start the stack: `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`
2. Open Chrome and go to **http://127.0.0.1:18888/voice** (or tap the **open-jarvis-voice** shortcut if you’ve run `setup-unlock-pixel.sh`).
3. Allow microphone when Chrome asks.
4. Tap the **mic button** (round button), say your question or command, then tap again to stop (or wait for the final result). Your speech is sent as text to JARVIS; the reply appears and, if **“Speak replies”** is checked, JARVIS speaks it (browser TTS).
5. **"Hey JARVIS" mode:** Check **Listen for "Hey JARVIS"**. The page listens continuously; when you say **"Hey JARVIS"** or **"JARVIS"** followed by a command (e.g. "what time is it"), it sends the command and speaks the reply. You can also say "Hey JARVIS" then pause, then say the command. Keep the tab open (Chrome may stop listening if the tab is backgrounded).
6. You can still type in the box and tap **Send**; conversation history is kept so follow-ups work.

**Requirements:** Chrome on Android (Web Speech API for mic and TTS). No extra apps. The chat server (port 18888) and gateway must be running.

**One-tap voice:** Run `bash ~/JARVIS/scripts/setup-unlock-pixel.sh` and add **open-jarvis-voice.sh** from `~/.shortcuts/` to Termux:Widget so one tap opens the voice page.

---

## 2. Chat in the browser (type only)

After the JARVIS stack is running on the Pixel (`bash ~/JARVIS/scripts/start-jarvis-pixel.sh`), a **chat server** runs on port **18888** and serves a minimal chat page.

**On the Pixel:**

1. Open **Chrome** (or any browser).
2. Go to: **http://127.0.0.1:18888** (or **http://localhost:18888**).
3. Type a message and tap **Send** — JARVIS replies using the local gateway (InferrLM).

**One-tap to open chat:** If you’ve run `bash ~/JARVIS/scripts/setup-unlock-pixel.sh`, you have a shortcut **open-jarvis-chat.sh** in `~/.shortcuts/`. Add it as a Termux:Widget button: one tap opens the browser to the chat page.

**Requirements:**

- Stack must be running (adapter, proxy, gateway, webhook, **and** chat server).  
  `start-jarvis-pixel.sh` starts all of them, including the chat server.
- InferrLM app: **Server ON** (port 8889).

**If chat doesn’t load:** In Termux run `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18888/`. If you get `200`, the chat server is up; try opening the URL again in Chrome. If not, restart the stack: `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`.

---

## 3. Gateway reachable from the device

The gateway is started with **`--bind lan`** so it listens on all interfaces (0.0.0.0). That allows:

- The **chat server** (port 18888) to proxy requests to the gateway (127.0.0.1:18789).
- Any other app on the Pixel to call **http://127.0.0.1:18789** (e.g. a future “Share to JARVIS” or custom app).

So you can communicate with JARVIS from the browser today, and from other apps later without changing the setup.

---

## 3b. Speak API: make the Pixel say something (Echeo, webhooks)

The chat server exposes **POST /speak** (and **POST /alert**) so any service can send text and the Pixel speaks it via TTS (termux-tts-speak). Use this for Echeo escalations, CI alerts, or BEAST/Alfred verbal notifications.

**From the same LAN (e.g. your Mac):**

```bash
curl -X POST http://<pixel-ip>:18888/speak -d "High priority: PR build failed on main"
# or JSON:
curl -X POST http://<pixel-ip>:18888/speak -H "Content-Type: application/json" -d '{"text":"Echeo: review required"}'
```

**Requirements:** Chat server running (port 18888), **TTS FIFO** created (`mkfifo ~/.tts_pipe`) and the **TTS reader loop** running in Termux (see [PIXEL_VOICE_RUNBOOK.md §4](./PIXEL_VOICE_RUNBOOK.md#4-fifo-tts-low-latency-system-tts)). If the FIFO isn’t set up, the server returns 503.

**See:** [PIXEL_GOD_MODE.md §4](./PIXEL_GOD_MODE.md#4-integration-with-your-projects-cursor-beast-echeo) for Echeo/BEAST integration.

---

## 4. One-tap plan-execute and heartbeat

- **Termux:Widget** (F-Droid): add a widget that runs **plan-execute** or **heartbeat** from `~/.shortcuts/` (created by `setup-unlock-pixel.sh`). One tap runs the script and you get an **ntfy** notification when it finishes.
- No need to open Termux to run a report.

---

## 5. Notifications when JARVIS runs

- **ntfy:** Set `NTFY_TOPIC` in `~/.clawdbot/.env` and run `setup-unlock-pixel.sh`; subscribe to that topic in the ntfy app. When plan-execute or heartbeat finishes, you get a push with the report summary.

---

## 6. Optional: Share to JARVIS (later)

- **Share to JARVIS:** Use **Tasker + Termux plugin** so “Share” sends the shared text to the gateway (POST to http://127.0.0.1:18789/v1/chat/completions) and shows the reply in a notification. Or build a small Android app with a Share target.
- **“Hey JARVIS” wake word** on Android would require a separate listener (e.g. browser continuous recognition or a small app). On the voice page, check **Listen for "Hey JARVIS"** (see §1 step 5) for continuous listen; the browser reacts to "Hey JARVIS" or "JARVIS" plus your command.

---

## Quick reference

| Goal                         | Action |
|-----------------------------|--------|
| **Voice:** tap mic, hear replies | Open Chrome → **http://127.0.0.1:18888/voice** (or use **open-jarvis-voice** shortcut). |
| Chat (type) with JARVIS     | Open Chrome → http://127.0.0.1:18888 (after starting the stack). |
| One-tap voice               | Run `setup-unlock-pixel.sh`, add **open-jarvis-voice** to Termux:Widget. |
| One-tap open chat           | Run `setup-unlock-pixel.sh`, add **open-jarvis-chat** to Termux:Widget. |
| One-tap plan-execute/heartbeat | Run `setup-unlock-pixel.sh`, add **plan-execute** or **heartbeat** to Termux:Widget. |
| Get reports on the phone    | Set `NTFY_TOPIC`, run `setup-unlock-pixel.sh`, subscribe in ntfy app. |
| Start everything (including chat) | **From Mac (SSH):** `./scripts/ssh-pixel-start-jarvis.sh` — enter password once; launchers + stack start on Pixel. **From Pixel (Termux):** `bash ~/start-jarvis.sh` or `cd ~/JARVIS && bash scripts/start-jarvis-pixel.sh`. |
| **Make Pixel speak (Echeo, alerts)** | `POST http://<pixel-ip>:18888/speak` with message body or `{"text":"..."}`. Requires TTS FIFO + reader (runbook §4). |

---

## Troubleshooting

- **“Refused to connect”** (Chrome when opening 18888 or /voice): Nothing is listening on that port — the **chat server** (or the whole stack) isn’t running. **Fix:** In **Termux** run:
  ```bash
  bash ~/start-jarvis.sh
  ```
  (If that fails with “no such file”, run `bash ~/JARVIS/scripts/install-pixel-launchers.sh` once to create the launchers, or run `cd ~/JARVIS && bash scripts/start-jarvis-pixel.sh`.) Wait until you see `Chat UI: 200`, then try the URL again. If you only need the chat server: `bash ~/start-chat.sh` or `bash ~/JARVIS/scripts/start-pixel-chat-only.sh`.
- **“No such file or directory”** when running a script: The path to JARVIS may be wrong or the launchers weren’t created. **Fix:** In Termux run once:
  ```bash
  cd ~/JARVIS && bash scripts/install-pixel-launchers.sh
  ```
  Then use `bash ~/start-jarvis.sh` or `bash ~/start-chat.sh`. If `~/JARVIS` doesn’t exist, push again from the Mac (`./scripts/push-jarvis-to-pixel-ssh.sh`) and run setup in Termux.
- **“Gateway unreachable” in chat:** Gateway or InferrLM may be down. In Termux: `curl -s http://127.0.0.1:18789/` and `curl -s http://127.0.0.1:4000/`; restart with `start-jarvis-pixel.sh` if needed.
- **Chat page doesn’t load (blank or error):** Check chat server: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18888/`. If not 200, run `start-jarvis-pixel.sh` or `start-pixel-chat-only.sh`.
- **After reboot:** Use **Termux:Boot** and the `termux-boot-start-jarvis` script so the stack (and chat server) start automatically; then open http://127.0.0.1:18888 to chat.
- **Proxy 000 / "No module named litellm":** In Termux run `pip install litellm[proxy]` (or `cd ~/neural-farm && pip install -r requirements.txt`), then run `bash ~/start-jarvis.sh` again.
- **pip install litellm fails (cryptography build / "Unsupported platform"):** Termux can't build the `cryptography` wheel. Install it from Termux packages first, then pip:
  ```bash
  pkg install python-cryptography
  pip install 'litellm[proxy]'
  ```
  Then run `bash ~/start-jarvis.sh` again.
- **pip install litellm fails (fastuuid build / "error installing build dependencies"):** The install script tries TUR and then falls back to **litellm&lt;1.76.1** (no fastuuid). Run:
  ```bash
  bash ~/JARVIS/scripts/install-litellm-termux.sh
  ```
  It will try: TUR + fastuuid + latest litellm, then minimal deps, then `litellm[proxy]<1.76.1` or `litellm<1.76.1` + uvicorn/fastapi/pyyaml/aiohttp. If that still fails, run `bash ~/start-jarvis.sh` anyway—the gateway will use the adapter at 8888 and chat will work without the proxy.
- **Gateway 000 / "EACCES: permission denied, mkdir '/tmp/clawdbot'":** Termux can't write `/tmp`. The start script now sets `TMPDIR=~/tmp`; push the latest scripts and run `bash ~/start-jarvis.sh` again. Or once in Termux: `mkdir -p ~/tmp && export TMPDIR=$HOME/tmp` before starting the gateway.
