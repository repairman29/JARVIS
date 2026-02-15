# Edge-Native Cognitive Node: Voice-Enabled AI on the Pixel 8 Pro

This document summarizes the architecture for turning a **Pixel 8 Pro** (Tensor G3) into a persistent, voice-enabled AI server node: **InferrLM** (local LLM) + **Clawdbot** (agent) + full-duplex voice (wake word → STT → agent → TTS). It ties each concept to the existing JARVIS scripts and docs.

**Reference:** The full technical report ("The Edge-Native Cognitive Node: Architectural Implementation of Voice-Enabled AI Agents on the Pixel 8 Pro") covers hardware topography, Android 14 constraints, audio pipeline, and performance tuning. This doc is the JARVIS-facing summary.

---

## 1. Executive summary

- **Goal:** Pixel 8 Pro as an always-on server node: Clawdbot + InferrLM, with **natural voice interaction** (wake word, STT, agent, streaming TTS) and optional participation in a distributed AI cluster.
- **Stack today:** InferrLM (app, port 8889) → adapter (8888) → gateway (18789) → chat server (18888). Voice UI: browser at `http://127.0.0.1:18888/voice` (tap mic, Web Speech API, optional "Speak replies").
- **Next step (always-on voice):** A Python **voice node** controller: PulseAudio → ring buffer → **OpenWakeWord** → **Silero VAD** → **Whisper.cpp** (STT) → gateway/Clawdbot → **streaming TTS** (Piper or system TTS via FIFO), with barge-in. See [§5](#5-how-this-maps-to-jarvis-scripts) and [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md).

---

## 2. Hardware and environment (tied to this repo)

| Topic | Summary | JARVIS / repo |
|-------|--------|----------------|
| **Tensor G3** | 1× Cortex-X3, 4× A715, 4× A510. For low latency, pin InferrLM to big cores (`taskset`). | Runbook: [PIXEL_VOICE_RUNBOOK.md § taskset](./PIXEL_VOICE_RUNBOOK.md#optional-pin-inferrlm-to-big-cores). |
| **Mali-G715 GPU** | Vulkan (not OpenCL) for acceleration. Termux needs an ICD profile pointing to the Mali driver. | Optional for Whisper/llama builds; not required for current browser voice. |
| **Memory** | 12 GB; LMK can kill background processes. | Runbook: [§ ADB phantom process](./PIXEL_VOICE_RUNBOOK.md#1-adb-phantom-process-limit) and [§ swap](./PIXEL_VOICE_RUNBOOK.md#optional-swap-file). |
| **Termux** | Linux env on Android; paths under `$PREFIX`, not FHS. | `start-jarvis-pixel.sh` uses `$HOME`, `$PREFIX`; gateway log under `~/tmp` (no `/tmp`). [JARVIS_AUTONOMOUS_ON_PIXEL.md](./JARVIS_AUTONOMOUS_ON_PIXEL.md). |
| **Android 14 mic** | Background apps cannot use the microphone. | For always-on voice: "Fake standby" (black overlay) or Termux:Float so the process stays foreground. [HARDWARE_ALWAYS_ON.md](./HARDWARE_ALWAYS_ON.md). |

---

## 3. Software stack (what we run)

| Component | Role | Where it runs | Script / doc |
|-----------|------|----------------|---------------|
| **InferrLM** | Local LLM server (OpenAI-compatible API). | Android app, port **8889**. | You start "Server ON" in the app. |
| **inferrlm_adapter** | Wraps InferrLM at 8889 → proxy at **8888**. | Termux (neural-farm). | `start-jarvis-pixel.sh` starts it. |
| **LiteLLM proxy** | Optional; routes to adapter or other backends. | Termux (if installed). | `start-jarvis-pixel.sh`; if missing, gateway uses adapter at 8888. |
| **Clawdbot gateway** | Agent (tools, chat). Listens 18789, `--bind lan`. | Termux (JARVIS). | `start-gateway-background.js`; config in `~/.clawdbot/`. |
| **Chat server** | Serves chat UI and `/voice`; proxies `/v1/chat/completions` to gateway. | Termux, port **18888**. | `pixel-chat-server.js`. [JARVIS_ON_ANDROID_COMMUNICATE.md](./JARVIS_ON_ANDROID_COMMUNICATE.md). |
| **Voice node (new)** | Always-on: wake word → VAD → STT → agent → TTS. | Termux (optional). | `scripts/voice_node.py`; runbook for PulseAudio, FIFO TTS, etc. |

---

## 4. Voice pipeline (report architecture)

1. **Input:** PulseAudio (with OpenSL ES source) → **ring buffer** (e.g. last 2 s).
2. **Trigger:** **OpenWakeWord** on the ring buffer; on detection, switch to **Silero VAD** for end-of-utterance.
3. **STT:** Audio clip → **Whisper.cpp** (tiny/base.en) → text.
4. **Agent:** Text → **gateway** `POST /v1/chat/completions` (streaming); same contract as chat server.
5. **TTS:** Streamed tokens → sentence segmenter → **TTS queue** → Piper or **termux-tts-speak** (via FIFO for low latency).
6. **Barge-in:** If VAD detects speech during TTS, stop playback and process new input.

**Latency budget (report):** ~700 ms (VAD 300 ms + Whisper ~150 ms + first token ~150 ms + TTS ~100 ms) is achievable with the runbook optimizations.

---

## 5. How this maps to JARVIS scripts

| Need | Script / file | Notes |
|------|----------------|------|
| Start full stack on Pixel | `scripts/start-jarvis-pixel.sh` | Adapter, proxy (if litellm), gateway, webhook, chat server. |
| Chat + voice in browser | `scripts/pixel-chat-server.js` | `/` = chat; `/voice` = chat + mic + "Speak replies". Proxies to gateway 18789. |
| Gateway (no /tmp on Termux) | `scripts/start-gateway-background.js` | Sets `logging.file` under `~/tmp` so clawdbot doesn’t use `/tmp`. |
| Start from Mac | `scripts/ssh-pixel-start-jarvis.sh` | SSH to Pixel and run start script. |
| Autonomous (cron, boot) | `docs/JARVIS_AUTONOMOUS_ON_PIXEL.md` | Termux:Boot, wake lock, cron plan-execute/heartbeat. |
| One-tap chat/voice | `scripts/setup-unlock-pixel.sh` | Shortcuts in `~/.shortcuts/` (e.g. open-jarvis-voice). |
| Always-on voice node | `scripts/voice_node.py` | Wake word, VAD, Whisper, gateway, TTS. Config: `~/.jarvis/voice_node.yaml` or env. |
| Pixel voice setup | `docs/PIXEL_VOICE_RUNBOOK.md` | ADB phantom-process fix, PulseAudio, FIFO TTS, swap, taskset. |

---

## 6. Cluster / RPC (optional)

The report describes using **llama.cpp RPC** so the Pixel can act as a worker in a distributed model (e.g. desktop runs 70B, Pixel holds a slice). That’s orthogonal to the current JARVIS stack (InferrLM app + gateway). If you introduce an RPC-capable server on the Pixel, it would be a separate process; the voice node would still talk to the **gateway** (18789) for agent behavior.

---

## 7. See also

- [PIXEL_GOD_MODE.md](./PIXEL_GOD_MODE.md) — **GOD MODE checklist**: persistent server, RPC/Vulkan, voice DevOps, Cursor/BEAST/Echeo integration.
- [PIXEL_VOICE_DEMO.md](./PIXEL_VOICE_DEMO.md) — **How to demo and use** (browser, gateway+TTS demo, full voice node).
- [JARVIS_ON_ANDROID_COMMUNICATE.md](./JARVIS_ON_ANDROID_COMMUNICATE.md) — Chat and voice from the browser.
- [JARVIS_AUTONOMOUS_ON_PIXEL.md](./JARVIS_AUTONOMOUS_ON_PIXEL.md) — Wake lock, Termux:Boot, cron.
- [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) — Commands for ADB, PulseAudio, FIFO TTS, swap, taskset.
- [JARVIS_WAKE_WORD_ROADMAP.md](./JARVIS_WAKE_WORD_ROADMAP.md) — Mac wake word (Swift); Android voice node is the Pixel counterpart.
