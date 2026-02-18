# Edge-Native Sovereign Intelligence — Roadmap

**Source:** Architectural design for a JARVIS-class autonomous agent on the Google Pixel 8 Pro (Tensor G3, OpenClaw, full-duplex voice, guided autonomy). This doc translates that design into a **phased, actionable roadmap** with concrete deliverables and links to existing JARVIS/Pixel docs and scripts.

**Use this when:** You want a single ordered plan from "working chat on Pixel" to "sovereign edge agent": persistent, voice-first, proactive, and Cursor-guided.

**Complete all phases (one shot):** Mac: `adb-pixel-ppk-bypass.sh` → reboot → `pixel-sync-and-start.sh`. Pixel: `bash ~/JARVIS/scripts/pixel-complete-all-phases.sh` → `start-jarvis-pixel.sh --voice` → `pixel-test-phases-on-device.sh all`. Details: [PIXEL_PHASES_ONE_BY_ONE.md](./PIXEL_PHASES_ONE_BY_ONE.md#complete-all-phases-one-shot).

**See also:** [PIXEL_ONE_PLAN_BADASS_GOD_MODE.md](./PIXEL_ONE_PLAN_BADASS_GOD_MODE.md) (copy-paste steps), [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md) (status + next steps), [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md) (architecture reference).

---

## Phase 0: Foundation (already in repo)

**Goal:** Chat + local LLM on Pixel; one-command push/start from Mac.

| Deliverable | Where | Status |
|-------------|--------|--------|
| Termux + Termux:API (same source), sshd, push from Mac | [PIXEL_MAKE_IT_WORK.md](./PIXEL_MAKE_IT_WORK.md), [PIXEL_ONE_PLAN_BADASS_GOD_MODE.md](./PIXEL_ONE_PLAN_BADASS_GOD_MODE.md) Phase 1 | ✅ |
| JARVIS + neural-farm on device; gateway 18789, chat 18888 | `scripts/pixel-sync-and-start.sh`, `scripts/setup-jarvis-termux.sh` | ✅ |
| Local LLM (InferrLM) → adapter 8888 → gateway | neural-farm `inferrlm_adapter.py`, gateway config | ✅ |
| Browser chat and voice UI | `scripts/pixel-chat-server.js` (/, /voice), POST /speak | ✅ |

**Exit criteria:** From Mac: `cd ~/JARVIS && bash scripts/pixel-sync-and-start.sh` (user defaults to u0_a310). On Pixel: Chrome → http://127.0.0.1:18888. Chat works.

---

## Phase 1: Persistence — Bypass the Android sandbox

**Goal:** 24/7 uptime; no phantom-process kills or nightly resets.

| Deliverable | Action | Where |
|-------------|--------|--------|
| PPK bypass (persistent sync, max phantom procs, monitor off) | Run ADB script, then **reboot** Pixel | `scripts/adb-pixel-ppk-bypass.sh`, [SOVEREIGN_MOBILE_NEXUS §2.2](./SOVEREIGN_MOBILE_NEXUS.md#22-phantom-process-killer-ppk--full-bypass), [PIXEL_VOICE_RUNBOOK §1](./PIXEL_VOICE_RUNBOOK.md) |
| Swap file (e.g. 4GB) | One-time in Termux: dd, mkswap, swapon | [PIXEL_ONE_PLAN_BADASS_GOD_MODE.md](./PIXEL_ONE_PLAN_BADASS_GOD_MODE.md) Phase 2.1 |
| Wakelock (optional) | ADB: deviceidle whitelist +com.termux | [PIXEL_ONE_PLAN_BADASS_GOD_MODE.md](./PIXEL_ONE_PLAN_BADASS_GOD_MODE.md) Phase 2.4 |

**Exit criteria:** Stack stays up; no SIGKILL from lmkd after long run.

---

## Phase 2: Hardware substrate — Tensor G3 optimization

**Goal:** Reduce latency spikes and thermal throttling; prepare for GPU inference.

| Deliverable | Action | Where / notes |
|-------------|--------|----------------|
| **Core pinning** | Use `taskset` in Termux to pin agent threads to performance cores | **New:** Document in runbook. Prime (Cortex-X3) → LLM prefill; middle (A715) → Whisper/VAD/wake word; little (A510) → WebSockets, telemetry. |
| **Vulkan (Mali-G715)** | Create ICD profile pointing to `/vendor/lib64/hw/vulkan.mali.so`; use for Whisper/LLM builds | [PIXEL_VOICE_RUNBOOK §10](./PIXEL_VOICE_RUNBOOK.md), [EDGE_NATIVE_VOICE_NODE](./EDGE_NATIVE_VOICE_NODE.md); script or doc for ICD JSON. |
| **Thermal awareness** | Agent checks termux-api or sensors; postpones non-urgent work above 40°C | **New:** Optional logic in gateway or heartbeat; pixel-sensors already exposes battery. |

**Exit criteria:** (Optional) Measurable latency improvement; Vulkan env documented or scripted.

---

## Phase 3: Networking — Stable remote identity

**Goal:** Access gateway/chat from anywhere; no dependency on carrier NAT.

| Deliverable | Action | Where |
|-------------|--------|--------|
| Tailscale on Pixel | Install Tailscale (Termux pkg or Android app); join mesh | [SOVEREIGN_MOBILE_NEXUS §2.3](./SOVEREIGN_MOBILE_NEXUS.md#23-network-tailscale-optional), [PIXEL_VOICE_RUNBOOK §12](./PIXEL_VOICE_RUNBOOK.md) |
| Bind gateway/chat for LAN or Tailscale | Ensure 18789/18888 listen on 0.0.0.0 or Tailscale interface | Current stack; doc “access via Tailscale IP” in runbook. |
| Cursor → Pixel gateway from Mac | From Mac: use Tailscale IP of Pixel for gateway URL | Doc: JARVIS_MCP or handoff. |

**Exit criteria:** From laptop: open http://&lt;tailscale-ip&gt;:18888 and chat works.

---

## Phase 4: Cognitive architecture — Hybrid model routing

**Goal:** Right model for the task; local when possible, frontier when needed.

| Deliverable | Action | Where / notes |
|-------------|--------|----------------|
| On-device (Gemini Nano / InferrLM) | Already: adapter 8888, gateway uses local model for chat | neural-farm, gateway config |
| Claude (or other) for complex/agentic tasks | Configure openclaw/gateway to route by complexity or tool use | Gateway config, agent routing; **new:** document lane/model mapping in SOUL or config. |
| OpenRouter / low-cost for heartbeat | Optional: small model for periodic heartbeat checks | [Design: GPT-5 Nano / coordinator]; doc in HEARTBEAT or runbook. |
| Model routing config | Single place (e.g. openclaw.json or SOUL) for “when to use which model” | **New:** Add to SOUL_TEMPLATE or DEVELOPER_GUIDE. |

**Exit criteria:** Agent uses local LLM for simple chat; can invoke Claude (or other) for coding/planning when configured.

---

## Phase 5: Voice — Full-duplex cognitive audio loop

**Goal:** Continuous listen → wake word / VAD → STT → reason → TTS with human-like latency.

| Deliverable | Action | Where |
|-------------|--------|--------|
| **TTS FIFO** | `mkfifo ~/.tts_pipe`; termux-tts-speak reader loop | [PIXEL_ONE_PLAN_BADASS_GOD_MODE.md](./PIXEL_ONE_PLAN_BADASS_GOD_MODE.md) Phase 2.2, [PIXEL_VOICE_RUNBOOK](./PIXEL_VOICE_RUNBOOK.md) |
| **PulseAudio** | Bridge Android OpenSL ES; single sink for wake + VAD + STT | [PIXEL_VOICE_RUNBOOK](./PIXEL_VOICE_RUNBOOK.md), start-voice-node-pixel.sh |
| **OpenWakeWord (or equivalent)** | Run on middle cluster; trigger active processing on “Jarvis” | **New:** Doc in [WAKEWORD_TRAINING.md](./WAKEWORD_TRAINING.md); onnxruntime blocker for Termux noted in [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md). |
| **Silero VAD** | 30ms chunks; dynamic endpointing | Voice node already has VAD; tune silence_seconds in voice_node_config. |
| **Whisper (Vulkan)** | Quantized Whisper + Vulkan on Mali-G715 | `scripts/install-whisper-termux.sh`, [PIXEL_VOICE_RUNBOOK](./PIXEL_VOICE_RUNBOOK.md), [PIXEL_GOD_MODE.md](./PIXEL_GOD_MODE.md) |
| **Optimistic streaming** | Sentence-split TTS from stream; push to FIFO on period/question mark | Voice node streaming + TTS FIFO; already in place. |

**Exit criteria:** Voice node runs; wake word or manual trigger → STT → gateway → stream → TTS FIFO; sub-500ms target documented and tuned.

---

## Phase 6: Cursor-guided autonomy

**Goal:** Agent follows project rules and can drive Cursor from the Pixel.

| Deliverable | Action | Where / notes |
|-------------|--------|----------------|
| **cursor-agent skill** | Install and auth: OpenClaw ↔ Cursor workspace | Design: `openclaw skills install cursor-agent`, `openclaw onboard` (Cursor provider). **New:** Document in jarvis/TOOLS.md or skills README if we adopt. |
| **.cursorrules for mobile** | Sequential thinking, termux-api/ADB awareness, PLAN.md for multi-step, no hardcoded secrets, optional YOLO mode | **New:** Create `.cursorrules` template or section in CURSOR_SESSION_ONBOARDING / docs. |
| **SOUL.md specialist squad** | Orchestrator (Jarvis) + Developer (Friday) + Researcher (Shuri) + Sentry (Vision); mission_control.json workflow | [SOUL_TEMPLATE.md](./SOUL_TEMPLATE.md); expand with specialist roles and delegation pattern. |
| **Human-in-the-loop** | Irreversible actions (payments, delete, external email) require confirmation | Design: security guardrails; document in SOUL or gateway config. |

**Exit criteria:** Cursor agent skill (if used) linked; .cursorrules and SOUL.md define mobile-first behavior and specialists.

---

## Phase 7: Proactive intelligence — Heartbeat and memory

**Goal:** Agent doesn’t only react; it monitors and reports.

| Deliverable | Action | Where |
|-------------|--------|--------|
| **HEARTBEAT.md** | Periodic run (e.g. 30m, 2h, daily); agent reads instructions and reports (battery, calendar, maintenance) | [JARVIS_AUTONOMOUS_ON_PIXEL.md](./JARVIS_AUTONOMOUS_ON_PIXEL.md), cron in setup (plan-execute, heartbeat); design: rotating cadence. |
| **IDENTITY.md** | User–agent relationship: tone, name, vibe | Design; **new:** template or section in SOUL/identity docs. |
| **SOUL.md** | Core personality and logic hierarchy | [SOUL_TEMPLATE.md](./SOUL_TEMPLATE.md), voice system_prompt_file |
| **MEMORY.md** | Long-term facts (preferences, dates) | Design; **new:** template or integration with existing memory/archive. |
| **Episodic logs** | Daily markdown (e.g. memory/YYYY-MM-DD.md) with session summary and pending | Design; **new:** optional script or gateway hook. |

**Exit criteria:** Heartbeat runs on schedule; at least SOUL + HEARTBEAT (and optionally IDENTITY/MEMORY/episodic) in place.

---

## Phase 8: Actuation — Hands (ADB UI, sensors)

**Goal:** Agent can open apps, tap, type, and sense device state.

| Deliverable | Action | Where |
|-------------|--------|--------|
| **android-adb skill** | Launch app, uiautomator dump, parse bounds, input tap/type | Design: screen-tree approach. **Repo:** [skills/pixel-adb](./../skills/pixel-adb) or equivalent; [jarvis/TOOLS.md](./../jarvis/TOOLS.md). |
| **termux-api** | Battery, location, WiFi, clipboard, etc. | [skills/pixel-sensors](./../skills/pixel-sensors), [PIXEL_TROUBLESHOOTING](./PIXEL_TROUBLESHOOTING.md) (same-source Termux:API). |
| **Camera / screencap** | Visual context for tasks | [skills/pixel-camera](./../skills/pixel-camera); design: Sentry (Vision) role. |

**Exit criteria:** Agent can run adb shell am start, input tap, and use termux-battery-status / termux-location in skills.

---

## Phase 9: Security and operational resilience

**Goal:** Edge node is hardened and thermally sustainable.

| Deliverable | Action | Where |
|-------------|--------|--------|
| **Gateway bind 127.0.0.1** | Expose only via Tailscale or SSH tunnel; no public gateway | [SOVEREIGN_MOBILE_NEXUS](./SOVEREIGN_MOBILE_NEXUS.md), runbook |
| **Secrets** | No API keys in code; .env / env vars | .cursorrules / docs |
| **Human-in-the-loop** | Confirm payments, deletes, external sends | SOUL or gateway config |
| **Thermal / power** | Wakelock, swap, optional cooling (physical); agent backs off at 40°C | Phase 1 + Phase 2; [PIXEL_GOD_MODE.md](./PIXEL_GOD_MODE.md) |

**Exit criteria:** Security checklist documented; 24/7 run possible with swap + PPK bypass + optional cooling.

---

## Roadmap summary (order of execution)

| Phase | Name | Depends on | Key deliverables |
|-------|------|------------|------------------|
| 0 | Foundation | — | Chat + push + start (done) |
| 1 | Persistence | 0 | PPK bypass, swap, wakelock |
| 2 | Hardware substrate | 0 | Core pinning doc, Vulkan ICD, thermal awareness |
| 3 | Networking | 0 | Tailscale, stable IP access |
| 4 | Hybrid model routing | 0 | Config for local vs frontier; routing doc |
| 5 | Voice loop | 0, 1, 2 | FIFO, VAD, Whisper, wake word, optimistic TTS |
| 6 | Cursor autonomy | 0 | cursor-agent skill, .cursorrules, SOUL specialists |
| 7 | Proactive | 0, 1 | Heartbeat, IDENTITY/SOUL/MEMORY/episodic |
| 8 | Actuation | 0 | ADB skill, termux-api, camera |
| 9 | Security & resilience | 1, 3 | Bind local, HITL, thermal doc |

---

## Tests per phase

Each phase has automated checks so you can confirm exit criteria.

**On the Pixel (Termux)** — run after the stack is up:

```bash
bash ~/JARVIS/scripts/pixel-test-phases-on-device.sh [phase]
# phase: 0-9 or "all" (default: all). Exit 0 only if all requested phases pass.
```

**From the Mac** — ADB (USB or wireless) + SSH to Pixel:

```bash
cd ~/JARVIS
bash scripts/pixel-phase-tests.sh [phase] [pixel-ip]
# phase: 0-9 or "all". Uses ADB for Phase 1 (PPK/wakelock) and Phase 3 (Tailscale app); SSH for on-device checks.
```

| Phase | What’s tested (on-device) | What’s tested (Mac ADB) |
|-------|---------------------------|--------------------------|
| 0 | JARVIS dir, start script, ports 8889/18789/18888, chat UI responds | — |
| 1 | Swap file exists and active | max_phantom_processes, monitor off, wakelock whitelist |
| 2 | taskset, VK_ICD_FILENAMES (optional) | — |
| 3 | Tailscale (optional), 18789/18888 listening | Tailscale app installed |
| 4 | Adapter 8888, gateway POST /v1/chat/completions, .clawdbot/.env | — |
| 5 | TTS FIFO, PulseAudio, voice node script, Whisper (optional) | — |
| 6 | SOUL.md or SOUL_TEMPLATE.md, .cursorrules (optional) | — |
| 7 | Crontab has heartbeat/plan-execute, jarvis.cron, SOUL | — |
| 8 | termux-battery-status, pixel-sensors/diagnose script | — |
| 9 | Gateway reachable, swap file | — |

---

## Quick reference: existing scripts and docs

| Need | Script / doc |
|------|----------------|
| **Build (deps + optional push/test)** | `bash scripts/pixel-build-and-test.sh [push] [test] [pixel-ip]` |
| **Phase tests (on device)** | `scripts/pixel-test-phases-on-device.sh [0-9\|all]` |
| **Phase tests (from Mac)** | `bash scripts/pixel-phase-tests.sh [0-9\|all] [pixel-ip]` (user u0_a310; use `ADB_SERIAL=<id>` if multiple devices) |
| Push + setup + start from Mac | `scripts/pixel-sync-and-start.sh` |
| ADB PPK bypass | `scripts/adb-pixel-ppk-bypass.sh` |
| Start stack on Pixel | `scripts/start-jarvis-pixel.sh` |
| Start with voice | `scripts/start-jarvis-pixel.sh --voice` |
| One ordered plan (copy-paste) | [PIXEL_ONE_PLAN_BADASS_GOD_MODE.md](./PIXEL_ONE_PLAN_BADASS_GOD_MODE.md) |
| Voice runbook (ADB, Pulse, FIFO, Whisper) | [PIXEL_VOICE_RUNBOOK.md](./PIXEL_VOICE_RUNBOOK.md) |
| Architecture reference | [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md) |
| Status and next steps | [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md) |
