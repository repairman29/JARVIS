# JARVIS voice in/out

Hands-free and natural interaction: speak to JARVIS and hear replies.

---

## Web UI — Talk to JARVIS

In the **JARVIS UI** (jarvis-ui):

- **🔊 Voice** — Turn on "Voice" so JARVIS speaks each reply (browser TTS). Click **Speak** on any assistant message to hear it again.
- **Conversation mode** — After JARVIS speaks, the mic turns on so you can reply by voice (browser Speech API). Like talking to JARVIS in Iron Man.
- **🎤 Mic** — Use the microphone button in the composer to dictate your message when voice is supported (Chrome/Edge recommended).

No API key required; uses the browser’s Speech Synthesis and Speech Recognition APIs.

---

## CLI / skills — wake word and voice_command

The **voice-control** skill provides wake word detection and voice commands when the gateway has the skill installed:

- **Wake word** — e.g. "Hey JARVIS"; configurable via `JARVIS_VOICE_WAKE_WORD`.
- **voice_command** — Send a voice command (with or without wake word for testing).
- **start_voice_recognition** — Continuous listening with wake word.

See **skills/voice-control/SKILL.md** (or **jarvis/skills/voice-control/SKILL.md**) and **jarvis/TOOLS.md** → Voice control.

---

## Optional: ElevenLabs or custom TTS

For higher-quality or custom voices, you can integrate ElevenLabs or another TTS API in the UI or gateway and switch from browser SpeechSynthesis to that provider.
