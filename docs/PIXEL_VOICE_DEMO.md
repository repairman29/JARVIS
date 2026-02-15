# How to Demo and Use JARVIS on the Pixel

Three ways to use JARVIS from the Pixel, from **easiest** (browser) to **full always-on voice** (wake word + STT + TTS).

---

## Option A: Browser chat and voice (no setup beyond the stack)

**What you get:** Type or tap mic in Chrome; JARVIS replies in text and (optionally) speaks.

### 1. Start the stack on the Pixel

In **Termux**:

```bash
bash ~/start-jarvis.sh
```

Wait until you see something like:

- `Gateway (18789): 200`
- `Chat UI (18888): 200`

(If `~/start-jarvis.sh` doesn’t exist, run `bash ~/JARVIS/scripts/install-pixel-launchers.sh` once, or run `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`.)

### 2. Open the chat or voice page

On the **Pixel**, open **Chrome** and go to:

- **Chat (type only):** `http://127.0.0.1:18888`
- **Voice (tap mic + speak replies):** `http://127.0.0.1:18888/voice`

Allow microphone when Chrome asks (for `/voice`). Tap the mic, speak, then tap again or wait for the result. Check **“Speak replies”** to hear JARVIS’s answer.

**One-tap later:** Run `bash ~/JARVIS/scripts/setup-unlock-pixel.sh` and add **open-jarvis-voice** (or **open-jarvis-chat**) from `~/.shortcuts/` to Termux:Widget.

---

## Option B: Demo gateway + TTS (no mic, no Whisper)

**What you get:** Send one message from the terminal; JARVIS’s reply is printed and spoken via the TTS FIFO. Proves gateway and TTS without the full voice node.

### 1. Stack + TTS FIFO + reader

- Start the stack: `bash ~/start-jarvis.sh`
- Create the FIFO and start the TTS reader (in a **second** Termux session or background):

```bash
mkfifo ~/.tts_pipe
while true; do while IFS= read -r line; do [ -n "$line" ] && termux-tts-speak "$line"; done < ~/.tts_pipe; done
```

Leave that loop running.

### 2. Run the demo script

In **another** Termux session:

```bash
cd ~/JARVIS
python3 scripts/voice-node-demo.py "What time is it?"
```

You should see the reply in the terminal and hear it from the device. Try:

```bash
python3 scripts/voice-node-demo.py "Tell me a one-sentence joke."
echo "Hello JARVIS" | python3 scripts/voice-node-demo.py
```

If the FIFO doesn’t exist, the script prints how to create it and run the TTS reader.

---

## Option C: Full always-on voice node (wake word → STT → JARVIS → TTS)

**What you get:** Say “Hey JARVIS” (or configured phrase), then your command; JARVIS replies in text and TTS. Needs runbook setup (PulseAudio, Whisper, config).

### 1. Do the runbook once

Follow [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) in order:

1. ADB phantom process limit (optional but recommended).
2. `pkg install python pulseaudio sox alsa-utils termux-api`
3. PulseAudio + `pactl load-module module-sles-source`
4. `mkfifo ~/.tts_pipe` and run the TTS reader loop (or let `start-voice-node-pixel.sh` start it).
5. `pip install -r ~/JARVIS/scripts/voice_node_requirements.txt`
6. **Whisper (STT):** run `bash ~/JARVIS/scripts/install-whisper-termux.sh` (builds whisper.cpp, downloads base.en). Then `--write-config` or paste the printed `whisper_cmd` into `~/.jarvis/voice_node.yaml`. See runbook §6.
7. Copy and edit config if needed: `cp ~/JARVIS/scripts/voice_node_config.example.yaml ~/.jarvis/voice_node.yaml`.

### 2. Start the stack, then the voice node

```bash
bash ~/start-jarvis.sh
# Wait for Gateway/Chat 200, then:
bash ~/JARVIS/scripts/start-voice-node-pixel.sh
```

You should see: `Voice node: listening for 'Hey JARVIS' (gateway http://127.0.0.1:18789)`.

Say **“Hey JARVIS”** then your question or command. After a short silence, your speech is transcribed (Whisper), sent to the gateway, and the reply is streamed to TTS.

If you see “No STT configured”, run `bash ~/JARVIS/scripts/install-whisper-termux.sh --write-config` or set **whisper_cmd** in `~/.jarvis/voice_node.yaml` (see runbook §6).

---

## Day-to-day usage

| Goal | What to do |
|------|------------|
| **Quick chat/voice** | Start stack → open Chrome → `http://127.0.0.1:18888` or `http://127.0.0.1:18888/voice`. |
| **One-tap open voice** | After `setup-unlock-pixel.sh`, add **open-jarvis-voice** to Termux:Widget. |
| **Start stack from Mac** | From JARVIS repo: `./scripts/ssh-pixel-start-jarvis.sh` (SSH to Pixel and run start script). |
| **Start stack on Pixel** | Termux: `bash ~/start-jarvis.sh`. |
| **Demo gateway + TTS only** | Stack + TTS reader loop + `python3 scripts/voice-node-demo.py "Your message"`. |
| **Always-on voice** | Runbook once, then `start-jarvis.sh` + `start-voice-node-pixel.sh`; keep Termux (or Termux:Float) in foreground for mic. |

---

## Troubleshooting

- **Chat/voice page won’t load:** Stack not up. In Termux run `bash ~/start-jarvis.sh` and wait for `Chat UI: 200`.
- **“Gateway unreachable” in demo:** Start the stack; ensure InferrLM app has **Server ON** (port 8889).
- **No speech in demo:** Create `~/.tts_pipe` and run the TTS reader loop in another session; grant Termux microphone (and install termux-api).
- **Voice node: “No STT configured”:** Set `whisper_cmd` or `whisper_python` in `~/.jarvis/voice_node.yaml` (see [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) §6).
- **Voice node: “Install sounddevice” / PulseAudio:** Run runbook §2–3 (packages + PulseAudio + module-sles-source).
