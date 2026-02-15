# Pixel 8 Pro: Max JARVIS

One-page setup to make **JARVIS** as capable as possible on the Pixel 8 Pro: stable, fast, and voice-ready.

---

## 1. One-time hardening (do once)

Run these from a computer with ADB (or wireless debugging). Reboot the Pixel after the first.

| Step | Command |
|------|--------|
| **Phantom process limit** | From PC: `bash ~/JARVIS/scripts/adb-pixel-ppk-bypass.sh` (full 3-command bypass), then reboot. Or run the three commands in [runbook §1](./PIXEL_VOICE_RUNBOOK.md#1-adb-phantom-process-limit). |
| **Wakelock (optional)** | `adb shell dumpsys deviceidle whitelist +com.termux` |
| **Swap + ADB reminder** | On Pixel: `bash ~/JARVIS/scripts/pixel-setup-hardening.sh` (creates swap, prints ADB commands). |
| **Reboot** | Reboot the device. |

In **Termux** on the Pixel:

| Step | Command |
|------|--------|
| **Packages** | `pkg update && pkg upgrade -y && pkg install python pulseaudio sox alsa-utils termux-api termux-exec -y` |
| **Swap (4GB)** | `dd if=/dev/zero of=~/swapfile bs=1024 count=4194304 && chmod 600 ~/swapfile && mkswap ~/swapfile && swapon ~/swapfile` |
| **TTS FIFO** | `mkfifo ~/.tts_pipe` |
| **Voice node deps** | `pip install -r ~/JARVIS/scripts/voice_node_requirements.txt` (or `pip install sounddevice numpy requests PyYAML`) |
| **Whisper (STT)** | `bash ~/JARVIS/scripts/install-whisper-termux.sh --write-config` |
| **Config** | `mkdir -p ~/.jarvis && cp ~/JARVIS/scripts/voice_node_config.example.yaml ~/.jarvis/voice_node.yaml` — edit `whisper_cmd` if needed (install script usually fills it). |

---

## 2. Daily startup (one command)

In Termux:

```bash
bash ~/JARVIS/scripts/start-jarvis-pixel.sh
```

Optional: start the **voice node** in the same run (second terminal or background):

```bash
bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice
```

That starts the stack and then the voice node in the background. Or start the voice node in a **second Termux tab**:

```bash
bash ~/JARVIS/scripts/start-voice-node-pixel.sh
```

**Ensure InferrLM app is running with Server ON (port 8889)** before or right after starting.

---

## 3. How to talk to JARVIS

- **Browser (easiest):** Open Chrome → `http://127.0.0.1:18888/voice` → allow mic → check **Speak replies** and optionally **Listen for "Hey JARVIS"**. Tap mic or say "Hey JARVIS" and speak.
- **Terminal (no Chrome):** Run `start-voice-node-pixel.sh`, then **press Enter** when you want to speak. Say "Hey JARVIS, …" or just your question. Reply is spoken via TTS.

---

## 4. Make it punchier: system prompt

In `~/.jarvis/voice_node.yaml` the example config already uses a sharp JARVIS persona (still short for TTS):

```yaml
system_prompt: "You are JARVIS, a sharp voice assistant on this device. Be concise and direct. Reply in short, spoken sentences. No lists or markdown. You can run code, search, and use tools—say what you did briefly."
wake_phrase: "Hey JARVIS"
```

"Hey JARVIS" is stripped from the transcript by default (`strip_wake_phrase_from_transcript: true`) so "Hey JARVIS, what's the weather?" works.

---

## 5. Optional: faster and tougher

| Tweak | Where | What |
|-------|--------|------|
| **Snappier end-of-turn** | `~/.jarvis/voice_node.yaml` | `vad_silence_seconds: 0.6` (default 0.7) so it stops recording a bit sooner. |
| **Vulkan (GPU)** | Termux, before Whisper/llama | `export VK_ICD_FILENAMES=/vendor/etc/vulkan/icd.d/mali.json` — see [PIXEL_VOICE_RUNBOOK.md §10](./PIXEL_VOICE_RUNBOOK.md#10-optional-pin-inferrlm-to-big-cores). |
| **Fake standby** | Install app | Black overlay (e.g. Extinguish) so the mic stays on when the screen is "off" for always-on voice. [Runbook §11](./PIXEL_VOICE_RUNBOOK.md#11-microphone-in-background-android-14). |
| **Custom wake word** | Colab + config | Train a custom phrase (e.g. "Hey JARVIS") and drop the `.onnx` on the device for when onnxruntime is available. [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md). |

---

## 6. Quick checklist

- [ ] ADB phantom limit + reboot
- [ ] Termux: `pkg install …`, swap, FIFO, pip deps, Whisper (`install-whisper-termux.sh --write-config`)
- [ ] `~/.jarvis/voice_node.yaml` from example; set `whisper_cmd` and optional `system_prompt` / `wake_phrase`
- [ ] InferrLM app: Server ON
- [ ] `bash ~/JARVIS/scripts/start-jarvis-pixel.sh` (optionally `--voice`)
- [ ] Browser: http://127.0.0.1:18888/voice or terminal: `start-voice-node-pixel.sh` → Enter → speak

**That’s it.** JARVIS is as badass as the Pixel 8 Pro stack gets today.

See also: [PIXEL_GOD_MODE.md](./PIXEL_GOD_MODE.md), [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md), [PIXEL_VOICE_DEMO.md](./PIXEL_VOICE_DEMO.md).
