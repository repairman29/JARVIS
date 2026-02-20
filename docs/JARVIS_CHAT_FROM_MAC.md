# Chat with JARVIS on the Pixel from your Mac

Lightweight tools to send prompts and chat with JARVIS running on the Pixel over WiFi. No npm deps; Node only. Same network required.

---

## Quick start

**GUI (browser):**
```bash
cd ~/JARVIS && ./scripts/jarvis-chat-gui
```
Opens http://localhost:9191 in your browser. Type messages and press Enter or click Send.

**CLI one-shot:**
```bash
cd ~/JARVIS && ./scripts/jarvis-chat "what's the weather"
```

**CLI interactive:**
```bash
cd ~/JARVIS && ./scripts/jarvis-chat
```
Type messages; empty line or Ctrl+C to exit.

---

## Prerequisites

- **Pixel:** JARVIS stack running. Mac tools use the **chat server (18888)** by default. If you get **405** or **ECONNREFUSED on 18789**, restart the stack on the Pixel so the gateway binds to the network: `bash ~/JARVIS/scripts/start-jarvis-pixel.sh` (or from Mac: `./scripts/ssh-pixel-start-jarvis.sh`). Then you can set `JARVIS_PIXEL_PORT=18789` to talk to the gateway directly.
- **Mac and Pixel** on the same Wi‑Fi (or reachable network).
- **Pixel IP:** Either set `JARVIS_PIXEL_IP` in the environment, or have a `.pixel-ip` file in the JARVIS repo root (other Pixel scripts write this when they resolve the IP via ADB or when you pass the IP as an argument).

---

## GUI (jarvis-chat-gui)

| What | How |
|------|-----|
| **Start** | `./scripts/jarvis-chat-gui` or `node scripts/jarvis-chat-gui.js` |
| **Port** | Default 9191. Override: `./scripts/jarvis-chat-gui 9192` or `JARVIS_GUI_PORT=9192 ./scripts/jarvis-chat-gui` |
| **Open in browser** | The script tries to open http://127.0.0.1:9191 automatically (macOS). If not, open that URL manually. |
| **Stop** | Stop the Node process (Ctrl+C in the terminal where you started it, or kill the PID). |

The GUI shows your messages and JARVIS replies in a simple dark chat layout. The header shows which Pixel IP:port is used (default **18888** = chat server). If you get 405, restart the Pixel stack and try `JARVIS_PIXEL_PORT=18789` to use the gateway directly (gateway must be started with `BIND_LAN=1`, which the Pixel start script does).

**Using Gemini Nano from the Mac chat UI:** The same browser chat (localhost:9191) talks to the Pixel’s chat server; the Pixel gateway uses an LLM router when you have multiple backends. If the **JARVIS Gemini Bridge** app is running on the Pixel (Listening on 127.0.0.1:8890) and the Pixel stack was started with the router (e.g. `JARVIS_GEMINI_NANO_BRIDGE=1` or with `JARVIS_IPHONE_LLM_URL` set), the router includes Gemini Nano in the rotation. No change needed on the Mac—just start the bridge app on the Pixel and (for Pixel-only) start the stack with `JARVIS_GEMINI_NANO_BRIDGE=1` so the router runs.

**Fast chat:** For quick replies (~1–2 s), use the fast path: (1) On the Pixel, start the **JARVIS Gemini Bridge** app (tap Start → "Listening"); (2) Start the stack with the router so chat-task is on (`JARVIS_GEMINI_NANO_BRIDGE=1 bash ~/JARVIS/scripts/start-jarvis-pixel.sh`). Short, tool-free messages then go to Nano (8890). If it’s still slow, run the speed test on the Pixel (`node scripts/pixel-llm-speed-test.js`) to confirm Nano is fastest.

---

## CLI (jarvis-chat)

| What | How |
|------|-----|
| **One-shot** | `./scripts/jarvis-chat "your prompt"` |
| **Interactive** | `./scripts/jarvis-chat` — then type; empty line to exit |
| **Specify Pixel IP** | `./scripts/jarvis-chat 192.168.1.50 "hello"` or `JARVIS_PIXEL_IP=192.168.1.50 ./scripts/jarvis-chat "hello"` |

---

## Pixel IP

The tools resolve the Pixel IP in this order:

1. **Environment:** `JARVIS_PIXEL_IP`
2. **Cache file:** `JARVIS/.pixel-ip` (written by other scripts when they use ADB or when you pass an IP)
3. **Default:** `10.1.10.50`

To find the Pixel IP: in Termux on the Pixel run `ifconfig`, or check Wi‑Fi settings on the phone. Then either pass it when you run the script or set `JARVIS_PIXEL_IP` / write it to `.pixel-ip`.

**New WiFi (e.g. home vs work):** The Pixel gets a new IP on each network. Update it once:

- **If Pixel is connected via USB (or ADB already connected):**  
  `./scripts/pixel-refresh-ip.sh` — discovers the current IP via ADB and updates `.pixel-ip`.
- **Otherwise:** On the Pixel (Termux) run `ifconfig` and note the `inet` under `wlan0`. Then on the Mac:  
  `./scripts/pixel-refresh-ip.sh <that-ip>`  
  Or for a single run: `JARVIS_PIXEL_IP=<ip> ./scripts/jarvis-chat "hello"`.

---

## Troubleshooting

- **"Pixel unreachable" / ECONNREFUSED:** Same Wi‑Fi, firewall, and that the stack is running. Default port is **18888** (chat server). If you use **18789** (gateway), the gateway must be bound to the network: restart the stack on the Pixel with `bash ~/JARVIS/scripts/start-jarvis-pixel.sh` (it sets `BIND_LAN=1` so the gateway listens on all interfaces).
- **Wrong Pixel:** Set `JARVIS_PIXEL_IP` or pass the IP as the first argument (CLI: `./scripts/jarvis-chat 192.168.1.50 "hello"`; GUI: `JARVIS_PIXEL_IP=192.168.1.50 ./scripts/jarvis-chat-gui`).
- **GUI doesn’t open in browser:** Open http://localhost:9191 (or the port you used) manually.

---

## Related

- **WiFi automation (sync, start, SSH, logs):** [PIXEL_WIFI_AUTOMATION.md](./PIXEL_WIFI_AUTOMATION.md)
- **Chat and voice on the Pixel itself:** [JARVIS_ON_ANDROID_COMMUNICATE.md](./JARVIS_ON_ANDROID_COMMUNICATE.md)
