# One plan: JARVIS on Pixel → Badass → God Mode

**One path. Do the steps in order.** I can’t connect to your Pixel—you run these on the device and on your Mac. If something fails, stop and fix that step before continuing.

---

## Phase 0: What you need before starting

- **Pixel** and **Mac** on the same Wi‑Fi.
- **Termux** and **Termux:API** from the **same source** (both F-Droid APKs, or both GitHub). If you had issues before, uninstall both and install fresh from F-Droid in Chrome (see Phase 1).
- **InferrLM** app on the Pixel (for local LLM). You’ll turn Server ON in a later step.
- **neural-farm** repo on your Mac next to JARVIS (e.g. `~/neural-farm`). The push script needs it.

You don’t need to “see what’s in Downloads” first. The plan below pushes everything from the Mac and sets the Pixel up from scratch.

---

## Phase 1: Termux + SSH (once)

**On the Pixel**

1. Uninstall any existing **Termux** and **Termux:API**.
2. In **Chrome**, open:
   - https://f-droid.org/en/packages/com.termux/ → scroll down → **Download APK** → install.
   - https://f-droid.org/en/packages/com.termux.api/ → **Download APK** → install.
3. **Settings → Apps → Termux:API → Permissions → Location** ON.
4. Open **Termux**. Run:

```bash
pkg update && pkg install openssh nodejs python pulseaudio sox alsa-utils termux-api termux-exec git -y
whoami
passwd
sshd
```

5. Write down the username **whoami** printed (e.g. `u0_a310`). You’ll use it on the Mac. Same Wi‑Fi as the Mac.

**On the Mac**

6. Open InferrLM on the Pixel (if you use it) and turn **Server ON** (port 8889).
7. Run (use your Termux username from step 5):

```bash
cd ~/JARVIS && TERMUX_USER=u0_a310 bash scripts/pixel-sync-and-start.sh
```

Replace `u0_a310` if different. Enter your Termux password when asked. This pushes JARVIS + neural-farm and runs setup on the Pixel, then starts the stack.

8. On the **Pixel**, open **Chrome** → **http://127.0.0.1:18888**. You should see the chat UI. Send a message to confirm JARVIS replies.

If SSH says “cannot reach”: in Termux run `sshd` again, same Wi‑Fi, then run the Mac command again.  
If “Permission denied”: use the exact username from `whoami` and the password you set with `passwd`.

**Stop here and confirm chat works.** Then continue to Phase 2.

---

## Phase 2: Badass (stable, voice-ready)

Do these **once** unless you factory‑reset.

**From the Mac (ADB)**  
Pixel connected via USB or wireless debugging. Run, then **reboot the Pixel**:

```bash
cd ~/JARVIS && bash scripts/adb-pixel-ppk-bypass.sh
```

**On the Pixel (Termux)**  
After reboot, open Termux and run each block.

**2.1 Swap (4GB)** — reduces OOM kills:

```bash
dd if=/dev/zero of=~/swapfile bs=1024 count=4194304
chmod 600 ~/swapfile
mkswap ~/swapfile
swapon ~/swapfile
```

**2.2 TTS FIFO** — for voice replies:

```bash
mkfifo ~/.tts_pipe
```

**2.3 Voice node config** (optional; for voice later):

```bash
mkdir -p ~/.jarvis
cp ~/JARVIS/scripts/voice_node_config.example.yaml ~/.jarvis/voice_node.yaml
```

**2.4 Wakelock (optional)** — from Mac with ADB:

```bash
adb shell dumpsys deviceidle whitelist +com.termux
```

**Daily start (on the Pixel)**  
In Termux:

```bash
bash ~/JARVIS/scripts/start-jarvis-pixel.sh
```

Or with voice in the background:

```bash
bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice
```

**Use JARVIS**  
- Chat: Chrome → **http://127.0.0.1:18888**  
- Voice: Chrome → **http://127.0.0.1:18888/voice** (allow mic, enable “Speak replies”)

InferrLM app must have **Server ON** before or right after starting the stack.

---

## Phase 3: God Mode (optional extras)

Only after Phase 1 and 2 work.

| What | Where | Command / action |
|------|--------|-------------------|
| **Whisper (STT)** | Termux on Pixel | `bash ~/JARVIS/scripts/install-whisper-termux.sh --write-config` — then set `whisper_cmd` in `~/.jarvis/voice_node.yaml` if needed. |
| **Voice pip deps** | Termux on Pixel | `pip install sounddevice numpy requests PyYAML` (or `pip install -r ~/JARVIS/scripts/voice_node_requirements.txt`) |
| **SOUL/persona** | Pixel | `cp ~/JARVIS/docs/SOUL_TEMPLATE.md ~/.jarvis/SOUL.md` and edit. First ~1500 chars used for voice. |
| **Snappier voice** | Pixel | In `~/.jarvis/voice_node.yaml` set `vad_silence_seconds: 0.6` |
| **Fake standby (OLED)** | Pixel | Install a black-overlay app (e.g. Extinguish) so mic stays on when “screen off” for always-on voice. |
| **Speak from Mac** | Mac | `curl -X POST http://<pixel-ip>:18888/speak -d "Your message"` (Pixel must be running stack; replace `<pixel-ip>` with Pixel’s IP on your Wi‑Fi). |

---

## If you had to “remove a bunch and start over”

1. On the Pixel: uninstall Termux and Termux:API, then reinstall **both** from F-Droid (Phase 1 steps 1–5).
2. Ignore anything left in Downloads. Don’t rely on old tarballs.
3. On the Mac: run **Phase 1 step 7** again (`pixel-sync-and-start.sh`). That overwrites and restarts everything on the Pixel.
4. Confirm **http://127.0.0.1:18888** on the Pixel in Chrome.
5. Then do Phase 2 (ADB bypass + reboot, swap, FIFO, daily start).

---

## Quick reference

| Goal | Command / URL |
|------|----------------|
| Push + setup + start from Mac | `cd ~/JARVIS && bash scripts/pixel-sync-and-start.sh` |
| Start stack on Pixel | `bash ~/JARVIS/scripts/start-jarvis-pixel.sh` |
| Start stack + voice on Pixel | `bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice` |
| Chat on Pixel | http://127.0.0.1:18888 |
| Voice on Pixel | http://127.0.0.1:18888/voice |
| Termux username | In Termux: `whoami` |
| SSH not reachable | In Termux: `sshd`; same Wi‑Fi; run Mac script again |

---

## Troubleshooting

- **18888 won’t load:** After a fresh push, run on the Pixel: `bash ~/JARVIS/scripts/start-jarvis-pixel.sh` (setup starts the chat server now, but if you started before that change, run this once).
- **“litellm not installed”:** Safe to ignore. Gateway uses the adapter at 8888; chat and voice work.
- **“No such file” for a script:** JARVIS isn’t on the Pixel or path is wrong. Re-run from Mac: `cd ~/JARVIS && bash scripts/pixel-sync-and-start.sh`.
- **WiFi/location tools fail:** Termux and Termux:API must be from the same source (both F-Droid). Battery and camera still work.

See also: [PIXEL_MAKE_IT_WORK.md](./PIXEL_MAKE_IT_WORK.md), [PIXEL_TROUBLESHOOTING.md](./PIXEL_TROUBLESHOOTING.md), [PIXEL_8_PRO_BADASS.md](./PIXEL_8_PRO_BADASS.md), [PIXEL_GOD_MODE.md](./PIXEL_GOD_MODE.md).
