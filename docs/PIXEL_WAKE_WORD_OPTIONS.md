# True Wake Word ("Hey JARVIS") on the Pixel — Options

The voice node (`scripts/voice_node.py`) supports **OpenWakeWord** for on-device wake word detection. On Termux this has been blocked by the lack of an onnxruntime wheel. This doc lists ways to get real "Hey JARVIS" (or custom phrase) on-device.

---

## Current behavior

| Environment | Wake word | Fallback |
|-------------|-----------|----------|
| **Mac / Linux (desktop)** | OpenWakeWord when `pip install onnxruntime openwakeword` works | — |
| **Termux (Pixel)** | Often unavailable (onnxruntime) | **Manual trigger** (press Enter to record); or **browser** "Listen for Hey JARVIS" at `http://127.0.0.1:18888/voice` |

The voice node already has ring buffer, pre-roll, VAD, and gateway/TTS; it only needs a working wake-word engine on the device.

---

## Option A: Termux package `python-onnxruntime` (try first)

Termux added a **python-onnxruntime** package in 2024 ([termux-packages #21342](https://github.com/termux/termux-packages/issues/21342)).

**On the Pixel (Termux):**

```bash
pkg update && pkg install python-onnxruntime
pip install openwakeword  # if not already installed
```

If both succeed, run the voice node **without** manual trigger:

```bash
unset VOICE_NODE_MANUAL_TRIGGER
python3 ~/JARVIS/scripts/voice_node.py
```

If you see `Voice node: listening for 'Hey JARVIS'`, wake word is active. If `pkg install python-onnxruntime` fails (e.g. pip dependency errors as reported by some users in 2025), use Option B or C.

**Optional:** Use the setup script that checks for onnxruntime and configures the node:

```bash
bash ~/JARVIS/scripts/pixel-wake-word-setup.sh
```

---

## Option B: Picovoice Porcupine (alternative engine)

[Porcupine](https://picovoice.ai/docs/porcupine/) runs on ARM Linux offline and supports custom wake words via the Picovoice Console. It does **not** require onnxruntime.

**Limitation:** The current voice node only integrates **OpenWakeWord**. Adding Porcupine would require a second code path in `voice_node.py` (e.g. `wakeword_engine: "porcupine"` and a Porcupine-based `check_wake()`). That’s a small, self-contained change.

**Steps if we add Porcupine support:**

1. On Termux: `pip install pvporcupine` (and get a free Picovoice AccessKey).
2. In [Picovoice Console](https://console.picovoice.ai/), create a custom keyword **"Hey JARVIS"** (or "Jarvis"), download the `.ppn` file.
3. In `~/.jarvis/voice_node.yaml` set e.g. `wakeword_engine: porcupine`, `porcupine_keyword_path: /path/to/hey_jarvis.ppn`, `porcupine_access_key: YOUR_KEY`.
4. In `voice_node.py`: if `wakeword_engine == "porcupine"`, use `pvporcupine.Porcupine` and feed the same 16 kHz mono chunks; on detection, same flow as OpenWakeWord (pre-roll → VAD → Whisper → gateway → TTS).

**Status:** Implemented in `voice_node.py`. Use Option B when onnxruntime is not available on Termux.

---

## Option C: Browser "Listen for Hey JARVIS" (no install)

On the Pixel, open Chrome and go to **http://127.0.0.1:18888/voice**. Enable **"Listen for 'Hey JARVIS'"** (or equivalent). The browser uses continuous speech recognition and triggers on the phrase; no onnxruntime or Porcupine needed. Good for testing and for users who prefer not to run the terminal voice node.

---

## Custom phrase ("Hey Clawd" / etc.)

- **OpenWakeWord:** Train a custom model in Colab and copy the `.onnx` to the device. See [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md) and `scripts/wakeword_training_config_hey_clawd.yaml`. Set `wakeword_models: ["/path/to/hey_clawd.onnx"]` in `~/.jarvis/voice_node.yaml`.
- **Porcupine:** Create a custom keyword in Picovoice Console and use the `.ppn` path in config (once Porcupine support is added to the voice node).

---

## Summary

| Option | Effort | Notes |
|--------|--------|--------|
| **A. Termux python-onnxruntime** | Try `pkg install` | If it works, voice node uses OpenWakeWord with no code changes. |
| **B. Porcupine** | Add engine in voice_node + config | No onnxruntime; works on Termux/ARM; needs Picovoice key and .ppn. |
| **C. Browser listen** | None | Use /voice with "Listen for Hey JARVIS"; no server-side wake word. |

**See also:** [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md), [PIXEL_VOICE_DEMO.md](./PIXEL_VOICE_DEMO.md), [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md), [EDGE_NATIVE_VOICE_NODE.md](./EDGE_NATIVE_VOICE_NODE.md).
