# What the Pixel Can Do Now — and What You Can Do With JARVIS There

After unbridling, dual-LLM (Pixel + iPhone), and “Pixel as brain” setup, here’s what the Pixel is capable of and how you use JARVIS on and from it.

---

## 1. What the Pixel is capable of now

### Brain (LLM + gateway)

| Capability | What it is |
|------------|------------|
| **Dual LLM** | **Pixel InferrLM** (127.0.0.1:8889) + **iPhone InferrLM** (JARVIS_IPHONE_LLM_URL). Router (18890) round-robins or routes by model so JARVIS can use both. |
| **Gateway** | Clawdbot gateway on 18789 (BIND_LAN so Mac can reach it). Full tools: exec, GitHub, build_server, team-status, skills (pixel-sensors, pixel-camera, pixel-adb when ADB is set), etc. |
| **Chat server** | 18888 — serves browser UI and proxies `/v1/chat/completions` to gateway (with fallback to adapter if gateway returns 405/502). |
| **Webhook** | 18791 — GitHub/webhook trigger for plan-execute. |

### Always-on and unbridled

| Capability | What it is |
|------------|------------|
| **Unbridled** | PPK bypass applied (max phantom processes, monitor off, sync disabled). Android is much less likely to kill Termux or the stack. |
| **Wakelock / whitelist** | Wake lock in Termux + deviceidle whitelist for Termux so the device can stay awake and cron can run when the screen is off. |
| **Cron** | plan-execute at 8 / 14 / 20, heartbeat every 6h (from setup). Optional Termux:Boot so the stack starts after reboot. |

### Voice and TTS

| Capability | What it is |
|------------|------------|
| **Browser voice** | On the Pixel, open `http://127.0.0.1:18888/voice` — tap mic, speak; JARVIS replies in text and can speak via TTS (Termux:API). |
| **TTS FIFO** | `~/.tts_pipe` — any process can write text and it’s spoken with `termux-tts-speak`. Used by chat/voice UI and voice node. |
| **Voice node** | Manual-trigger mode (press Enter to record) in Termux; STT → gateway → TTS. True wake word needs onnxruntime (roadmap). |

### Device skills (when gateway runs on Pixel)

| Skill | What JARVIS can do |
|-------|--------------------|
| **pixel-sensors** | Battery (level, charging, temp, health), WiFi (SSID, link speed), location (GPS). “What’s my battery?”, “Where am I?”, “What WiFi am I on?” |
| **pixel-camera** | Take a photo (back/front). “What am I holding?”, or feed image to a vision model. Needs Termux:API + camera permission. |
| **pixel-adb** | Tap, swipe, type, screenshot, UI dump, launch app — control the device via ADB. Needs ADB (e.g. wireless debugging) and `ADB_SERIAL` set. |

### Roadmap: wake word, Gemini Nano, Proot

- **True wake word (“Hey JARVIS”) on-device** — Try Termux `pkg install python-onnxruntime`; if it works, voice node uses OpenWakeWord. Else use browser “Listen for Hey JARVIS” at `/voice`, or (optional) Porcupine. See [PIXEL_WAKE_WORD_OPTIONS.md](./PIXEL_WAKE_WORD_OPTIONS.md) and `scripts/pixel-wake-word-setup.sh`.
- **Gemini Nano** on Tensor G3 — Expose as OpenAI-compatible endpoint via an Android app (HTTP server on localhost → AICore). See [PIXEL_GEMINI_NANO_BRIDGE.md](./PIXEL_GEMINI_NANO_BRIDGE.md).
- **Proot-Distro** — **Recommended:** JARVIS runs in Proot/Ubuntu by default (boot + one-command start). See [PIXEL_PROOT_DISTRO.md](./PIXEL_PROOT_DISTRO.md) and `scripts/pixel-proot-setup.sh`.

---

## 2. What you can do with JARVIS on the Pixel

### On the Pixel itself

