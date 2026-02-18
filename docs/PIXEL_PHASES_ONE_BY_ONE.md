# Pixel roadmap — one phase at a time

Work through these in order. After each phase, run its test before moving on.

**Username:** Scripts use **u0_a310** by default for SSH/push. If your Termux `whoami` is different, set `TERMUX_USER=<whoami>` before the command.

**If multiple ADB devices:** set `ADB_SERIAL=<your-pixel-id>` (from `adb devices`).

---

## Complete all phases (one shot)

**Mac (once):**
1. `cd ~/JARVIS && bash scripts/adb-pixel-ppk-bypass.sh` (then reboot Pixel).
2. After reboot (optional): `adb shell dumpsys deviceidle whitelist +com.termux`
3. Push and sync: `bash scripts/pixel-sync-and-start.sh`

**Pixel (Termux):**
1. Run the on-device completer:  
   `bash ~/JARVIS/scripts/pixel-complete-all-phases.sh`
2. Start the stack:  
   `bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice`
3. Run phase tests:  
   `bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh all`

**From Mac (optional):**  
`bash scripts/pixel-phase-tests.sh all [pixel-ip]` (e.g. `192.168.86.209`)

---

## Phase 0: Foundation ✓

**Goal:** Chat + local LLM on Pixel; one-command push/start from Mac.

**Do this:**
1. Pixel: Termux + Termux:API from same source (F-Droid), `whoami`, `passwd`, `sshd`. Same Wi‑Fi as Mac.
2. Pixel: InferrLM app → turn **Server ON** (port 8889).
3. Mac:
   ```bash
   cd ~/JARVIS && bash scripts/pixel-sync-and-start.sh
   ```
4. Pixel: Chrome → **http://127.0.0.1:18888** → send a message. Chat should reply.

**Test:**
```bash
# On Pixel (Termux):
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 0

# From Mac (optional):
bash scripts/pixel-phase-tests.sh 0 [pixel-ip]
```

**Next:** Phase 1.

---

## Phase 1: Persistence

**Goal:** 24/7 uptime; no phantom-process kills.

**Do this:**

1. **Mac (Pixel on USB or wireless ADB):**
   ```bash
   cd ~/JARVIS && bash scripts/adb-pixel-ppk-bypass.sh
   ```
   If multiple devices: `ADB_SERIAL=<pixel-id> bash scripts/adb-pixel-ppk-bypass.sh`

2. **Reboot the Pixel.** (Required for PPK changes.)

3. **On Pixel (Termux), after reboot — swap file (one-time):**
   ```bash
   dd if=/dev/zero of=~/swapfile bs=1024 count=4194304
   chmod 600 ~/swapfile
   mkswap ~/swapfile
   swapon ~/swapfile
   ```

4. **Optional wakelock (Mac, after reboot):**
   ```bash
   adb shell dumpsys deviceidle whitelist +com.termux
   ```

**Test:**
```bash
# On Pixel:
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 1

# From Mac (ADB checks):
bash scripts/pixel-phase-tests.sh 1 [pixel-ip]
# Expect: PASS max_phantom_processes, PASS monitor disabled (after reboot).
```

**Next:** Phase 2.

---

## Phase 2: Hardware substrate

**Goal:** Optional. Core pinning + Vulkan doc’d; thermal awareness possible.

**Do this:**
- **Doc only for now:** Core pinning (taskset) and Vulkan ICD are in [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) and [EDGE_NATIVE_VOICE_NODE](./EDGE_NATIVE_VOICE_NODE.md). No required device steps unless you want GPU inference.
- **Optional:** Install `util-linux` in Termux if you want `taskset` for pinning later.

**Test:**
```bash
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 2
# SKIP is OK for taskset/Vulkan.
```

**Next:** Phase 3.

---

## Phase 3: Networking

**Goal:** Stable remote access (Tailscale).

**Do this:**
1. On Pixel: install **Tailscale** (Termux `pkg install tailscale` or Android app from Play).
2. Join your Tailscale network (log in / approve device).
3. Note the Pixel’s Tailscale IP. From Mac (on same Tailscale network): open `http://<tailscale-ip>:18888` to confirm chat works.

**Test:**
```bash
# On Pixel: tailscale status
# From Mac: curl -s http://<tailscale-ip>:18888 | head -1
bash scripts/pixel-phase-tests.sh 3 [pixel-ip]
```

**Next:** Phase 4.

---

## Phase 4: Cognitive (hybrid model)

**Goal:** Gateway uses local model; optional routing to Claude/OpenRouter for complex tasks.

**Do this:**
- Already done if chat works (adapter 8888 → gateway). Optional: configure gateway/openclaw for model routing by task; document in SOUL or config.

**Test:**
```bash
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 4
```

**Next:** Phase 5.

---

## Phase 5: Voice

**Goal:** TTS FIFO, PulseAudio, voice node, optional Whisper.

**Do this:**
1. **On Pixel (Termux):**
   ```bash
   mkfifo ~/.tts_pipe
   ```
2. **Voice config (optional):**
   ```bash
   mkdir -p ~/.jarvis
   cp ~/JARVIS/scripts/voice_node_config.example.yaml ~/.jarvis/voice_node.yaml
   ```
3. Start with voice: `bash ~/JARVIS/scripts/start-jarvis-pixel.sh --voice`. Chrome → http://127.0.0.1:18888/voice.
4. **Optional:** Whisper: `bash ~/JARVIS/scripts/install-whisper-termux.sh --write-config`.

**Test:**
```bash
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 5
```

**Next:** Phase 6.

---

## Phase 6: Cursor autonomy

**Goal:** SOUL.md, optional .cursorrules, specialist roles.

**Do this:**
1. **On Pixel or Mac (repo):**
   ```bash
   cp ~/JARVIS/docs/SOUL_TEMPLATE.md ~/.jarvis/SOUL.md   # on Pixel
   # or copy into your workspace; edit personality + specialists.
   ```
2. **Optional:** Add `.cursorrules` in JARVIS (or project) for mobile/termux/ADB awareness, PLAN.md, no hardcoded secrets.

**Test:**
```bash
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 6
```

**Next:** Phase 7.

---

## Phase 7: Proactive (heartbeat & memory)

**Goal:** Cron runs heartbeat/plan-execute; SOUL (and optional IDENTITY/MEMORY) in place.

**Do this:**
- Setup script already adds cron (jarvis.cron) if you ran `setup-jarvis-termux.sh`. Confirm:
  ```bash
  crontab -l
  ```
  Should show entries for plan-execute and heartbeat. If not, re-run setup or add:
  ```bash
  crontab ~/jarvis.cron
  crond -b
  ```

**Test:**
```bash
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 7
```

**Next:** Phase 8.

---

## Phase 8: Actuation

**Goal:** termux-api (battery, location, WiFi); pixel-sensors/diagnose present.

**Do this:**
- Termux:API from same source as Termux (Phase 0). Skills: pixel-sensors, pixel-adb, pixel-camera already in repo. Use them via gateway/chat.

**Test:**
```bash
termux-battery-status
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 8
```

**Next:** Phase 9.

---

## Phase 9: Security & resilience

**Goal:** Gateway not exposed to internet; swap + PPK in place; optional HITL for dangerous actions.

**Do this:**
- Bind gateway to 127.0.0.1 or access only via Tailscale (doc in runbook). Human-in-the-loop for payments/deletes: document in SOUL or gateway config. Swap + PPK from Phase 1.

**Test:**
```bash
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh 9
```

**Done.** You’ve walked all phases.
