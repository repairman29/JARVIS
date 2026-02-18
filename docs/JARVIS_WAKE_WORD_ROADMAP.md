# JARVIS Wake Word — Roadmap to "Hey JARVIS"

**Goal:** User says **"Hey JARVIS"** (or custom phrase) from anywhere on the machine; a small always-on listener detects it, captures the following command via speech-to-text, sends it to JARVIS, and (optionally) speaks the reply. No need to open the UI or click anything.

**Why we don’t have it yet:** See [JARVIS_VOICE.md § Why can't we wake JARVIS with speech?](./JARVIS_VOICE.md). The gateway has no microphone; the voice-control skill’s wake word is simulated. We need a **client** that has mic access and real wake-word/STT.

---

## Success criteria

| Criterion | Definition of done |
|-----------|--------------------|
| **Wake** | User says "Hey JARVIS" (or configured phrase); listener detects it with no button press. |
| **Command** | Listener captures the next utterance (speech-to-text) and sends it to JARVIS as one message. |
| **Reply** | User gets JARVIS’s response; optionally spoken (TTS) so it’s hands-free. |
| **Always on** | Listener runs at login (or "open at login") so it’s available without opening the browser. |
| **Privacy** | No audio sent off-device until after wake word (or user-configured). Prefer on-device wake-word detection. |

---

## Approach comparison

Three viable ways to build the listener. Pick one for POC, then iterate.

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **A. Browser (PWA / minimal window)** | A small browser window (or PWA) runs in the background. Uses **Web Speech API** `SpeechRecognition` in continuous mode; scan transcript for "Hey JARVIS", then send the rest to the chat API. | No new runtime; reuses existing UI/chat contract; fast to prototype. | Browser must stay open; continuous recognition may stop when tab loses focus (browser-dependent); battery use. |
| **B. Native macOS app (Swift)** | Small menu-bar or dock app. Uses **Apple Speech framework** (e.g. SFSpeechRecognizer) or **AVFoundation** for audio; optional **on-device** wake word (e.g. keyword spotting) then system STT. POST transcript to `localhost` gateway or Edge. | True always-on; good battery with system APIs; fits "JARVIS instead of Siri" on Mac. | macOS only (first); requires Xcode and Swift (or SwiftPM) and possibly notarization for distribution. |
| **C. Electron or Tauri** | Desktop app (JS/TS or Rust) with a tiny window or tray icon. Can use **Web Speech API** (same as A) or embed **Picovoice Porcupine** (or similar) for on-device wake word, then Web Speech or system STT for the command. | One codebase for Mac/Windows/Linux; Porcupine gives low-power wake word. | App size and maintenance; need to ship and update a desktop app. |

**Recommendation for POC:** Start with **A (browser)** or **B (native macOS)**.

- **A** is fastest to validate end-to-end (wake phrase in transcript → POST to chat → optional TTS). If you’re okay with "JARVIS UI tab open in background," it can ship as a first version.
- **B** is best for "JARVIS instead of Siri" on macOS Tahoe: a small native app that runs at login, uses system speech, and talks only to your gateway/Edge.

**Chosen for POC:** **B — Native macOS (Swift).** See Decisions log and "Approach B: Native macOS — implementation notes" below.

---

## Approach B: Native macOS — implementation notes

Use this section when building the Phase 0 POC with Swift.

### Where to live

- **Option 1:** New repo (e.g. `repairman29/jarvis-wake-mac`) so it can be built and notarized independently; link from this repo’s README or docs.
- **Done:** Native app lives in **`apps/jarvis-wake-mac/`** in this repo. See [apps/jarvis-wake-mac/README.md](../apps/jarvis-wake-mac/README.md). Build with Xcode (add sources to a new macOS App project, or run `xcodegen` in that folder).

### Stack (POC)

| Piece | Technology |
|-------|------------|
| **App type** | Menu bar app (no dock icon) or minimal dock app. SwiftUI or AppKit. |
| **Speech recognition** | **Speech framework:** `SFSpeechRecognizer`, `SFSpeechAudioBufferRecognitionRequest`. Request `on-device` if available (macOS 13+) for privacy. **Burst mode:** mic on only in short windows; scan transcript for wake phrase. |
| **Wake phrase** | POC: substring match in transcript (e.g. "hey jarvis", "jarvis"). **Burst mode (implemented):** listen 2.5 s, mic off 2 s, repeat; orange mic indicator only during listen + command. Later: **Porcupine** (or similar) for on-device keyword spotting so full STT runs only after wake. |
| **Audio input** | **AVFoundation:** `AVAudioEngine` → `installTap(on:bufferSize:format:block:)` to feed `AVAudioPCMBuffer` into `SFSpeechAudioBufferRecognitionRequest`. Engine started/stopped per burst and for command capture. |
| **Send to JARVIS** | `URLSession` POST to gateway (e.g. `http://127.0.0.1:18789/v1/chat/completions` or your chat endpoint) or Edge `POST /` with body `{ "message": "<transcript>", "session_id": "wake-word" }`. Same contract as jarvis-ui; add `Authorization: Bearer <token>` if required. |
| **TTS (reply)** | **Option A:** `NSSpeechSynthesizer` (Swift). **Option B:** `Process()` run `say "<reply text>"` (simplest). |
| **Permissions** | **Microphone:** Add `NSMicrophoneUsageDescription` in Info.plist. **Speech recognition:** `NSSpeechRecognitionUsageDescription`; user must enable in System Settings → Privacy & Security. |

### POC flow (B) — burst mode

1. App launches; requests speech + mic authorization.
2. **Burst cycle:** Mic on for 2.5 s → run `SFSpeechRecognizer` on that window → mic off for 2 s → repeat. Orange mic indicator only during the 2.5 s listen and during command capture.
3. When transcript for a burst contains wake phrase ("hey jarvis" / "jarvis"): if there is text after it in the same burst, submit that as the command; else start **command capture** (mic on for up to 10 s, single recognition task).
4. When command capture ends: POST command to gateway/Edge; read streaming or final JSON response.
5. Speak reply via `NSSpeechSynthesizer` or `say`.
6. After command (or if no wake in burst), schedule next burst (idle 2 s then listen 2.5 s again).
7. (Optional) Show last exchange in menu bar dropdown or a small window.

### Config (POC)

- **Gateway URL:** Default `http://127.0.0.1:18789` (or from `~/.jarvis/wake.conf` / UserDefaults). Edge URL optional (e.g. `https://<project>.supabase.co/functions/v1/jarvis`).
- **Token:** If using Edge or protected gateway, read from keychain or `~/.jarvis/wake.conf` (do not ship defaults; user sets once).

### Phase 0 checklist (B)

- [x] Xcode project or Swift Package: menu bar app, mic + speech usage descriptions.
- [x] Audio: `AVAudioEngine` tap → `SFSpeechAudioBufferRecognitionRequest`; **burst mode:** listen 2.5 s, idle 2 s, repeat (no continuous hot mic).
- [x] Wake: substring match "hey jarvis" / "jarvis" in transcript; extract command (rest of phrase or next 10 s capture).
- [x] HTTP: POST command to gateway or Edge; parse reply.
- [x] TTS: `say` or `NSSpeechSynthesizer` for reply.
- [x] Document in this repo: README in [apps/jarvis-wake-mac/](../apps/jarvis-wake-mac/README.md) (contract, settings, run at login). Link from [JARVIS_INSTEAD_OF_SIRI_MACOS.md](./JARVIS_INSTEAD_OF_SIRI_MACOS.md).

---

## Phase 0: Discovery / POC (2–4 weeks)

**Objective:** Prove one path: wake phrase → STT → JARVIS → (optional) TTS.

### Tasks

| # | Task | Owner | Notes |
|---|------|--------|--------|
| 0.1 | **Choose approach** | — | ✅ **B (native macOS)**. See Decisions log and "Approach B: Native macOS — implementation notes" above. |
| 0.2 | **POC: Wake detection** | — | For A: Web Speech continuous, substring match "Hey JARVIS" in `result.transcript`. For B: SFSpeechRecognizer or keyword spotter. For C: Porcupine or Web Speech. |
| 0.3 | **POC: Capture command** | — | After wake: start new recognition for 5–15 s (or until silence); get final transcript. |
| 0.4 | **POC: Send to JARVIS** | — | POST transcript to gateway or Edge chat API (same contract as jarvis-ui). Use existing session or a dedicated `wake-word` session_id. |
| 0.5 | **POC: Reply** | — | Display reply in minimal UI; optionally TTS (browser `speechSynthesis` or macOS `say`). |
| 0.6 | **Document contract** | — | How the client calls the gateway/Edge (URL, body, auth). Add to GATEWAY_IMPLEMENTER or a short "Wake word client contract" section. |

### Exit criteria

- [ ] User can say "Hey JARVIS, what time is it?" and get a spoken (or displayed) answer without opening the main JARVIS UI.
- [ ] One approach (A, B, or C) is chosen and documented for Phase 1.

---

## Phase 1: Minimal viable wake (MVP) (3–6 weeks)

**Objective:** Ship one platform (e.g. macOS) with always-on listener and clear enable/disable.

### Tasks

| # | Task | Owner | Notes |
|---|------|--------|--------|
| 1.1 | **Stable wake + STT** | — | Harden POC: reduce false wake, handle background noise, timeout and retry. **Done (partial):** WakeWordEngine prefers "hey jarvis" over "jarvis"; when matching "jarvis" alone, requires minimum transcript length (6 chars) to reduce false wakes. |
| 1.2 | **Run at login** | — | **Browser:** "Open JARVIS Wake at login" (e.g. Shortcuts or Login Items opening a dedicated URL). **Native:** LaunchAgent or "Open at Login" in app. **Electron/Tauri:** Open at Login. |
| 1.3 | **Settings** | — | Enable/disable wake word; optional custom phrase (if engine supports); optional TTS on/off. Persist in `~/.jarvis/` or app config. |
| 1.4 | **Gateway/Edge contract** | — | Finalize: POST to `/v1/chat/completions` or Edge `POST /` with `message` + `session_id` (e.g. `wake-word`). Use same auth as UI (token or none for local). |
| 1.5 | **Docs and runbook** | — | How to install, run, and troubleshoot the wake-word client. Link from [JARVIS_INSTEAD_OF_SIRI_MACOS.md](./JARVIS_INSTEAD_OF_SIRI_MACOS.md). |

### Exit criteria

- [ ] Listener runs at login on macOS (or chosen platform).
- [ ] User can disable Siri voice and use "Hey JARVIS" as primary voice trigger.
- [ ] One clear doc: "How to use JARVIS wake word."

---

## Phase 2: Production quality (4–8 weeks)

**Objective:** Battery-friendly, privacy-preserving, reliable.

### Tasks

| # | Task | Owner | Notes |
|---|------|--------|--------|
| 2.1 | **On-device wake word (optional)** | — | **Current:** Burst mode (2.5 s listen, 2 s off) + substring match in transcript — mic indicator not always on. **Upgrade:** Integrate **Picovoice Porcupine** (or similar) for true on-device keyword spotting: very low-power listen for "Hey JARVIS" only; start full STT only after wake. Would allow longer or continuous listen windows without full recognition until wake. |
| 2.2 | **Privacy** | — | No audio uploaded until after wake word (or document when it is). Option: "Local only" mode (gateway on localhost, no Edge). |
| 2.3 | **Battery and performance** | — | Measure CPU and battery impact; optimize (e.g. lower sample rate when idle, back off after long silence). |
| 2.4 | **Errors and reconnection** | — | If gateway/Edge is down, show a minimal status (e.g. "JARVIS unavailable") and retry or prompt user to start gateway. |
| 2.5 | **Accessibility** | — | Optional visual feedback ("JARVIS listening"), and respect system accessibility settings where applicable. |

### Exit criteria

- [ ] Wake word path is acceptable for daily use (battery, privacy, reliability).
- [ ] Documented in RUNBOOK and JARVIS_INSTEAD_OF_SIRI_MACOS.

---

## Phase 3: Multi-platform and polish (ongoing)

**Objective:** Windows and Linux; optional multi-turn from wake.

### Tasks

| # | Task | Owner | Notes |
|---|------|--------|--------|
| 3.1 | **Windows** | — | Same contract; client can be Electron/Tauri or a Windows-specific listener (e.g. Windows Speech SDK). |
| 3.2 | **Linux** | — | Same contract; client can be Electron/Tauri or Linux STT (e.g. Vosk, Whisper.cpp, or pipe to browser). |
| 3.3 | **Multi-turn from wake (optional)** | — | After first reply, keep session open for one or two follow-ups (e.g. "Hey JARVIS, what’s the weather?" → "Hey JARVIS, and tomorrow?") with same session_id. |
| 3.4 | **Custom wake phrase** | — | Allow "Computer", "JARVIS", or user-defined phrase where the engine supports it (e.g. Porcupine custom keyword). |

---

## Technical touchpoints (existing)

| Component | Use in wake-word client |
|-----------|--------------------------|
| **Gateway** | Chat completions endpoint (e.g. `POST /v1/chat/completions` or equivalent). Same as jarvis-ui. |
| **Edge** | Optional: `POST /` with `message`, `session_id`; auth via `JARVIS_AUTH_TOKEN` if cloud. |
| **voice_command tool** | Gateway skill; client can send transcript as if it were a voice command (or just send as user message; model will use tools). |
| **voice-control skill** | Existing tools (`voice_command`, `start_voice_recognition`, etc.) stay as-is; real listening happens in the new client. |
| **TTS** | Gateway can use `say` (macOS) for reply; or client plays reply via browser/system TTS. |

---

## Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-04 | **POC approach: B (native macOS)** | User chose B. Best for "JARVIS instead of Siri" on macOS Tahoe; always-on, system speech, run at login. |
| 2026-02-04 | **Burst mode for wake** | Mic on only in 2.5 s bursts, then 2 s off, to avoid permanent orange mic indicator. Wake phrase detected via substring in each burst transcript; after wake, single 10 s command capture then back to burst cycle. |
| 2026-02-04 | **Porcupine as future option** | For true wake-word detection (and possibly always-on listen with minimal CPU), Phase 2 can add Picovoice Porcupine for on-device "Hey JARVIS" keyword spotting; STT would start only after Porcupine fires. |
| (TBD) | **Session model** | Dedicated `session_id` for wake-word (e.g. `wake-word`) vs. reuse user’s main session. Affects context (e.g. "and tomorrow?"). |
| (TBD) | **Auth for local** | Local gateway: token optional. Edge: use same token as UI or separate wake-word token. |

---

## References

| Doc | Purpose |
|-----|---------|
| [JARVIS_VOICE.md](./JARVIS_VOICE.md) | Why wake word isn’t there yet; what’s needed. |
| [JARVIS_INSTEAD_OF_SIRI_MACOS.md](./JARVIS_INSTEAD_OF_SIRI_MACOS.md) | User guide: JARVIS as primary voice on macOS (today: UI + shortcut; after MVP: add wake word). |
| [GATEWAY_IMPLEMENTER.md](./GATEWAY_IMPLEMENTER.md) | Gateway contract; add wake-word client contract when stable. |
| [JARVIS_MASTER_ROADMAP.md](./JARVIS_MASTER_ROADMAP.md) | Track summary; wake word is part of "Multimodal: voice polish" / next wave. |

---

**Next step:** Implement **Phase 0 with Approach B** (native macOS): menu bar app, Speech + AVFoundation, wake phrase in transcript → POST to gateway/Edge → TTS reply. See "Approach B: Native macOS — implementation notes" and Phase 0 checklist (B).
