# Pixel Perfection — JARVIS on Pixel 8 Pro

**Goal:** Make JARVIS as capable, fast, and reliable as possible on the Pixel 8 Pro: voice-first, low latency, and (optionally) always-on. This roadmap is the single place for "what's next for JARVIS on Pixel."

**Status:** ✅ Done | 🟡 Partial | ⬜ Todo

**See also:** [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md) (architecture reference), [PIXEL_8_PRO_BADASS.md](./PIXEL_8_PRO_BADASS.md) (one-page setup), [PIXEL_GOD_MODE.md](./PIXEL_GOD_MODE.md) (technical summary), [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) (step-by-step), [JARVIS_MASTER_ROADMAP.md](./JARVIS_MASTER_ROADMAP.md) (all tracks).

---

## 1. Track summary

| Phase | Scope | Status | Notes |
|-------|--------|--------|--------|
| **1. Foundation** | Stack, voice pipeline, browser + terminal | ✅ Done | Gateway, chat server, voice node, Whisper, TTS FIFO, runbook, badass guide. |
| **2. Polish** | UX, stability, one-command start | ✅ Done | JARVIS branding, system prompt, strip "Hey JARVIS", start-jarvis-pixel.sh --voice, gateway check in voice node. |
| **3. Perfection** | True wake word, GPU, latency, full ADB bypass | 🟡 Partial | Manual trigger + browser "Hey JARVIS" work; onnxruntime blocked. Full PPK bypass (3 commands) in runbook. Vulkan/doc only. |
| **4. Sovereign Nexus** | Omniscience + omnipotence: sensors, ADB UI, vision, Tailscale | 🟡 Partial | ADB skill, camera skill, pixel-sensors (battery + WiFi + location) done; SOUL template + voice system_prompt_file; Tailscale/Proot/latency in runbook §12. Gemini Nano bridge optional. [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md). |
| **5. Stretch** | RPC worker, custom wake model, ElevenLabs, backup | ⬜ Todo | Optional; when ecosystem justifies. |

---

## 2. What’s done (Pixel-specific)

- **Stack:** start-jarvis-pixel.sh (adapter, gateway 18789, chat 18888, webhook). Clipboard stubs for Termux. TMPDIR so gateway can log.
- **Voice pipeline:** voice_node.py — ring buffer, manual trigger (Enter), VAD, Whisper.cpp, gateway stream, sentence-split TTS to FIFO. start-voice-node-pixel.sh (PulseAudio, FIFO reader, voice node).
- **Browser voice:** /voice with mic, "Speak replies," "Listen for Hey JARVIS" (Web Speech API). POST /speak for Echeo/alerts.
- **Docs:** PIXEL_VOICE_RUNBOOK, PIXEL_GOD_MODE, PIXEL_8_PRO_BADASS, PIXEL_VOICE_DEMO, WAKEWORD_TRAINING (custom model), EDGE_NATIVE_VOICE_NODE.
- **Hardening:** ADB phantom process limit, optional wakelock, swap file, Vulkan env (doc). Fake standby / Termux:Float for mic (doc).
- **Polish:** JARVIS naming, punchy system prompt in example config, strip "Hey JARVIS" from transcript, --voice flag, "JARVIS is live" / voice-node hint messages.

---

## 3. Perfection phase (current focus)

Items that get JARVIS on Pixel from "works great" to "perfect."

