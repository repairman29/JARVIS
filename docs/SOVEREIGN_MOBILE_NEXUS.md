# Sovereign Mobile Nexus — Architecture Reference

**Vision:** Host a high-fidelity, autonomous JARVIS-class agent on the Google Pixel 8 Pro: sovereign (user-owned), multi-modal (voice, vision, system control), and capable of 24/7 operation. This doc captures the definitive architecture and maps it to JARVIS/OpenClaw so we can execute on the [Pixel Perfection roadmap](./PIXEL_PERFECTION_ROADMAP.md).

*Inspired by the "Sovereign Mobile Nexus" systems-architecture vision (Feb 2026): Tensor G3 + Termux/Proot + OpenClaw (Clawdbot) as a pocket-sized agent server.*

---

## 1. Functional requirements ("badass" definition)

| Pillar | Meaning | JARVIS / roadmap |
|--------|--------|-------------------|
| **Sovereignty** | Agent runs locally or user-controlled; answers only to the user. | ✅ Gateway + InferrLM/adapter on device; no proprietary lock-in. |
| **Omniscience** | Access to device sensors: mic, camera, location, battery, notifications. | 🟡 Voice (mic) + TTS done; camera, termux-api, notifications on roadmap. |
| **Omnipotence** | Execute actions a user can: open apps, tap, type, swipe. | ⬜ ADB skill for UI control; shell skill exists via gateway tools. |
| **Personality** | Distinct persona (e.g. JARVIS: dry, witty, concise). | ✅ system_prompt / SOUL-style prompt in voice_node and gateway. |
| **Ubiquity** | Accessible 24/7, via voice and (optionally) Telegram/WhatsApp/Discord. | ✅ Browser /voice + terminal voice node; channels via OpenClaw integrations. |

---

## 2. Overcoming the Android sandbox

### 2.1 Termux vs Proot-Distro

- **Termux (current JARVIS path):** Native Android env, Bionic libc, `pkg` packages. Works with Node, Python, PulseAudio, Whisper.cpp, termux-api. Some native modules need stubs (e.g. clipboard).
- **Proot-Distro (optional “sovereign” path):** Full Ubuntu (or other distro) inside Termux via `proot-distro`. Glibc, Debian repos, binary compatibility with desktop Linux. Use when you need exact parity with VPS tutorials or when native Node modules fail in plain Termux.

```bash
# Proot-Distro setup (optional)
pkg install proot-distro
proot-distro install ubuntu
proot-distro login ubuntu
# Then: apt update, install Node 22, openclaw, etc.
```

JARVIS today targets **Termux-first**; Proot is documented as an alternative for maximum compatibility.

### 2.2 Phantom Process Killer (PPK) — full bypass

Android 12+ limits phantom processes (e.g. 32) and can reset flags. For 24/7 agent uptime, use ADB (from a PC or wireless ADB):

| Step | Command | Purpose |
|------|--------|--------|
| 1 | `adb shell "/system/bin/device_config set_sync_disabled_for_tests persistent"` | Prevents phenotype sync from resetting flags (e.g. nightly). |
| 2 | `adb shell "/system/bin/device_config put activity_manager max_phantom_processes 2147483647"` | Raises phantom process limit to effective max. |
| 3 | `adb shell settings put global settings_enable_monitor_phantom_procs false` | Disables the phantom-process monitor (saves CPU). |

