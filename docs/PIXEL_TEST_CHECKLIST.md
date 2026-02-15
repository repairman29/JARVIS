# Pixel test checklist

Use this after setup or after changes to verify JARVIS on the Pixel 8 Pro. Run in order where possible.

---

## 1. From your computer (ADB)

| Step | Command | Pass condition |
|------|--------|-----------------|
| Device visible | `adb devices` | One device listed (USB or wireless). |
| PPK bypass (optional) | `bash ~/JARVIS/scripts/adb-pixel-ppk-bypass.sh` | Script exits 0; then reboot Pixel. |

---

## 2. On the Pixel (Termux)

### 2.1 One-time hardening (optional)

```bash
bash ~/JARVIS/scripts/pixel-setup-hardening.sh
```

- Pass: Swap file created and/or `swapon` shows the file; ADB commands printed.
- Then run the printed ADB commands from your computer and reboot.

### 2.2 Stack

```bash
bash ~/JARVIS/scripts/start-jarvis-pixel.sh
```

- Pass: Final output shows "JARVIS is live" and Gateway (18789): 200, Chat UI (18888): 200 (Proxy 200 or skipped is OK if using adapter only).
- InferrLM app must have **Server ON** (port 8889).

### 2.3 Diagnostic (if something is 000)

```bash
bash ~/JARVIS/scripts/diagnose-pixel-stack.sh
```

- Check ports 8889, 4000, 18789, 18888; gateway.log and adapter.log for errors.

### 2.4 Voice node (separate tab or after stack)

```bash
bash ~/JARVIS/scripts/start-voice-node-pixel.sh
```

- Pass: "JARVIS voice node: press Enter to speak..."; no Python/sounddevice errors.
- Press Enter, say "Hey JARVIS, what time is it?" — pass: transcript and spoken reply (if Whisper + TTS FIFO are configured).

### 2.5 pixel-sensors skill (battery)

From JARVIS repo on the Pixel (or from a machine with the repo, to test the function):

```bash
cd ~/JARVIS
node -e "const m=require('./skills/pixel-sensors/index.js'); console.log(JSON.stringify(m.tools.get_pixel_device_status(), null, 2))"
```

- On Pixel with termux-api: pass: `success: true`, `on_device: true`, battery percentage and summary.
- On Mac/desktop: pass: `on_device: false` (skill gracefully reports not on device).

---

## 3. Browser on the Pixel

| Step | Action | Pass condition |
|------|--------|-----------------|
| Chat | Open Chrome → http://127.0.0.1:18888 | Chat UI loads; send a message and get a reply. |
| Voice | Open http://127.0.0.1:18888/voice | Mic and "Speak replies" work; optional "Listen for Hey JARVIS". |
| Speak API | From another machine: `curl -X POST http://<pixel-ip>:18888/speak -d "Test"` | Pixel speaks "Test" (TTS FIFO reader must be running). |

---

## 4. Quick regression (after code changes)

1. `bash scripts/adb-pixel-ppk-bypass.sh` (from PC; expect 0 or "No device").
2. `node -e "require('./skills/pixel-sensors/index.js').tools.get_pixel_device_status()"` (expect object with success/on_device).
3. `bash scripts/diagnose-pixel-stack.sh` (on Pixel; expect ports and logs).

---

**See also:** [PIXEL_8_PRO_BADASS.md](./PIXEL_8_PRO_BADASS.md), [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md), [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md).