| # | Item | Status | Blocker / notes |
|---|------|--------|------------------|
| 1 | **True wake word on device** | ⬜ Todo | No onnxruntime wheel for Termux/ARM. When available (or custom build): unset VOICE_NODE_MANUAL_TRIGGER; voice_node already has ring buffer + pre-roll. Custom "Hey JARVIS" model: [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md). |
| 2 | **Vulkan (Mali-G715) for Whisper/LLM** | 📋 Doc only | Export VK_ICD_FILENAMES; build Whisper/llama with Vulkan. [PIXEL_VOICE_RUNBOOK §10](./PIXEL_VOICE_RUNBOOK.md), [EDGE_NATIVE_VOICE_NODE §2](./EDGE_NATIVE_VOICE_NODE.md). |
| 3 | **Latency tuning** | 🟡 Partial | ~700 ms target in docs. VAD 0.6 s (optional), streaming TTS, warm FIFO. Measure end-to-end; tune VAD/Whisper model (tiny vs base). |
| 4 | **Always-on mic (Android 14)** | 📋 Doc only | Termux:Float or fake standby. No code change; user choice. [Runbook §11](./PIXEL_VOICE_RUNBOOK.md#11-microphone-in-background-android-14). |
| 5 | **Swap + wakelock by default** | 🟡 Optional | Runbook has commands; could add to start-jarvis-pixel.sh or a one-time setup script (swapon, deviceidle whitelist). |
| 6 | **Full ADB PPK bypass (3 commands)** | ✅ In runbook | [PIXEL_VOICE_RUNBOOK §1](./PIXEL_VOICE_RUNBOOK.md#1-adb-phantom-process-limit): set_sync_disabled_for_tests, max_phantom_processes, settings_enable_monitor_phantom_procs. [SOVEREIGN_MOBILE_NEXUS §2.2](./SOVEREIGN_MOBILE_NEXUS.md#22-phantom-process-killer-ppk--full-bypass). |

---

## 4. Sovereign Nexus (backlog — omniscience + omnipotence)

From [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md): sensors, UI control, vision, network identity.

| # | Item | Notes |
|---|------|--------|
| 1 | **ADB skill (UI control)** | ✅ [skills/pixel-adb](../skills/pixel-adb): tap, swipe, text, screencap, ui_dump, launch_app. Wireless debugging + adb connect 127.0.0.1:5555. |
| 2 | **Camera / vision skill** | ✅ [skills/pixel-camera](../skills/pixel-camera): termux-camera-photo; path for vision model ("what am I holding?"). |
| 3 | **termux-api skill (sensors)** | ✅ [skills/pixel-sensors](../skills/pixel-sensors): battery, WiFi, location (`get_pixel_device_status`, `get_pixel_wifi`, `get_pixel_location`). |
| 4 | **Tailscale** | 📋 Doc: [PIXEL_VOICE_RUNBOOK §12](./PIXEL_VOICE_RUNBOOK.md#12-optional-tailscale-proot-and-latency). Stable IP; bind 0.0.0.0. |
| 5 | **Proot-Distro path** | 📋 Doc: runbook §12 + [SOVEREIGN_MOBILE_NEXUS §2.1](./SOVEREIGN_MOBILE_NEXUS.md#21-termux-vs-proot-distro). Optional Ubuntu in Termux. |
| 6 | **Gemini Nano bridge** | Optional: local model on Tensor G3; route simple/PII tasks locally. |
| 7 | **SOUL.md / persona** | ✅ [docs/SOUL_TEMPLATE.md](./SOUL_TEMPLATE.md), [docs/SOUL_AND_PERSONA.md](./SOUL_AND_PERSONA.md). voice_node: `system_prompt_file: "~/.jarvis/SOUL.md"`. |

## 5. Stretch (backlog)

| # | Item | When |
|---|------|------|
| 1 | **llama.cpp RPC on Pixel** | Use Pixel as distributed inference worker; desktop offloads layers. [EDGE_NATIVE_VOICE_NODE §6](./EDGE_NATIVE_VOICE_NODE.md). |
| 2 | **Custom wake word .onnx on device** | After onnxruntime is available on Termux; train "Hey JARVIS" via Colab, set wakeword_models. |
| 3 | **Proactive / alerts to Pixel** | POST /speak exists; extend (scheduled brief, Echeo escalation) per OPERATION_NEXT. |
| 4 | **Barge-in during TTS** | Voice node has stop_tts_event and __STOP__; wire VAD during playback to interrupt. |
| 5 | **ElevenLabs TTS** | Optional high-fidelity / cloned voice; skill or pipeline option. |
| 6 | **Backup (memory + config)** | Cron + rclone (or similar) to back up vector store and SOUL/config. |

---

## 6. Success criteria (Pixel Perfection)

| Criterion | Definition of done |
|-----------|--------------------|
| **Voice-first** | User can talk to JARVIS from the Pixel without opening a laptop: browser /voice or terminal voice node. ✅ Today (manual trigger or tap). |
| **Low latency** | First spoken reply within ~1 s of user stopping speech (VAD → Whisper → first token → TTS). 🟡 Tuned via config; measure and document. |
| **Stable** | Stack and voice node survive normal use; ADB + swap + optional wakelock reduce kills. ✅ Documented; user applies once. |
| **Wake word (optional)** | "Hey JARVIS" triggers without pressing Enter when onnxruntime exists on device. ⬜ Blocked on Termux/onnxruntime. |
| **Single source of truth** | All Pixel setup and next steps live in runbook + GOD MODE + this roadmap. ✅ |

---

## 7. References

| Topic | Doc |
|-------|-----|
| One-page max setup | [PIXEL_8_PRO_BADASS.md](./PIXEL_8_PRO_BADASS.md) |
| Technical execution (ADB, Vulkan, voice pipeline) | [PIXEL_GOD_MODE.md](./PIXEL_GOD_MODE.md) |
| Step-by-step voice setup | [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) |
| How to demo (browser, terminal, full node) | [PIXEL_VOICE_DEMO.md](./PIXEL_VOICE_DEMO.md) |
| Custom wake word (Colab, .onnx) | [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md) |
| Edge-native architecture | [EDGE_NATIVE_VOICE_NODE.md](./EDGE_NATIVE_VOICE_NODE.md) |
| Master roadmap (all tracks) | [JARVIS_MASTER_ROADMAP.md](./JARVIS_MASTER_ROADMAP.md) |
| Sovereign Mobile Nexus (architecture) | [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md) |
| Test checklist (verify setup) | [PIXEL_TEST_CHECKLIST.md](./PIXEL_TEST_CHECKLIST.md) |

**How to use:** Check §1 for phase, §2 for what’s done, §3 for next steps. When a perfection or stretch item ships, update this doc and (if needed) the master roadmap.
