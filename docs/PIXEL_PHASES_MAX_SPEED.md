# Pixel phases — max speed (copy-paste in order)

**Prereq:** Phase 0 done (push + chat works). Pixel on USB for ADB or same Wi‑Fi for SSH.

**One-shot from Mac (after PPK + reboot):** SSH runs swap + FIFO + SOUL + cron on Pixel in one go:
```bash
cd ~/JARVIS && ssh -o StrictHostKeyChecking=no -p 8022 u0_a310@<pixel-ip> 'bash -s' < scripts/pixel-run-phases-1-5-on-device.sh
```
Then on Pixel: `bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice`

---

## 1. Persistence (Mac → reboot → Pixel)

**Mac:**
```bash
cd ~/JARVIS && bash scripts/adb-pixel-ppk-bypass.sh
# Multiple devices: ADB_SERIAL=<id> bash scripts/adb-pixel-ppk-bypass.sh
```
**Reboot Pixel.** Then **Pixel (Termux):**
```bash
dd if=/dev/zero of=~/swapfile bs=1024 count=4194304 && chmod 600 ~/swapfile && mkswap ~/swapfile && swapon ~/swapfile
```
**Mac (optional):** `adb shell dumpsys deviceidle whitelist +com.termux`

**Test:** On Pixel `bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 1`

---

## 2. Hardware — skip (doc only) or: `pkg install util-linux` in Termux

**Test:** `bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 2`

---

## 3. Networking — Tailscale

**Pixel:** Install Tailscale (Play Store app or Termux `pkg install tailscale`), log in, note Tailscale IP.  
**Mac:** `curl -s http://<tailscale-ip>:18888 | head -1`

---

## 4. Cognitive — no extra steps if chat works

**Test:** `bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 4`

---

## 5. Voice

**Pixel (Termux):**
```bash
mkfifo ~/.tts_pipe
mkdir -p ~/.jarvis && cp ~/JARVIS/scripts/voice_node_config.example.yaml ~/.jarvis/voice_node.yaml 2>/dev/null || true
bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice
```
Chrome → http://127.0.0.1:18888/voice

**Test:** `bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 5`

---

## 6. Cursor autonomy

**Pixel:** `cp ~/JARVIS/docs/SOUL_TEMPLATE.md ~/.jarvis/SOUL.md` then edit if you want.  
**Test:** `bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 6`

---

## 7. Proactive (cron)

**Pixel:** Setup should have added cron. Check: `crontab -l`. If empty: `crontab ~/jarvis.cron && crond -b`  
**Test:** `bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 7`

---

## 8. Actuation — termux-api + skills already in repo

**Test:** `termux-battery-status` then `bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 8`

---

## 9. Security — gateway on localhost or Tailscale only (doc)

**Test:** `bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 9`

---

## All tests (on Pixel)

```bash
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh all
```

## From Mac (SSH + ADB)

```bash
cd ~/JARVIS && bash scripts/pixel-phase-tests.sh all
```
