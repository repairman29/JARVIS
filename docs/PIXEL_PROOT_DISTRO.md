# Proot-Distro on the Pixel — Full Linux (Ubuntu) in Termux

**Goal:** Run JARVIS in a full **glibc** Linux environment (Ubuntu) inside Termux via **proot-distro** for stability and desktop Linux parity (apt, standard paths, native modules).

**Recommended path:** **Proot** (default). Boot and one-command start use Proot. **Termux-native** is the fallback when Proot isn’t installed or you need voice/PulseAudio in the same env.

---

## Why we optimize for Proot

| Termux issue | Proot (Ubuntu) |
|--------------|----------------|
| /tmp not writable (EACCES, gateway) | Real `/tmp`; no TMPDIR workaround. |
| pip / wrong Python (litellm "not installed") | One Python via apt; `pip install litellm[proxy]` works. |
| litellm or native deps fail to build | Standard glibc; neural-farm deps usually work. |
| Clipboard / native Node stubs | Real Linux ABI; no stubs when package has Linux build. |
| Path or permission quirks | Standard FHS inside container. |

**Trade-off:** Termux:API (battery, WiFi, location) and PulseAudio are Termux-specific. Run **voice node** in Termux if you need it; adapter, proxy, gateway, chat run well in Proot. See hybrid option below.

---

## When to use Proot vs Termux

| Use Proot (recommended)… | Use Termux when… |
|--------------------------|------------------|
| Running the JARVIS stack (adapter, proxy, gateway, chat). | You only need voice node + PulseAudio and want the lightest single env. |
| You want stable pip, litellm, and native builds. | Proot isn't set up yet; boot script falls back to Termux. |
| You follow tutorials that assume `apt install …` and standard paths. | You're debugging or prefer Bionic/pkg for a specific task. |

---

## Quick setup (Ubuntu)

**In Termux (on the Pixel):**

```bash
pkg update && pkg install proot-distro
proot-distro list          # see available distros
proot-distro install ubuntu
proot-distro login ubuntu
```

You are now inside an Ubuntu userspace. Then (inside Ubuntu):

```bash
apt update && apt install -y git curl
# Node 22 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v
```

To run JARVIS inside Ubuntu you would clone the repo (or bind-mount from Termux), install deps, and run the same stack (adapters, gateway, etc.). See §3 below.

---

## One-command start (Proot path)

Once Proot + Ubuntu and deps are set up:

**From Termux (on the Pixel):**

```bash
bash ~/JARVIS/scripts/run-jarvis-in-proot.sh
```

That enters Ubuntu and starts the full stack (adapter, proxy, gateway, chat) using your existing `~/JARVIS` and `~/neural-farm`. InferrLM stays on the device at 127.0.0.1:8889. No clipboard stubs or TMPDIR hacks; logs go to the proot home (e.g. `/root/*.log`). Voice node is best run in Termux (PulseAudio); see hybrid below.

### Automation from the Mac (SSH or ADB)

From the Mac, one command pushes JARVIS (unless using `--adb`) and runs the full Proot bootstrap + start on the Pixel. Uses **SSH** if reachable (passwordless after `setup-ssh-keys-to-pixel.sh`), else **ADB** (USB or Wi‑Fi debugging).

```bash
# Push + start (SSH or ADB with push)
cd ~/JARVIS && ./scripts/pixel-sync-and-start-proot.sh [pixel-ip] [--restart]

# ADB only — JARVIS already on device; no push, just start in Proot
cd ~/JARVIS && ./scripts/pixel-sync-and-start-proot.sh --adb [--restart]
```

- **Process-aware:** If gateway and chat are already up (18789, 18888), start is skipped unless you pass `--restart`.
- **Idempotent:** Installs proot-distro and Ubuntu if missing; runs first-time deps (Node, pip, npm install) inside Ubuntu when needed.
- **Restart:** With `--restart`, stops existing Termux JARVIS processes, then starts the stack in Proot (no double-bind on ports).
- **`--adb`:** Skip SSH and skip push; run bootstrap/start via ADB only (use when repo is already on the Pixel).

---

## Step-by-step (scripted)

The script **scripts/pixel-proot-setup.sh** (run in Termux) installs proot-distro and Ubuntu, then prints first-time steps to run **inside** Ubuntu (Node, pip, npm install, pip install -r neural-farm).

```bash
bash ~/JARVIS/scripts/pixel-proot-setup.sh
```

Then do the printed first-time setup inside `proot-distro login ubuntu`, and thereafter start the stack with **run-jarvis-in-proot.sh** (above).

---

## Running JARVIS inside Proot (Ubuntu)

1. **Enter the distro:** `proot-distro login ubuntu`.
2. **Install Node 22:** (as in §1) or use nvm.
3. **Clone or access JARVIS:**
   - Clone inside Ubuntu: `git clone <your-jarvis-repo> JARVIS && cd JARVIS`.
   - Or bind Termux home into Proot so the same repo is visible (advanced; depends on your proot-distro layout).
4. **Install dependencies:** `npm install` in `jarvis` (and any other modules); for Python voice node, `apt install python3-pip` and `pip install -r scripts/voice_node_requirements.txt`.
5. **InferrLM / LLM:** InferrLM typically runs as an Android app (port 8889). From inside Proot, `127.0.0.1` is the same device, so `http://127.0.0.1:8889` still works. Start InferrLM on the device and point the adapter to it.
6. **Ports:** Adapters (8888, 8887), gateway (18789), chat (18888), router (18890) can bind to `0.0.0.0` so they’re reachable from the host (Termux) and from the network if needed.
7. **Start the stack:** Same as in Termux, e.g. run the adapter, gateway, chat server, and webhook from the JARVIS scripts (adjusted paths if you cloned inside Proot).

**Caveats:**

- **Termux:API / PulseAudio:** These are Termux-specific. If you run the **voice node** inside Proot, you may need to use Termux for audio (PulseAudio, mic) and only run the rest in Proot, or run the full voice pipeline in Termux.
- **Storage:** Proot’s home is inside the distro; large models or downloads go there unless you bind-mount.

---

## Summary

| Step | Command / action |
|------|-------------------|
| Install Proot + Ubuntu | `pkg install proot-distro` then `proot-distro install ubuntu` |
| Enter Ubuntu | `proot-distro login ubuntu` |
| Install Node (in Ubuntu) | NodeSource script + `apt install nodejs` |
| Run JARVIS in Proot | From Termux: `bash ~/JARVIS/scripts/run-jarvis-in-proot.sh` (uses existing ~/JARVIS and ~/neural-farm). Or clone in Ubuntu and run `start-jarvis-pixel-proot.sh` inside. |
| Voice (hybrid) | Stack in Proot; run `start-voice-node-pixel.sh` in a separate Termux session for PulseAudio/mic. |

**See also:** [PIXEL_VOICE_RUNBOOK.md §12](./PIXEL_VOICE_RUNBOOK.md#12-optional-tailscale-proot-and-latency), [SOVEREIGN_MOBILE_NEXUS.md §2.1](./SOVEREIGN_MOBILE_NEXUS.md#21-termux-vs-proot-distro), [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md) (Proot-Distro path).
