# JARVIS Voice Control Skill

Transform JARVIS into a hands-free, voice-controlled productivity system with natural speech interaction.

## Features

- **Wake Word Detection**: "Hey JARVIS" or custom wake phrases
- **Natural Language Processing**: Understand conversational commands
- **Voice Shortcuts**: Create custom voice triggers for workflows  
- **Accessibility Support**: Optimized for various speech patterns and needs
- **Cross-Platform**: Works on macOS, Linux, and Windows
- **Privacy-First**: Local speech processing with optional cloud enhancement

## Quick Setup

```bash
# Install skill
cp -r skills/voice-control ~/jarvis/skills/

# Start voice control
"JARVIS, start voice recognition"

# Create shortcuts  
"JARVIS, create voice shortcut: focus time runs focus mode"

# Train recognition
"JARVIS, train my wake word recognition"
```

## Example Commands

- "Hey JARVIS, launch Chrome and take a screenshot"
- "JARVIS, find my React project and set up coding workspace"  
- "JARVIS, what's 15% of 240 and convert 5 miles to kilometers?"
- "JARVIS, start my morning routine workflow"

Perfect for hands-free productivity, accessibility needs, and creating truly conversational computing experiences.

## Wake word (current state)

**"Hey JARVIS" wake-by-speech is not implemented yet.** The gateway runs in Node.js and has no microphone access. The skill’s `start_voice_recognition` uses *simulated* listening (no real audio). Real wake word would require an always-on client (browser, Electron, or native app) with mic access and wake-word/STT, then sending commands to the gateway. See **docs/JARVIS_VOICE.md** (§ Why can't we wake JARVIS with speech?).