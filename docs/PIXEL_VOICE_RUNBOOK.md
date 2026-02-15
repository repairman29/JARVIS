# Pixel Voice Runbook: Always-On Voice Node

Exact commands to prepare the Pixel 8 Pro (Termux) for the **always-on voice node** (wake word → STT → Clawdbot → TTS). Do these in order when setting up or debugging.

**Quick path:** For a single-page “max JARVIS on Pixel” setup, see [PIXEL_8_PRO_BADASS.md](./PIXEL_8_PRO_BADASS.md).

**See also:** [PIXEL_VOICE_DEMO.md](./PIXEL_VOICE_DEMO.md) (how to demo and use), [EDGE_NATIVE_VOICE_NODE.md](./EDGE_NATIVE_VOICE_NODE.md), [JARVIS_ON_ANDROID_COMMUNICATE.md](./JARVIS_ON_ANDROID_COMMUNICATE.md).

---

## 1. ADB: Phantom process limit

Android can kill Termux when it spawns too many child processes. Raise the limit (requires ADB from a computer or wireless debugging).

**Minimum (runbook default):**

```bash
adb shell "/system/bin/device_config put activity_manager max_phantom_processes 2147483647"
```

**Full bypass (Sovereign Nexus — 24/7 agent):** Run all three so the limit stays raised and the phantom-process monitor is disabled. Without step 1, some devices reset the limit during nightly sync.

```bash
adb shell "/system/bin/device_config set_sync_disabled_for_tests persistent"
adb shell "/system/bin/device_config put activity_manager max_phantom_processes 2147483647"
adb shell settings put global settings_enable_monitor_phantom_procs false
```

