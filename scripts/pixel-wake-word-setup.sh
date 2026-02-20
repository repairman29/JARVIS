#!/bin/bash
# On the Pixel (Termux): try to enable true wake word for voice_node.py.
# 1) Try pkg install python-onnxruntime; 2) If available, ensure openwakeword and unset manual trigger.
# See docs/PIXEL_WAKE_WORD_OPTIONS.md.

set -e
JARVIS="${JARVIS:-$HOME/JARVIS}"
CONFIG="$HOME/.jarvis/voice_node.yaml"

echo "=== Pixel wake word setup ==="

# 1) Try Termux package (optional; may fail on some setups)
if command -v pkg >/dev/null 2>&1; then
  if pkg list-installed 2>/dev/null | grep -q python-onnxruntime; then
    echo "python-onnxruntime already installed."
  else
    echo "Attempting: pkg install python-onnxruntime"
    if pkg install -y python-onnxruntime 2>/dev/null; then
      echo "Installed python-onnxruntime."
    else
      echo "pkg install python-onnxruntime failed or not available. Use manual trigger or browser /voice (see PIXEL_WAKE_WORD_OPTIONS.md)."
    fi
  fi
fi

# 2) Check if Python can load onnxruntime and openwakeword
echo "Checking Python: onnxruntime + openwakeword..."
if python3 -c "
import sys
try:
  import onnxruntime
  import openwakeword
  sys.exit(0)
except Exception as e:
  print(e, file=sys.stderr)
  sys.exit(1)
" 2>/dev/null; then
  echo "onnxruntime + openwakeword OK. Voice node can use wake word (do not set VOICE_NODE_MANUAL_TRIGGER)."
  NEED_MANUAL="0"
else
  echo "onnxruntime or openwakeword not available. Use VOICE_NODE_MANUAL_TRIGGER=1 or browser http://127.0.0.1:18888/voice (Listen for Hey JARVIS)."
  NEED_MANUAL="1"
fi

# 3) Ensure config dir exists and optionally write a hint
mkdir -p "$(dirname "$CONFIG")"
if [ ! -f "$CONFIG" ]; then
  echo "# Voice node config (see voice_node_config.example.yaml)" > "$CONFIG"
  echo "gateway_url: http://127.0.0.1:18789" >> "$CONFIG"
  echo "tts_fifo: $HOME/.tts_pipe" >> "$CONFIG"
  echo "wake_phrase: \"Hey JARVIS\"" >> "$CONFIG"
  echo "Created $CONFIG"
fi

echo ""
echo "Run voice node:"
if [ "$NEED_MANUAL" = "1" ]; then
  echo "  VOICE_NODE_MANUAL_TRIGGER=1 python3 $JARVIS/scripts/voice_node.py"
  echo "  Or use browser: http://127.0.0.1:18888/voice (enable Listen for Hey JARVIS)"
else
  echo "  unset VOICE_NODE_MANUAL_TRIGGER && python3 $JARVIS/scripts/voice_node.py"
fi
echo "See docs/PIXEL_WAKE_WORD_OPTIONS.md for Porcupine and custom phrases."
