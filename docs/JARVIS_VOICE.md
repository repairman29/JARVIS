# JARVIS voice in/out

Hands-free and natural interaction: speak to JARVIS and hear replies.

**Use JARVIS instead of Siri on macOS (including Tahoe 26.x):** See **[JARVIS_INSTEAD_OF_SIRI_MACOS.md](./JARVIS_INSTEAD_OF_SIRI_MACOS.md)** — disable Siri voice triggers, run JARVIS at login, use the Web UI with Voice + conversation mode, and optional keyboard shortcut.

---

## Web UI — Talk to JARVIS

In the **JARVIS UI** (jarvis-ui):

- **🔊 Voice** — Turn on "Voice" so JARVIS speaks each reply (browser TTS). Click **Speak** on any assistant message to hear it again.
- **Conversation mode** — After JARVIS speaks, the mic turns on so you can reply by voice (browser Speech API). Like talking to JARVIS in Iron Man.
- **🎤 Mic** — Use the microphone button in the composer to dictate your message when voice is supported (Chrome/Edge recommended).

No API key required; uses the browser’s Speech Synthesis and Speech Recognition APIs.

---

## Why can't we wake JARVIS with speech? ("Hey JARVIS")

**Short answer:** The gateway runs in **Node.js** and never sees your microphone. The **voice-control** skill’s wake word is **simulated** (no real audio or speech recognition), so nothing is actually listening for "Hey JARVIS".

**What exists today:**

- **voice_command** — You can send a *text* command that pretends to be voice (for testing or from another client).
- **start_voice_recognition** — Starts a timer that *simulates* listening (e.g. random mock commands), but does **not** capture or analyze real microphone input.
- **TTS (JARVIS speaking)** — Real: gateway uses macOS `say`, Linux espeak/festival, or Windows PowerShell. So JARVIS *can* speak; it just doesn’t *hear* a wake word.

**What would be needed for real "Hey JARVIS" wake-by-speech:**

1. **Something with a microphone** that runs in the background (the gateway has no mic access):
   - A **small always-on client**: e.g. Electron app, or a **browser window** (Web Speech API), or a **native macOS app** (AVFoundation / Speech framework).
2. **Wake-word detection** in that client:
   - **Option A:** Web Speech API (browser) — continuous recognition, look for "Hey JARVIS" in transcripts (battery and privacy vary).
   - **Option B:** Local wake-word engine (e.g. **Picovoice Porcupine**, **Snowboy**, or system APIs) — low power, on-device, then stream or send the *following* command to the gateway.
3. **Send the command to JARVIS** — After wake word, either stream audio to the gateway (gateway would need an audio→text pipeline) or do speech-to-text in the client and send the text to the gateway (e.g. `voice_command` or chat API).

So: **we can’t wake JARVIS with speech yet because no component has both microphone access and real wake-word/STT.** The skill’s tools and UX are in place; the missing piece is that always-on listener client (or gateway audio pipeline). See **skills/voice-control/index.js** (`simulateVoiceRecognition`, "Simulate continuous listening") for the current stub.

**Roadmap to deliver it:** **[JARVIS_WAKE_WORD_ROADMAP.md](./JARVIS_WAKE_WORD_ROADMAP.md)** — approach comparison (browser vs native macOS vs Electron), phased plan (POC → MVP → production → multi-platform), and technical touchpoints.

---

## CLI / skills — wake word and voice_command

The **voice-control** skill provides *tools* for wake word and voice commands when the gateway has the skill installed. **Wake-word listening is not implemented** (see above); the tools are ready for when a client sends commands.

- **Wake word** — e.g. "Hey JARVIS"; configurable via `JARVIS_VOICE_WAKE_WORD`.
- **voice_command** — Send a voice command as text (from UI, shortcut, or future wake-word client).
- **start_voice_recognition** — Currently starts *simulated* listening (no real mic). A future client could call this and then use its own mic + wake word and post results to the gateway.

See **skills/voice-control/SKILL.md** (or **jarvis/skills/voice-control/SKILL.md**) and **jarvis/TOOLS.md** → Voice control.

---

## Optional: ElevenLabs or custom TTS

For higher-quality or custom voices, you can integrate ElevenLabs or another TTS API in the UI or gateway and switch from browser SpeechSynthesis to that provider.

---

## Voice polish (backlog)

**Done:** Push-to-talk — In the composer, **hold** the mic button for ~250ms then **release** to send the transcript (click still toggles listen on/off). Release outside the button (mouse leave) also sends. See **apps/jarvis-ui/components/Composer.tsx**.

When prioritizing more voice UX, consider:

| Item | Notes |
|------|--------|
| ~~**Push-to-talk**~~ | ✅ Done. Hold mic ~250ms then release to send; click still toggles. |
| **Wake word refinement** | voice-control skill already has wake word; tune sensitivity or add alternate phrases. |
| **TTS quality / fallback** | Browser SpeechSynthesis varies; document recommended browser or add ElevenLabs/custom TTS toggle. |
| **Reduced motion / a11y** | Respect `prefers-reduced-motion` for auto-play of TTS; ensure "JARVIS is listening" is announced for screen readers. |
| **Offline / no mic** | Graceful fallback when Speech Recognition is unavailable (e.g. Firefox, or no mic). |

Ref: **docs/JARVIS_MASTER_ROADMAP.md** §3 item 6 (Multimodal: voice polish).