Reboot the device after the change. See [SOVEREIGN_MOBILE_NEXUS.md §2.2](./SOVEREIGN_MOBILE_NEXUS.md#22-phantom-process-killer-ppk--full-bypass) for rationale. From your computer you can run: `bash ~/JARVIS/scripts/adb-pixel-ppk-bypass.sh` (then reboot the device).

**Optional — persistent wakelock (ADB):** So the CPU doesn't enter deep sleep while the agent is active:

```bash
adb shell dumpsys deviceidle whitelist +com.termux
```

(You can also enable **Wake lock** in Termux settings; see [JARVIS_AUTONOMOUS_ON_PIXEL.md](./JARVIS_AUTONOMOUS_ON_PIXEL.md).)

---

## 2. Termux: Packages

In **Termux**:

```bash
pkg update && pkg upgrade -y
pkg install python pulseaudio sox alsa-utils termux-api termux-exec -y
```

- **termux-api**: for `termux-tts-speak` (and optional `termux-microphone-record`).
- **termux-exec**: redirects `/bin/bash` etc. to Termux's prefix so Clawdbot tool scripts don't fail.
- **pulseaudio**, **sox**, **alsa-utils**: for the voice node’s audio pipeline (PulseAudio + OpenSL ES bridge).

**WiFi and location (pixel-sensors):** The commands `termux-wifi-connectioninfo` and `termux-location` talk to the **Termux:API** Android app. Per the [official Termux repo](https://github.com/termux/termux-app):

- **Termux and all plugins (including Termux:API) must be from the same source** (same APK signature). Do not mix F-Droid and GitHub, or Play and F-Droid.
- **You do not need the F-Droid app.** From the README: *"You can download the Termux APK directly from the site by clicking the **Download APK** link at the bottom of each version section."*

**Official-recommended install (F-Droid, direct APK — no F-Droid app):**

1. On the Pixel, open **Chrome**. Uninstall any existing Termux and Termux:API first (Settings → Apps → search *termux*).
2. **Termux:** Go to [f-droid.org/en/packages/com.termux/](https://f-droid.org/en/packages/com.termux/) → scroll to the latest version → click **Download APK** → open the file and install.
3. **Termux:API:** Go to [f-droid.org/en/packages/com.termux.api/](https://f-droid.org/en/packages/com.termux.api/) → **Download APK** → open and install.
4. **Settings → Apps → Termux:API → Permissions** → **Location** ON.
5. Open **Termux** → `pkg update && pkg install nodejs python pulseaudio sox alsa-utils termux-api termux-exec git -y`. Test: `termux-wifi-connectioninfo` and `termux-location` (location may take 10–30 s for first fix).

Battery works without the app (system API). Camera uses the same Termux:API app; if camera works, the app is installed.

**If you see "Termux:API is not yet available on Google Play":** That usually means **signature mismatch**. Termux (main app) and Termux:API (add-on) must come from the **same source** and be signed with the same key. If Termux is from **Google Play** and Termux:API is from **F-Droid** (or vice versa), they won't communicate. Fix: install **both** from the same source (F-Droid or GitHub), then re-run setup and re-push JARVIS.

**If F-Droid won’t install Termux (e.g. “built for older Android”, or install fails):**

1. **Retry F-Droid:** Uninstall **both** Termux and Termux:API. In **Settings → Apps → F-Droid**, allow **“Install unknown apps”** (or “Install from this source”). Open F-Droid again, install **Termux** first, then **Termux:API**.  
2. **Use GitHub APKs instead (sideload):** Install **both** apps from official GitHub releases so signatures match.  
   - **Termux:** [github.com/termux/termux-app/releases](https://github.com/termux/termux-app/releases) — for Android 7+ use the **android-7** build; Pixel 8 Pro is **arm64-v8a** (or use **universal**). Example: `termux-app_v0.119.0-beta.3+apt-android-7-github-debug_arm64-v8a.apk`.  
   - **Termux:API:** [github.com/termux/termux-api/releases](https://github.com/termux/termux-api/releases) — download the APK for the same “source” (e.g. the release that matches; check the release notes for compatibility with the Termux version).  
   - On the Pixel: allow **“Install unknown apps”** for your browser (or Files app) and open the downloaded APKs to install. Install **Termux** first, then **Termux:API**.  
   - Then in Termux: `pkg update && pkg install … termux-api`, and grant **Termux:API** **Location** in Settings. Re-push JARVIS from your computer.

If you stay on **Play Store Termux**, only **battery** and **camera** (if the API app was ever working) are reliable; **WiFi** and **location** need Termux + Termux:API from the same non-Play source.

**If nothing works (F-Droid app won’t install, GitHub APKs “don’t work”):**

1. **Try F-Droid APKs from the website (no F-Droid app):** On the Pixel, open **Chrome** and go to [f-droid.org/en/packages/com.termux/](https://f-droid.org/en/packages/com.termux/) — scroll to the version you want and click **Download APK**. Then go to [f-droid.org/en/packages/com.termux.api/](https://f-droid.org/en/packages/com.termux.api/) and **Download APK** for Termux:API. Install **Termux** first, then **Termux:API**. This uses the system installer and can avoid “built for older Android” from the F-Droid app; both APKs are F-Droid-signed so they match.
2. **Use JARVIS without WiFi/location:** Battery and camera (and ADB, if you set it up) still work. Ask “what’s my battery?” or “take a picture.” WiFi and location tools will return a clear error; the agent can say “I don’t have WiFi/location on this device” and keep going.

---

## 3. PulseAudio + OpenSL ES source

Start PulseAudio and load the Android microphone source. Run once per session (or add to `start-voice-node-pixel.sh`, which already does this):

```bash
pulseaudio --start --load="module-native-protocol-tcp auth-ip-acl=127.0.0.1" --exit-idle-time=-1
sleep 1
pactl load-module module-sles-source
```

Check that the source exists:

```bash
pactl list sources short
```

You should see an OpenSL ES or default source. If `module-sles-source` fails, the voice node may still work with the default capture device.

---

## 4. FIFO TTS (low-latency system TTS)

Keeping `termux-tts-speak` warm in a loop avoids cold-start latency. Use a FIFO and a reader loop.

**One-time setup:**

```bash
mkfifo ~/.tts_pipe
```

**Start the TTS reader** (in a separate Termux session or in the background before the voice node):

```bash
while true; do while IFS= read -r line; do [ -n "$line" ] && termux-tts-speak "$line"; done < ~/.tts_pipe; done
```

The voice node (and/or `start-voice-node-pixel.sh`) writes one sentence per line to `~/.tts_pipe`. This loop speaks each line. When the writer closes the FIFO, the inner `while` exits and the loop reopens the FIFO for the next session.

---

## 5. Python deps for the voice node

From the JARVIS repo (or after `cd ~/JARVIS`):

```bash
pip install -r scripts/voice_node_requirements.txt
```

Or minimal install:

```bash
pip install sounddevice numpy openwakeword requests PyYAML
```

If `sounddevice` or PulseAudio fails on Termux, ensure PulseAudio is running and that you have a working capture device (`pactl list sources short`).

---

## 6. Whisper (STT) setup — whisper.cpp on Termux

The voice node needs speech-to-text. The recommended way on the Pixel is **whisper.cpp** (no Python torch).

**Option A: Install script (recommended)**

In **Termux**:

```bash
bash ~/JARVIS/scripts/install-whisper-termux.sh
```

This installs dependencies (git, cmake, clang, make, ffmpeg), clones and builds whisper.cpp with `-DGGML_NO_OPENMP=ON`, downloads the **base.en** model, and prints the `whisper_cmd` line to add to your config. Build can take several minutes.

To have the script **write** `whisper_cmd` into `~/.jarvis/voice_node.yaml` (create or update):

```bash
bash ~/JARVIS/scripts/install-whisper-termux.sh --write-config
```

**Option B: Manual**

```bash
pkg install -y git cmake clang make ffmpeg curl
cd ~
git clone --depth 1 https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
cmake -S . -B build -DGGML_NO_OPENMP=ON
cmake --build build -j"$(nproc 2>/dev/null || echo 2)"
bash models/download-ggml-model.sh base.en
```

Then set in `~/.jarvis/voice_node.yaml`:

```yaml
whisper_cmd: "$HOME/whisper.cpp/build/bin/whisper-cli -m $HOME/whisper.cpp/models/ggml-base.en.bin -l en -otxt -f"
```

(Use full paths if the `$HOME` expansion is not applied when the voice node runs.)

**Other models:** Use `tiny.en` (faster, less accurate) or `small.en` (slower, better). Pass the model name to the install script: `WHISPER_MODEL=tiny.en bash ~/JARVIS/scripts/install-whisper-termux.sh`.

---

## 7. Config (optional)

Copy and edit the example config:

```bash
mkdir -p ~/.jarvis
cp ~/JARVIS/scripts/voice_node_config.example.yaml ~/.jarvis/voice_node.yaml
```

Edit `~/.jarvis/voice_node.yaml` to set at least:

- **gateway_url**: `http://127.0.0.1:18789` (default).
- **tts_fifo**: `~/.tts_pipe` (or leave blank to use default).
- **whisper_cmd**: filled by the Whisper install script (see §6) or set manually.

---

## 8. Start the voice node

Ensure the **JARVIS stack** is running (gateway, chat server, InferrLM/adapter):

```bash
bash ~/start-jarvis.sh
# or: bash ~/JARVIS/scripts/start-jarvis-pixel.sh
```

Then start the voice node (PulseAudio + FIFO reader + Python):

```bash
bash ~/JARVIS/scripts/start-voice-node-pixel.sh
```

Or run components manually:

1. PulseAudio + `pactl load-module module-sles-source` (see §3).
2. TTS reader loop (see §4) in the background.
3. `python3 ~/JARVIS/scripts/voice_node.py`.

---

## 8.1. Hey JARVIS without Chrome

You can talk to JARVIS and get a spoken reply **without opening the Chrome chat page**. Use the voice node in Termux only.

1. **Start the JARVIS stack** (gateway, etc.) on the Pixel, e.g. `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`.
2. **Start the voice node:** `bash ~/JARVIS/scripts/start-voice-node-pixel.sh`.
3. In the voice-node terminal, **press Enter** when you want to speak.
4. Say **"Hey JARVIS, &lt;your question&gt;"** or just your question (e.g. *"Hey JARVIS, what time is it?"* or *"What's the weather?"*).
5. The reply is spoken via Termux TTS; no browser needed.

On Pixel/Termux the node runs in **manual trigger** mode (press Enter to record) because OpenWakeWord is not available (no onnxruntime wheel for Termux/ARM). The node still strips "Hey JARVIS" / "JARVIS" from the start of what you said before sending to the gateway, so you can use the phrase naturally. To disable that, set `strip_wake_phrase_from_transcript: false` in `~/.jarvis/voice_node.yaml`. For **true wake word** (e.g. "Hey Clawd") when onnxruntime is available, and for custom model training, see [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md).

---

## 9. Optional: Swap file

If the device runs out of memory (e.g. during long conversations or large models), add a file-based swap in Termux:

```bash
dd if=/dev/zero of=~/swapfile bs=1024 count=2097152   # 2 GB
chmod 600 ~/swapfile
mkswap ~/swapfile
swapon ~/swapfile
```

To enable swap again after a reboot:

```bash
swapon ~/swapfile
```

(You can add this to `termux-boot-start-jarvis` or a small boot script.)

---

## 10. Optional: Pin InferrLM to big cores

If InferrLM runs as a separate process (e.g. llama-server or similar) and you want to reduce latency by keeping it on the big cores, use `taskset`. Example (core list depends on your device; Tensor G3 often uses 4–8 for big/mid):

```bash
taskset -c 4,5,6,7,8 ./llama-server ...
```

For the **InferrLM Android app**, the OS manages CPU affinity; this applies to server processes you start manually in Termux.

**Optional — Vulkan (Mali GPU):** So Whisper or llama.cpp can use the GPU in Termux, set the loader before running them:

```bash
export VK_ICD_FILENAMES=/vendor/etc/vulkan/icd.d/mali.json
```

If that path doesn’t exist, try `ls /vendor/etc/vulkan/icd.d/` or see [EDGE_NATIVE_VOICE_NODE.md §2](./EDGE_NATIVE_VOICE_NODE.md#2-hardware-and-environment-tied-to-this-repo).

---

## 11. Microphone in background (Android 14)

Android 14 restricts background microphone access. For always-on listening:

- **Fake standby:** Use an overlay app that draws a black screen (OLED off) while keeping the app in the foreground so the mic stays available.
- **Termux:Float:** Run the voice node in a floating Termux window so the process stays in the foreground while you use other apps (with the screen on).

---

## 12. Optional: Tailscale, Proot, and latency

### Tailscale (remote access)

Stable identity and secure access from laptop/tablet without opening ports on carrier NAT:

- **Termux:** `pkg install tailscale` (or use the Android Tailscale app and run the gateway in Termux; gateway must bind `0.0.0.0` so it’s reachable on the Tailscale IP).
- Start Tailscale and log in; the Pixel gets a stable Tailscale IP. From another device on the same Tailscale network you can hit `http://<pixel-tailscale-ip>:18789` (gateway) or `:18888` (chat).
- Ensure the gateway and chat server are started with bind address `0.0.0.0` (default in most JARVIS scripts).

See [SOVEREIGN_MOBILE_NEXUS.md §2.3](./SOVEREIGN_MOBILE_NEXUS.md#23-network-tailscale-optional).

### Proot-Distro (optional full Linux)

If you need glibc or desktop Linux parity (e.g. a binary that doesn’t run in plain Termux):

```bash
pkg install proot-distro
proot-distro install ubuntu
proot-distro login ubuntu
# Then: apt update, install Node, openclaw, etc.
```

JARVIS is **Termux-first**; Proot is optional. See [SOVEREIGN_MOBILE_NEXUS.md §2.1](./SOVEREIGN_MOBILE_NEXUS.md#21-termux-vs-proot-distro).

### Latency (snappier voice)

- **VAD:** In `~/.jarvis/voice_node.yaml`, set `vad_silence_seconds: 0.6` (or `0.5`) so the node sends the utterance to the gateway sooner after you stop speaking. Default `0.7` is a good balance; lower can cut off slow speakers.
- **Gateway on device:** Running the gateway and InferrLM on the same Pixel keeps round-trip low (no network hop). For cloud gateway, latency is higher but still usable.
- **TTS:** The FIFO + `termux-tts-speak` loop (§4) avoids cold-start; first sentence may still have a short delay.

---

## Quick checklist

| Step | Command / action |
|------|-------------------|
| ADB phantom limit | `adb shell "device_config put activity_manager max_phantom_processes 2147483647"` |
| Termux packages | `pkg install python pulseaudio sox alsa-utils termux-api` |
| PulseAudio | `pulseaudio --start ...` then `pactl load-module module-sles-source` |
| FIFO TTS | `mkfifo ~/.tts_pipe`; run reader loop in background |
| Python deps | `pip install -r scripts/voice_node_requirements.txt` |
| Whisper (STT) | `bash ~/JARVIS/scripts/install-whisper-termux.sh` (then add printed whisper_cmd to config, or use `--write-config`) |
| Config | `cp scripts/voice_node_config.example.yaml ~/.jarvis/voice_node.yaml` and edit |
| Start stack | `bash ~/start-jarvis.sh` |
| Start voice node | `bash ~/JARVIS/scripts/start-voice-node-pixel.sh` |
