# JARVIS Mobile Compute Node: Architecture & Setup Guide

**Goal:** The **Pixel is the JARVIS server.** Provision it as a headless, battery-backed node that runs JARVIS stably and continuously. The Mac is **not** responsible for JARVIS; the Mac uses JARVIS by connecting to the Pixel. See **PIXEL_AS_JARVIS_SERVER.md**.

---

## 1. Overview

By utilizing **PRoot**, we bypass Android OS restrictions to create a native Linux environment without root. The device runs the JARVIS gateway, chat, Discord, skills, and cron. It operates as an AI inference server, an API gateway, and (optionally) a remote development environment. Clients (Mac, Cursor, jarvis-ui) connect to it; they do not run the gateway themselves.

**Stability requirement:** The stack must stay up across backgrounding, doze, and reboots. See **[PIXEL_STABLE_ENVIRONMENT.md](./PIXEL_STABLE_ENVIRONMENT.md)** for the runbook that keeps the node “always on.”

---

## 2. System Architecture

Five-layer stack:

| Layer | Role |
|-------|------|
| **Hardware** | ARM64 Android (high-RAM, Tensor/Snapdragon). |
| **Environment** | Termux + PRoot (Ubuntu). |
| **AI Inference** | InferrLM (ARM-optimized local inference) + LiteLLM (OpenAI-compatible API on port 4000). |
| **Development** | code-server (browser VS Code on 8080) — optional. |
| **Network** | Tailscale (Zero Trust mesh for remote access). |

**Repo mapping:** We use **InferrLM** (app + adapter) and a **LiteLLM proxy** on 4000; gateway on 18789, chat on 18888. See **PIXEL_PROOT_DISTRO.md**, **PIXEL_LITELLM_VS_INFERRLM.md**.

---

## 3. Deployment Protocol (phases)

- **Phase 1 – Base:** Termux (F-Droid/GitHub, not Play Store) → `pkg install proot-distro` → `proot-distro install ubuntu`. All stack commands run inside Ubuntu (via `proot-distro login ubuntu` or our scripts).
- **Phase 2 – AI:** In Ubuntu: build/run InferrLM (or use app), adapter (8888→8889), LiteLLM proxy on 4000. See **scripts/start-jarvis-pixel-proot.sh**, **PIXEL_LLM_MODEL_GUIDE.md**.
- **Phase 3 – Dev (optional):** code-server on 8080; bind to `0.0.0.0` for Tailscale access.
- **Phase 4 – Network:** Tailscale in Ubuntu (or Termux); join Tailnet for `http://<NODE_TAILSCALE_IP>:8080` (IDE) and `http://<NODE_TAILSCALE_IP>:4000` (AI API).

**One-command from repo:** From Mac run **scripts/pixel-sync-and-start-proot.sh** (or **pixel-do-it-all.sh**). On device after boot, **Termux:Boot** runs **scripts/termux-boot-start-jarvis**, which starts the Proot stack. See **PIXEL_PROOT_DISTRO.md**.

---

## 4. Node Operations & Access

| Service | URL (on device) | Remote (Tailscale) |
|---------|------------------|---------------------|
| Chat UI | http://127.0.0.1:18888 | http://&lt;NODE_TAILSCALE_IP&gt;:18888 |
| Gateway | http://127.0.0.1:18789 | http://&lt;NODE_TAILSCALE_IP&gt;:18789 |
| AI API (LiteLLM) | http://127.0.0.1:4000 | http://&lt;NODE_TAILSCALE_IP&gt;:4000 |
| code-server (optional) | http://127.0.0.1:8080 | http://&lt;NODE_TAILSCALE_IP&gt;:8080 |

**Stable environment:** To keep the node running all the time, follow **[PIXEL_STABLE_ENVIRONMENT.md](./PIXEL_STABLE_ENVIRONMENT.md)** (Termux:Boot, Wake lock, battery optimization, watchdog, verification).
