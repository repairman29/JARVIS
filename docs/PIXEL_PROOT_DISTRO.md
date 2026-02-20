# Proot-Distro on the Pixel — Full Linux (Ubuntu) in Termux

**Goal:** Run a full **glibc** Linux environment (e.g. Ubuntu) inside Termux via **proot-distro**. Use this when you need desktop Linux parity (e.g. a binary or tutorial that assumes Debian/Ubuntu, or a Node native module that fails in plain Termux).

JARVIS is **Termux-first**; Proot is **optional** for maximum compatibility.

---

## When to use Proot

| Use Proot when… | Stay in Termux when… |
|-----------------|----------------------|
| A binary or package only works on “real” Linux (glibc, apt). | Running the existing JARVIS stack (Node, Python, InferrLM, voice node). |
| You follow a tutorial that assumes `apt install …` and standard paths. | You want the lightest setup and best integration with Termux:API, PulseAudio, and Android. |
| A Node native addon fails to build in Termux (e.g. missing glibc symbol). | Everything you need is in `pkg` / `pip` and works in Termux. |

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

## Step-by-step (scripted)

The script **scripts/pixel-proot-setup.sh** (run in Termux) installs proot-distro and Ubuntu, then prints instructions to enter the distro and optionally install Node and JARVIS.

```bash
bash ~/JARVIS/scripts/pixel-proot-setup.sh
```

Then follow the printed steps to `proot-distro login ubuntu` and run the inner setup (clone JARVIS, install Node, etc.).

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
| Run JARVIS in Proot | Clone repo (or mount), install deps, start adapters/gateway/chat; InferrLM stays on device at 127.0.0.1:8889 |

**See also:** [PIXEL_VOICE_RUNBOOK.md §12](./PIXEL_VOICE_RUNBOOK.md#12-optional-tailscale-proot-and-latency), [SOVEREIGN_MOBILE_NEXUS.md §2.1](./SOVEREIGN_MOBILE_NEXUS.md#21-termux-vs-proot-distro), [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md) (Proot-Distro path).
