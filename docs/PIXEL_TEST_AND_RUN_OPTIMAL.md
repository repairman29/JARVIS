# Test JARVIS on the Pixel and run optimally

Short path: **get him running** → **verify** → **tune for best experience**.

---

## Part 1: Get him running

Follow [PIXEL_MAKE_IT_WORK.md](./PIXEL_MAKE_IT_WORK.md) once, then use the one-command flow.

### One-time on the Pixel

1. **Termux + Termux:API** from the same source (F-Droid direct APK or GitHub). Uninstall any existing ones first. Enable **Location** for Termux:API.
2. In Termux:
   ```bash
   pkg update && pkg install openssh nodejs python pulseaudio sox alsa-utils termux-api termux-exec git -y
   whoami
   passwd
   sshd
   ```
3. **InferrLM app:** open it, turn **Server** **ON** (port 8889).

### From the Mac (every time you want to sync and start)

4. Same Wi‑Fi as the Pixel. Optional: connect USB once so the script can discover the Pixel’s IP via ADB.
5. **One command** (use your Termux username from `whoami` if it’s not `u0_a310`):
   ```bash
   cd ~/JARVIS && TERMUX_USER=u0_a310 bash scripts/pixel-sync-and-start.sh
   ```
   Replace `u0_a310` with your Termux username. Enter your Termux password when prompted. This pushes JARVIS + neural-farm and starts the stack on the Pixel.

### Use JARVIS

6. On the Pixel, open **Chrome** → **http://127.0.0.1:18888** (chat). Voice: **http://127.0.0.1:18888/voice**

If SSH is unreachable: in Termux run `sshd`, same Wi‑Fi, then run the Mac script again.  
If “Permission denied”: use the exact username from `whoami` and the password you set with `passwd`.

---

## Part 2: Test that everything works

Use [PIXEL_TEST_CHECKLIST.md](./PIXEL_TEST_CHECKLIST.md); here’s the minimal pass.

### From the Mac

- **Device visible:** `adb devices` (one device).
- **Optional PPK bypass:** `bash ~/JARVIS/scripts/adb-pixel-ppk-bypass.sh` then reboot Pixel (reduces risk of Termux being killed).

### On the Pixel (Termux)

- **Stack:** `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`  
  Pass: “JARVIS is live”, Gateway 200, Chat 18888 200. InferrLM Server must be ON (8889).
- **Diagnostic (if something is 000):** `bash ~/JARVIS/scripts/diagnose-pixel-on-device.sh` or `diagnose-pixel-stack.sh` (ports, logs).
- **Voice (optional):** `bash ~/JARVIS/scripts/start-voice-node-pixel.sh` → press Enter, say “Hey JARVIS, what time is it?” → expect transcript + spoken reply.
- **pixel-sensors (battery):**  
  `cd ~/JARVIS && node -e "const m=require('./skills/pixel-sensors/index.js'); console.log(JSON.stringify(m.tools.get_pixel_device_status(), null, 2))"`  
  On Pixel with termux-api: `success: true`, `on_device: true`, battery %. On Mac: `on_device: false` is OK.

### Browser on the Pixel

- **Chat:** Chrome → http://127.0.0.1:18888 → send a message, get a reply.
- **Voice:** http://127.0.0.1:18888/voice → mic + “Speak replies” work.

---

## Part 3: Run optimally

These steps make JARVIS more stable and responsive.

### One-time hardening (from a computer with ADB)

| Step | Command |
|------|--------|
| **Phantom process limit** | `bash ~/JARVIS/scripts/adb-pixel-ppk-bypass.sh` then **reboot** the Pixel. |
| **Wakelock (optional)** | `adb shell dumpsys deviceidle whitelist +com.termux` |

### One-time in Termux (optional but recommended)

- **Swap (4GB):**  
  `dd if=/dev/zero of=~/swapfile bs=1024 count=4194304 && chmod 600 ~/swapfile && mkswap ~/swapfile && swapon ~/swapfile`
- **TTS FIFO (for voice):** `mkfifo ~/.tts_pipe`
- **Voice node config:**  
  `mkdir -p ~/.jarvis && cp ~/JARVIS/scripts/voice_node_config.example.yaml ~/.jarvis/voice_node.yaml`  
  Edit if needed (e.g. `whisper_cmd` after running `install-whisper-termux.sh`).
- **SOUL/persona (voice):** `cp ~/JARVIS/docs/SOUL_TEMPLATE.md ~/.jarvis/SOUL.md` and edit. First ~1500 chars are used for voice; keep replies short and spoken-style.

### Daily startup on the Pixel

- **Stack only:** `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`
- **Stack + voice in background:** `bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice`
- Or start the voice node in a second Termux tab: `bash ~/JARVIS/scripts/start-voice-node-pixel.sh`

Always ensure **InferrLM app → Server ON (8889)** before or right after starting.

### Optional: snappier voice

- In `~/.jarvis/voice_node.yaml`: set `vad_silence_seconds: 0.6` so it stops recording a bit sooner.
- **Wake lock:** Termux → Settings → Wake lock ON so the CPU doesn’t sleep during use.

---

## Quick reference

| Goal | Command / URL |
|------|----------------|
| Sync + start from Mac | `cd ~/JARVIS && bash scripts/pixel-sync-and-start.sh` |
| Start stack on Pixel | `bash ~/JARVIS/scripts/start-jarvis-pixel.sh` |
| Start stack + voice | `bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice` |
| Chat in browser | http://127.0.0.1:18888 |
| Voice in browser | http://127.0.0.1:18888/voice |
| On-device diagnostic | `bash ~/JARVIS/scripts/diagnose-pixel-on-device.sh` |
| Full test checklist | [PIXEL_TEST_CHECKLIST.md](./PIXEL_TEST_CHECKLIST.md) |
| Troubleshooting | [PIXEL_TROUBLESHOOTING.md](./PIXEL_TROUBLESHOOTING.md) |
| Max setup (hardening, swap, voice) | [PIXEL_8_PRO_BADASS.md](./PIXEL_8_PRO_BADASS.md), [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) |
