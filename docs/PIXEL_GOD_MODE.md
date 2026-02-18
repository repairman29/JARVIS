# Pixel 8 Pro "GOD MODE" — Persistent Server + Cursor Integration

Turn the Pixel into an **edge-native node** in your AI cluster: persistent Clawdbot, voice DevOps agent, and (optionally) a distributed-inference worker for Cursor/BEAST/Echeo.

Each item below is mapped to **what exists in JARVIS** or **next steps**.

---

## 1. Persistent server mode

| Goal | Status | Where / how |
|------|--------|-------------|
| **Disable Phantom Process Killer** | ✅ In runbook | `adb shell device_config put activity_manager max_phantom_processes 2147483647` — [PIXEL_VOICE_RUNBOOK.md §1](./PIXEL_VOICE_RUNBOOK.md#1-adb-phantom-process-limit). Reboot after. |
| **Prevent OOM kills (swap)** | ✅ In runbook | 4GB swap file in Termux — [PIXEL_VOICE_RUNBOOK.md §9](./PIXEL_VOICE_RUNBOOK.md#9-optional-swap-file). `dd` + `mkswap` + `swapon ~/swapfile`. |
| **OLED "Fake Standby"** | 📋 Doc only | Black-overlay app (e.g. Extinguish) keeps screen "on" for the OS (mic/CPU stay active) while pixels are off. [EDGE_NATIVE_VOICE_NODE.md §2](./EDGE_NATIVE_VOICE_NODE.md#2-hardware-and-environment-tied-to-this-repo), [runbook §11](./PIXEL_VOICE_RUNBOOK.md#11-microphone-in-background-android-14). |

---

## 2. Hardware-accelerated Cursor integration

| Goal | Status | Where / how |
|------|--------|-------------|
| **Distributed inference (RPC)** | 📋 Roadmap | llama.cpp RPC: run `rpc-server` on Pixel, point desktop llama/llama-cli at it to offload layers. Lets you run larger models (e.g. 70B) with Pixel as worker. [EDGE_NATIVE_VOICE_NODE.md §6](./EDGE_NATIVE_VOICE_NODE.md#6-cluster--rpc-optional). Not wired into JARVIS yet. |
| **Vulkan (Mali-G715)** | 📋 Doc only | For faster token gen / Whisper: build llama.cpp (or InferrLM/whisper) with Vulkan; add ICD profile so loader finds Mali driver. [EDGE_NATIVE_VOICE_NODE.md §2](./EDGE_NATIVE_VOICE_NODE.md#2-hardware-and-environment-tied-to-this-repo). Sub-700ms voice latency target. |

---

## 3. Voice-enabled "DevOps" agent

| Goal | Status | Where / how |
|------|--------|-------------|
| **Full-duplex voice loop** | ✅ Implemented | [scripts/voice_node.py](../scripts/voice_node.py): PulseAudio → ring buffer → trigger → VAD → Whisper → gateway → TTS. [PIXEL_VOICE_DEMO.md](./PIXEL_VOICE_DEMO.md), [runbook](./PIXEL_VOICE_RUNBOOK.md). |
| **Barge-in** | ✅ Designed | Voice node uses `stop_tts_event`; TTS FIFO can send `__STOP__` to interrupt. Front-end (browser or script) can hook VAD during playback to trigger stop. [voice_node_config.example.yaml](../scripts/voice_node_config.example.yaml) `tts_barge_in_signal`. |
| **Gatekeeper (OpenWakeWord)** | ⚠️ Partial | OpenWakeWord in voice_node; on Termux **onnxruntime** has no wheel, so we use **manual trigger** (press Enter to record). Browser voice at [18888/voice](http://127.0.0.1:18888/voice) uses tap-to-talk. |
| **VAD (Silero)** | ✅ Optional | Simple energy VAD in voice_node; optional Silero for better end-of-utterance. Config: runbook §6. |
| **FIFO TTS (no startup lag)** | ✅ In runbook | `mkfifo ~/.tts_pipe` + reader loop so `termux-tts-speak` stays warm. [PIXEL_VOICE_RUNBOOK.md §4](./PIXEL_VOICE_RUNBOOK.md#4-fifo-tts-low-latency-system-tts). |

---

## 4. Integration with your projects (Cursor, BEAST, Echeo)

| Feature | Idea | Implementation path |
|---------|------|---------------------|
| **Silent refactoring** | Pixel runs "Oracle" doc scripts in background while you code in Cursor. | Run Oracle (or similar) as a cron job or long-lived process on Pixel; have it report via ntfy or webhook to Cursor/IDE. |
| **Architecture enforcement** | "Grid Architect" bot on Pixel scans commits for pattern violations. | Host a small service on Pixel that receives push/webhook from repo; runs checks and posts to gateway or ntfy. |
| **Echeo escalation → Pixel** | Pixel is primary receiver for Echeo escalations; verbal alert for high-priority dev tasks. | **HTTP:** `POST http://<pixel-ip>:18888/speak` with body `High priority: <message>` (or JSON `{"text":"..."}`). Pixel speaks via TTS FIFO. No SSH required. |
| **BEAST MODE / Alfred / CTO** | Give bots a "physical" presence via Pixel voice. | Same stack: gateway (18789) + chat server (18888) + voice node. Point BEAST/Alfred/CTO at `http://<pixel-ip>:18789` (or via SSH tunnel) so Cursor/cluster can send tasks; Pixel speaks results via FIFO TTS. |

**Echeo → Pixel verbal alert (HTTP):** From Echeo or any service, POST to the Pixel chat server:

```bash
curl -X POST http://<pixel-ip>:18888/speak -d "High priority: PR build failed on main"
# or JSON:
curl -X POST http://<pixel-ip>:18888/speak -H "Content-Type: application/json" -d '{"text":"Echeo escalation: review required for repo X"}'
```

**Requirements:** Chat server running on Pixel (port 18888), TTS FIFO created and reader loop running (runbook §4). The server writes the request body to the FIFO; `termux-tts-speak` speaks it. From the same LAN, use the Pixel’s IP; from elsewhere use SSH tunnel or ngrok.

**Alternative (SSH):** `ssh -p 8022 u0_a310@<pixel-ip> 'echo "High priority: <message>" | python3 ~/JARVIS/scripts/voice-node-demo.py'` — see [PIXEL_VOICE_DEMO.md § Option B](./PIXEL_VOICE_DEMO.md#option-b-demo-gateway--tts-no-mic-no-whisper).

---

## 5. Technical execution summary (one place)

Use this as the single reference; no need to keep separate notes.

### 5.1 Bypass the Android "jail"

| Action | Command / approach |
|--------|--------------------|
| **Disable Phantom Process Killer** | Runbook §1: minimum `max_phantom_processes 2147483647`; **full bypass (Sovereign Nexus):** add `set_sync_disabled_for_tests persistent` and `settings put global settings_enable_monitor_phantom_procs false`. Then reboot. [SOVEREIGN_MOBILE_NEXUS §2.2](./SOVEREIGN_MOBILE_NEXUS.md#22-phantom-process-killer-ppk--full-bypass). |
| **Always-on microphone** | Android blocks mic when backgrounded/screen off. Use **Fake Standby** (black overlay app, OLED off but "Screen On") or run the voice loop in **Termux:Float** so it stays in the foreground scheduler group. [Runbook §11](./PIXEL_VOICE_RUNBOOK.md#11-microphone-in-background-android-14). |

### 5.2 Tensor G3: GPU and CPU

| Action | Command / approach |
|--------|--------------------|
| **Vulkan (Mali-G715)** | Create an **ICD** JSON profile pointing the Vulkan loader to `/vendor/lib64/hw/vulkan.mali.so` so llama.cpp/Whisper can use the GPU. [EDGE_NATIVE_VOICE_NODE §2](./EDGE_NATIVE_VOICE_NODE.md#2-hardware-and-environment-tied-to-this-repo). |
| **CPU core pinning** | Use `taskset` to bind **InferrLM** (or llama-server if you run it in Termux) to Prime + Performance cores (e.g. `taskset -c 4,5,6,7,8 ./llama-server ...`). Keeps token gen off efficiency cores. [Runbook §10](./PIXEL_VOICE_RUNBOOK.md#10-optional-pin-inferrlm-to-big-cores). *Note:* InferrLM as an Android app is scheduled by the OS; taskset applies to processes you start in Termux. |
| **Memory (swap)** | 4GB file-based swap in Termux to avoid LMK killing the node: `dd` + `mkswap` + `swapon ~/swapfile`. [Runbook §9](./PIXEL_VOICE_RUNBOOK.md#9-optional-swap-file). |

### 5.3 Low-latency voice pipeline (~700 ms target)

| Component | Tool | Where in JARVIS |
|-----------|------|-----------------|
| **Audio bridge** | PulseAudio + `module-sles-source` | Runbook §3; [start-voice-node-pixel.sh](../scripts/start-voice-node-pixel.sh) starts PulseAudio. |
| **Gatekeeper** | OpenWakeWord (or browser "Hey JARVIS") | [voice_node.py](../scripts/voice_node.py) when onnxruntime available; on Termux use manual trigger or browser **Listen for "Hey JARVIS"** on [/voice](http://127.0.0.1:18888/voice). Custom phrase (e.g. "Hey Clawd"): [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md); use `wakeword_threshold: 0.8` for always-on. |
| **End-of-turn** | Silero VAD (or simple energy VAD) | voice_node: config `vad_silence_seconds` (e.g. 0.7); optional Silero. |
| **STT** | Whisper.cpp | [install-whisper-termux.sh](../scripts/install-whisper-termux.sh); config `whisper_cmd` in ~/.jarvis/voice_node.yaml. |
| **Brain** | Clawdbot / InferrLM | Gateway 18789 → adapter 8888 → InferrLM 8889. voice_node uses gateway (not raw 8889) for agent + tools. |
| **Mouth** | FIFO TTS | `mkfifo ~/.tts_pipe`; reader loop: `while read line; do termux-tts-speak "$line"; done < ~/.tts_pipe`. [Runbook §4](./PIXEL_VOICE_RUNBOOK.md#4-fifo-tts-low-latency-system-tts). |
| **Streaming** | First sentence → TTS while rest generates | voice_node: `stream=True` to gateway, sentence-split, write each to FIFO. |

### 5.4 Cluster and agent tooling

| Action | Command / approach |
|--------|--------------------|
| **llama.cpp RPC node** | On Pixel: `bin/rpc-server -p 50052 --host 0.0.0.0`. Desktop/Cursor can offload layers to Pixel. [EDGE_NATIVE_VOICE_NODE §6](./EDGE_NATIVE_VOICE_NODE.md#6-cluster--rpc-optional). |
| **Clawdbot tools (/bin/bash)** | Install **termux-exec** in Termux so scripts that call `/bin/bash` are redirected to Termux’s prefix; avoids tool failures when the agent runs shell commands. |

**Controller script:** The full pipeline is implemented in [scripts/voice_node.py](../scripts/voice_node.py) (config: `~/.jarvis/voice_node.yaml`). Start with [scripts/start-voice-node-pixel.sh](../scripts/start-voice-node-pixel.sh). No separate “notes” script needed—the repo is the source of truth.

---

## 6. Checklist summary

- [ ] **ADB:** `adb shell device_config put activity_manager max_phantom_processes 2147483647` then reboot.
- [ ] **Swap:** Create and `swapon ~/swapfile` (runbook §9).
- [ ] **Fake standby:** Install black-overlay app if you want always-on mic without burn-in.
- [ ] **Stack:** `bash ~/start-jarvis.sh` on Pixel; confirm gateway 18789 + chat 18888.
- [ ] **Voice (browser):** Open http://127.0.0.1:18888/voice on the device.
- [ ] **Voice (terminal):** Run runbook (§2–5, §6 Whisper, §8); then `bash ~/JARVIS/scripts/start-voice-node-pixel.sh` (manual trigger on Termux).
- [ ] **RPC (optional):** Build and run llama.cpp `rpc-server` on Pixel; point Cursor/desktop at it for distributed inference.
- [ ] **Vulkan (optional):** Build Whisper/llama with Vulkan + Mali ICD for GPU acceleration.
- [ ] **Echeo → Pixel:** `POST http://<pixel-ip>:18888/speak` with message body (or use `voice-node-demo.py` over SSH).

---

**See also:** [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md) (architecture reference), [PIXEL_8_PRO_BADASS.md](./PIXEL_8_PRO_BADASS.md) (one-page max JARVIS on Pixel), [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md), [PIXEL_VOICE_DEMO.md](./PIXEL_VOICE_DEMO.md), [EDGE_NATIVE_VOICE_NODE.md](./EDGE_NATIVE_VOICE_NODE.md), [JARVIS_ON_ANDROID_COMMUNICATE.md](./JARVIS_ON_ANDROID_COMMUNICATE.md), [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md) (custom "Hey Clawd" / wake word).

---

**Do you need separate notes?** No. This doc (§5) is the technical execution summary. Keep the repo as the single source of truth; you can archive or delete duplicate notes.

---

## Implementation status: "Is this all done?"

| Item | Status | Where |
|------|--------|-------|
| **ADB: Phantom Process Killer** | ✅ Documented; you run it once | Runbook §1. Command in doc. |
| **ADB: deviceidle whitelist (wakelock)** | ✅ Documented | Runbook §1 (optional). `adb shell dumpsys deviceidle whitelist +com.termux`. |
| **PulseAudio + module-sles-source** | ✅ In runbook + start script | Runbook §3; [start-voice-node-pixel.sh](../scripts/start-voice-node-pixel.sh). |
| **FIFO TTS (~/.tts_pipe + reader loop)** | ✅ In runbook + start script | Runbook §4; start-voice-node-pixel.sh starts the reader. |
| **Voice controller (voice_node.py)** | ✅ Implemented | [voice_node.py](../scripts/voice_node.py): mic → ring buffer → trigger (OpenWakeWord or manual) → VAD → Whisper → **gateway 18789** (Clawdbot) → stream → sentence segmenter → FIFO TTS. Config: ~/.jarvis/voice_node.yaml. |
| **Clawdbot (not raw InferrLM 8889)** | ✅ Correct | We use gateway **18789** so the agent has tools; adapter 8888 → InferrLM 8889. |
| **Streaming + optimistic TTS** | ✅ In voice_node | `stream=True`, sentence split on `.?!`, write each to FIFO. |
| **Whisper.cpp on Pixel** | ✅ Install script | [install-whisper-termux.sh](../scripts/install-whisper-termux.sh); runbook §6. |
| **Custom wake word ("Hey Clawd")** | ✅ Doc + config | [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md); [wakeword_training_config_hey_clawd.yaml](../scripts/wakeword_training_config_hey_clawd.yaml) for Colab. |
| **RPC server (distributed cluster)** | 📋 Documented only | Runbook/EDGE_NATIVE; you run `rpc-server` if you build llama.cpp with RPC. Not required for voice. |
| **Vulkan / Mali build flags** | 📋 Doc only | EDGE_NATIVE_VOICE_NODE §2; optional for faster Whisper/LLM. |

**Summary:** Prerequisites (ADB, PulseAudio, FIFO) and the full-duplex voice controller are **done** in the repo. You run the runbook commands on the device and start the stack + voice node. RPC and Vulkan are optional next steps.
