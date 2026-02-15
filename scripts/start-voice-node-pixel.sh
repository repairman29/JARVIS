#!/usr/bin/env bash
# Start the always-on voice node on the Pixel (Termux).
# Prerequisites: run docs/PIXEL_VOICE_RUNBOOK.md (PulseAudio, FIFO TTS, pip deps).
# JARVIS stack (gateway, chat) should already be running (start-jarvis-pixel.sh).
#
# Usage: bash ~/JARVIS/scripts/start-voice-node-pixel.sh

set -e
export HOME="${HOME:-/data/data/com.termux/files/home}"
PREFIX="${PREFIX:-$HOME}"
[ -n "${BASH_SOURCE[0]}" ] && SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)" || SCRIPT_DIR=""
JARVIS_DIR="${JARVIS_DIR:-$HOME/JARVIS}"
[ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/voice_node.py" ] && JARVIS_DIR="$(dirname "$SCRIPT_DIR")"
[ ! -d "$JARVIS_DIR" ] && JARVIS_DIR="$HOME/JARVIS"

# 1) PulseAudio (if not already running)
if ! pulseaudio --check 2>/dev/null; then
  echo "Starting PulseAudio..."
  pulseaudio --start --load="module-native-protocol-tcp auth-ip-acl=127.0.0.1" --exit-idle-time=-1
  sleep 1
fi
# OpenSL ES source for Android mic (Termux)
pactl load-module module-sles-source 2>/dev/null || true

# 2) TTS FIFO: ensure pipe exists and start reader loop (termux-tts-speak)
TTS_FIFO="${TTS_FIFO:-$HOME/.tts_pipe}"
if [ ! -p "$TTS_FIFO" ]; then
  mkfifo "$TTS_FIFO" 2>/dev/null || true
fi
if [ -p "$TTS_FIFO" ]; then
  export TTS_FIFO
  # Start TTS reader in background: open FIFO, read lines, speak each; reopen on EOF
  ( while true; do while IFS= read -r line; do [ -n "$line" ] && termux-tts-speak "$line" 2>/dev/null; done < "$TTS_FIFO" 2>/dev/null; done ) &
  echo "TTS FIFO reader started ($TTS_FIFO)."
else
  echo "Warning: TTS FIFO not created ($TTS_FIFO). TTS will be disabled."
fi

# 3) Gateway check (Clawd/JARVIS stack should be up)
G=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/ 2>/dev/null || echo "000")
if [ "$G" != "200" ]; then
  echo "Warning: Gateway (18789) returned $G. Start the stack first: bash ~/JARVIS/scripts/start-jarvis-pixel.sh"
  echo "Continuing anyway..."
fi

# 4) Run voice node (Python). On Termux, openwakeword often fails (no onnxruntime); use manual trigger.
[ -n "$PREFIX" ] && export VOICE_NODE_MANUAL_TRIGGER=1
cd "$JARVIS_DIR"
export TTS_FIFO
echo "JARVIS voice node: press Enter to speak, then say your command (e.g. 'Hey JARVIS, what time is it?')."
exec python3 scripts/voice_node.py