Then **reboot** the device. Step 1 is from the Sovereign Nexus report; steps 2–3 are in [PIXEL_VOICE_RUNBOOK.md §1](./PIXEL_VOICE_RUNBOOK.md#1-adb-phantom-process-limit). All three together give the strongest bypass.

### 2.3 Network: Tailscale (optional)

Stable identity and secure access from laptop/tablet without opening ports on carrier NAT:

- Install Tailscale (Termux pkg or Android app).
- Pixel gets a stable Tailscale IP; gateway (18789) and chat (18888) bind to `0.0.0.0` so they’re reachable on the Tailscale mesh.
- Access dashboard/API from any device on the same Tailscale network.

---

## 3. Mind: hybrid intelligence

- **Primary (reasoning):** Claude 3.5 Sonnet (or other cloud SOTA) via OpenClaw gateway — complex planning, coding, tool use.
- **Local / edge (optional):** Gemini Nano on Tensor G3 via a bridge (e.g. gemini-cli-termux or AICore proxy) exposing an OpenAI-compatible endpoint. Use for low-latency, offline, or PII-sensitive tasks.
- **Routing:** OpenClaw can route by task (e.g. simple Q&A → local; coding → cloud). JARVIS stack today uses InferrLM (on-device) + optional cloud; Gemini Nano bridge is a roadmap option.

---

## 4. Senses (multi-modal input)

| Sense | Tech | Status in JARVIS |
|-------|------|-------------------|
| **Hearing** | Whisper (e.g. whisper.cpp base.en), PulseAudio, VAD | ✅ voice_node.py + runbook. |
| **Sight** | termux-camera-photo → image to vision model (Claude/Gemini) | 📋 Camera/vision skill on roadmap. |
| **Proprioception** | termux-api: battery, WiFi, location, notifications | 📋 termux-api skill / tools on roadmap. |

---

## 5. Hands (actuation)

| Capability | Mechanism | Status |
|------------|-----------|--------|
| **Shell** | Gateway tools execute scripts (termux-exec for /bin/bash). | ✅ In use. |
| **TTS** | termux-tts-speak via FIFO; optional ElevenLabs for high-fidelity voice. | ✅ FIFO + reader; ElevenLabs optional skill. |
| **UI control** | ADB: tap, swipe, input text, uiautomator dump, screencap. | 📋 ADB skill on roadmap (see §8 tables). |

---

## 6. Soul: personality and proactivity

- **Persona:** System prompt (e.g. in gateway or voice_node `system_prompt`) defines tone — e.g. JARVIS: dry, witty, concise, British spelling. A dedicated **SOUL.md** (or equivalent) can be the single source for identity and constraints.
- **Heartbeat:** Periodic injected prompt (e.g. every 30 min) so the agent reviews system state (battery, notifications, time) and can proactively message or speak. OpenClaw supports heartbeat; JARVIS orchestration has scheduled briefs and alerts (see RUNBOOK, ORCHESTRATION_SCRIPTS).

---

## 7. Lifecycle: 24/7 reliability

| Concern | Approach |
|---------|----------|
| **Wakelock** | `termux-wake-lock` or ADB `dumpsys deviceidle whitelist +com.termux` so CPU doesn’t deep-sleep. [Runbook §1](./PIXEL_VOICE_RUNBOOK.md#1-adb-phantom-process-limit). |
| **Swap** | 4GB swap file in Termux to reduce OOM kills. [Runbook §9](./PIXEL_VOICE_RUNBOOK.md#9-optional-swap-file). |
| **Thermal** | Monitor battery temp via termux-api; throttle or warn if device overheats. |
| **Backup** | Cron: back up vector store, SOUL.md, and config (e.g. rclone to cloud) so agent state survives loss of device. |
| **Security** | Gateway auth; Tailscale for remote access; human-in-the-loop for sensitive actions (e.g. payments). |

---

## 8. Reference tables (actionable)

### ADB commands for UI control (when ADB skill exists)

| Action | ADB command pattern | Use |
|--------|----------------------|-----|
| Launch app | `am start -n <package>/<activity>` | Open Spotify, Maps, etc. |
| Tap | `input tap <x> <y>` | Click buttons. |
| Type | `input text "<string>"` | Search, messages. |
| Swipe | `input swipe <x1> <y1> <x2> <y2> <duration>` | Scroll, unlock. |
| Key | `input keyevent <code>` | Home (3), Back (4), Enter (66). |
| Dump UI | `uiautomator dump /sdcard/window_dump.xml` | Read screen for coordinates. |
| Screenshot | `screencap -p /sdcard/screen.png` | Vision input for agent. |

*ADB server on device: `adb tcpip 5555` then `adb connect localhost:5555` from agent context.*

### Recommended skill stack (Sovereign Nexus)

| Skill / capability | Tech | Function |
|--------------------|------|----------|
| android-adb | ADB | UI control: launch, tap, type, dump, screencap. |
| termux-api | Termux pkg | Sensors: battery, WiFi, location, notifications. |
| whisper-local | whisper.cpp | Local STT (voice node). |
| TTS | termux-tts-speak + optional ElevenLabs | Reply voice; ElevenLabs for cloned/JARVIS voice. |
| camera | termux-camera-photo | Vision input for LLM. |
| browser | Puppeteer/Playwright (if in Proot) | Web research, scraping. |
| memory | Vector store (OpenClaw/gateway) | Persistent recall. |

### Architecture comparison

| Feature | Cloud assistant (Siri/Google) | Basic chatbot | Pixel + OpenClaw/JARVIS (Sovereign) |
|---------|------------------------------|---------------|-------------------------------------|
| Reasoning | Opaque, stateless | Cloud LLM, stateless | Hybrid (cloud + optional Gemini Nano) |
| System control | Restricted APIs | None | Full UI (ADB) + shell |
| Memory | None / session | Session | Persistent vector DB |
| Voice | Standard | Standard TTS | termux-tts or ElevenLabs |
| Uptime | On-demand | On-demand | 24/7 with PPK bypass + wakelock |
| Customization | None | Prompt only | Full skills + SOUL/persona |

---

## 9. Use-case scenarios (target state)

- **Sentry:** Phone docked; on command, loop: mic → noise threshold → camera capture → vision model; if person detected, alert user (Telegram + TTS).
- **Concierge:** “Research X and summarize.” Agent uses browser/search, scrapes, synthesizes, optionally PDF + WhatsApp.
- **Automator:** “Send $50 to Mom on Venmo.” Agent uses ADB to open Venmo, navigate, fill; **human-in-the-loop:** “Confirm?” before final tap.

These depend on camera skill, ADB skill, and (optionally) channel integrations; they are roadmap targets.

---

## 10. Mapping to JARVIS and the roadmap

| Sovereign Nexus piece | JARVIS today | Roadmap (PIXEL_PERFECTION_ROADMAP) |
|------------------------|--------------|-------------------------------------|
| PPK bypass (3 commands) | Runbook has 1; add set_sync_disabled + monitor_phantom_procs | Runbook §1 update. |
| Termux stack | start-jarvis-pixel.sh, voice node, /voice, /speak | Done. |
| Proot-Distro | Doc only | Optional path in runbook or separate doc. |
| Tailscale | Doc only | Stretch: document bind 0.0.0.0 + Tailscale. |
| Hybrid (Gemini Nano) | InferrLM on-device; cloud optional | Stretch: Gemini bridge. |
| Voice (Whisper + TTS) | voice_node, FIFO, termux-tts | Done; ElevenLabs optional. |
| Camera / vision | — | Stretch: camera skill + vision API. |
| termux-api (sensors) | ✅ Battery: [skills/pixel-sensors](../skills/pixel-sensors) (`get_pixel_device_status`). | WiFi, location, notifications optional. |
| ADB (UI control) | — | Stretch: android-adb skill. |
| SOUL / persona | system_prompt in voice_node + gateway | Done; SOUL.md optional. |
| Heartbeat / proactive | OPERATION_NEXT, POST /speak | Partial; extend per roadmap. |
| Backup | — | Stretch: cron + rclone. |

---

## 11. References

| Doc | Purpose |
|-----|--------|
| [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md) | What to build next; Sovereign Nexus items folded in. |
| [PIXEL_GOD_MODE.md](./PIXEL_GOD_MODE.md) | Technical execution (ADB, Vulkan, voice, integration). |
| [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) | Step-by-step setup; includes full ADB bypass. |
| [PIXEL_8_PRO_BADASS.md](./PIXEL_8_PRO_BADASS.md) | One-page max JARVIS setup. |
| [EDGE_NATIVE_VOICE_NODE.md](./EDGE_NATIVE_VOICE_NODE.md) | Tensor G3, voice pipeline, RPC. |

**How to use:** Treat this as the architecture reference for “Sovereign Mobile Nexus.” Implement items via [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md); update both docs as we ship.