| Action | How |
|--------|-----|
| **Chat in browser** | Open Chrome → `http://127.0.0.1:18888`. Type messages; JARVIS replies using Pixel + iPhone LLMs. |
| **Voice in browser** | Open Chrome → `http://127.0.0.1:18888/voice`. Allow mic, tap mic and speak; optionally “Speak replies” for TTS. |
| **Terminal voice** | In Termux: `bash ~/JARVIS/scripts/start-voice-node-pixel.sh` — press Enter to record, JARVIS replies in text and TTS. |
| **One-shot TTS** | `curl -X POST http://127.0.0.1:18888/speak -d "Hello"` (or write to `~/.tts_pipe`) to make JARVIS speak without a full chat. |
| **Ask about device** | In chat (on device or from Mac): “What’s my battery?”, “Where am I?”, “What WiFi am I on?” — uses pixel-sensors. |
| **Take a photo** | In chat: “Take a photo” / “What do I see?” — uses pixel-camera (if Termux:API + camera permission are set). |
| **Control the phone** | In chat (with ADB set up): “Open Chrome”, “Tap the home button” — uses pixel-adb (tap, swipe, launch app, etc.). |

### From the Mac (Pixel as brain)

| Action | How |
|--------|-----|
| **Chat (CLI)** | `cd ~/JARVIS && ./scripts/jarvis-chat "your message"` or `./scripts/jarvis-chat` (interactive). Uses Pixel IP from `.pixel-ip` or `JARVIS_PIXEL_IP`. |
| **Chat (GUI)** | `./scripts/jarvis-chat-gui` → open http://localhost:9191. All traffic goes to the Pixel (18888). |
| **SSH to Pixel** | `./scripts/ssh-pixel.sh` — shell in Termux. `./scripts/ssh-pixel-start-jarvis.sh` to restart the stack. |
| **Refresh Pixel IP** | On new WiFi: `./scripts/pixel-refresh-ip.sh` (with Pixel on USB) or `./scripts/pixel-refresh-ip.sh <ip>`. |
| **Overnight / cron** | Pixel cron runs plan-execute and heartbeat on the device. Or run them on the Mac and set `JARVIS_GATEWAY_URL=http://<pixel-ip>:18789` so the Mac uses the Pixel gateway. |

### Autonomous (no you in the loop)

| What | Where it runs |
|------|----------------|
| **Plan-execute** | On the Pixel (cron 8 / 14 / 20). JARVIS plans (focus repo, PRs, issues) and runs tools (github_status, build_server_*, exec, etc.) and reports. |
| **Heartbeat** | On the Pixel (cron every 6h). Short check-in; HEARTBEAT_OK or HEARTBEAT_REPORT. |
| **Webhook** | Pixel webhook (18791) can trigger plan-execute (e.g. from GitHub). |

---

## 3. Quick reference

| I want to… | Do this |
|------------|---------|
| Chat with JARVIS from the Mac | `./scripts/jarvis-chat` or `./scripts/jarvis-chat-gui` |
| Chat / voice on the Pixel | Browser → `http://127.0.0.1:18888` or `/voice` |
| Ask “what’s my battery?” or “where am I?” | Ask in any chat (Pixel or Mac); gateway uses pixel-sensors |
| Have JARVIS speak | Use /voice with “Speak replies”, or POST to `/speak`, or voice node |
| Run plan-execute / heartbeat on a schedule | Pixel cron (already set up); keep Wake lock ON |
| Use the Pixel as the only brain | Stack + Wake lock + unbridled; Mac uses jarvis-chat to talk to it |
| Take a photo or control the phone | pixel-camera and pixel-adb (Termux:API + ADB set up); ask in chat |

---

## 4. Summary

**The Pixel right now:** Unbridled, dual-LLM (Pixel + iPhone), gateway + chat + webhook, cron (plan-execute, heartbeat), voice (browser + terminal + TTS), and device skills (sensors, camera, ADB). It can act as the always-on brain.

**What you can do with JARVIS there:** Chat and voice on the device; chat from the Mac (CLI/GUI); ask about battery, location, WiFi; take a photo or control the phone (with skills enabled); run autonomous plan-execute and heartbeat on a schedule; trigger from webhook. All of that uses JARVIS on the Pixel as the brain.

**References:** [PIXEL_AS_BRAIN.md](./PIXEL_AS_BRAIN.md), [PIXEL_UNBRIDLE.md](./PIXEL_UNBRIDLE.md), [JARVIS_CHAT_FROM_MAC.md](./JARVIS_CHAT_FROM_MAC.md), [PIXEL_VOICE_DEMO.md](./PIXEL_VOICE_DEMO.md), [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md).
