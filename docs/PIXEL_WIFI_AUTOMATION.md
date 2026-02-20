# What you can automate via WiFi (Mac → Pixel)

All of this uses **SSH to Termux** on the Pixel (port 8022). No USB/ADB needed after you know the Pixel’s IP.

**Prereqs:** Pixel and Mac on the same Wi‑Fi; in Termux run `sshd` (and once: `passwd`). Optional: run `./scripts/setup-ssh-keys-to-pixel.sh` once so nothing asks for a password.

**Finding the Pixel IP:** In Termux run `ifconfig` or check Wi‑Fi settings on the phone. Pass it as an argument if you’re not using ADB: `./scripts/ssh-pixel-start-jarvis.sh 192.168.1.100`

---

## Chat with JARVIS from the Mac (WiFi)

| What | Command |
|-----|--------|
| **GUI** (browser window) | `./scripts/jarvis-chat-gui` — opens http://localhost:9191; type and send messages. |
| **One-shot prompt** | `./scripts/jarvis-chat "what's the weather"` or `node scripts/jarvis-chat.js "your prompt"` |
| **Interactive chat** (CLI) | `./scripts/jarvis-chat` (then type messages; empty line to exit) |
| **Specify Pixel IP** | `JARVIS_PIXEL_IP=192.168.1.50 ./scripts/jarvis-chat-gui` or pass IP in env for CLI. |

Uses the Pixel’s chat server (port 18888). No npm deps. Pixel IP from `JARVIS_PIXEL_IP`, `.pixel-ip`, or default. **Full reference:** [JARVIS_CHAT_FROM_MAC.md](./JARVIS_CHAT_FROM_MAC.md).

---

## One command from the Mac (WiFi only)

| What | Command |
|-----|--------|
| **Sync JARVIS + start stack** (no password after key setup) | `cd ~/JARVIS && ./scripts/pixel-auto-sync-and-start.sh [pixel-ip]` |
| **Sync JARVIS + start** (prompts for password) | `cd ~/JARVIS && ./scripts/pixel-sync-and-start.sh [pixel-ip]` |
| **Start JARVIS only** (code already on Pixel) | `./scripts/ssh-pixel-start-jarvis.sh [pixel-ip]` |
| **Full run** (harden, start, diagnose, sensors, camera) | `./scripts/ssh-pixel-run-all.sh [pixel-ip]` |
| **Interactive shell on Pixel** | `./scripts/ssh-pixel.sh [pixel-ip]` |

---

## Logs and diagnostics (WiFi)

| What | Command |
|-----|--------|
| **Quick logs** (gateway, plan-execute, curl) | `./scripts/ssh-pixel-logs.sh [pixel-ip]` |
| **Full log bundle** (to a file on Mac) | `./scripts/ssh-pixel-logs-full.sh [pixel-ip]` |
| **Diagnose stack** (why Proxy/Gateway 000) | `./scripts/ssh-pixel-diagnose.sh [pixel-ip]` |
| **Fix chat** (restart chat server, check deps) | `./scripts/ssh-pixel-fix-chat.sh [pixel-ip]` |

---

## Push / setup (WiFi)

| What | Command |
|-----|--------|
| **Push JARVIS + neural-farm and run setup on Pixel** | `./scripts/push-jarvis-to-pixel-ssh.sh [pixel-ip]` |
| **One-time: SSH keys** (then no password) | `./scripts/setup-ssh-keys-to-pixel.sh [pixel-ip]` |

---

## How the script finds the Pixel IP

1. If you pass `[pixel-ip]`, that’s used (and cached).
2. Else if **ADB** sees the device (USB or `adb connect`), IP is read from the device and cached.
3. Else the **cached** IP from a previous run is used.
4. Else a **default** (e.g. `192.168.86.209` or `10.1.10.50` depending on script).

So for **WiFi-only** use: either connect via ADB once so the IP gets cached, or pass the IP every time:  
`./scripts/ssh-pixel-start-jarvis.sh 192.168.1.100`

---

## Set Pixel env from the Mac (WiFi)

To append a line to the Pixel’s `~/.clawdbot/.env` without opening a shell:

```bash
./scripts/ssh-pixel-set-env.sh "JARVIS_IPHONE_LLM_URL=http://192.168.1.100:8889"
./scripts/ssh-pixel-set-env.sh "PIXEL_LLM_ROUTE=round-robin" 192.168.1.50
```

Or open a shell and edit manually: `./scripts/ssh-pixel.sh`, then `echo 'KEY=value' >> ~/.clawdbot/.env`
