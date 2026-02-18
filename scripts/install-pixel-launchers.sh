#!/usr/bin/env bash
# Create ~/start-jarvis.sh and ~/start-chat.sh on the Pixel so you can run them
# without typing the full path. Run once in Termux after push (or if you get "no such file").
# Usage: bash ~/JARVIS/scripts/install-pixel-launchers.sh  OR  bash scripts/install-pixel-launchers.sh

export HOME="${HOME:-/data/data/com.termux/files/home}"
JARVIS_DIR="$HOME/JARVIS"
# If we're inside JARVIS/scripts/, find repo root
SCRIPT_DIR=""
[ -n "${BASH_SOURCE[0]}" ] && SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/pixel-chat-server.js" ]; then
  JARVIS_DIR="$(dirname "$SCRIPT_DIR")"
fi
[ ! -d "$JARVIS_DIR" ] && { echo "JARVIS not found at $JARVIS_DIR. Run setup or push first."; exit 1; }

echo "cd \"$JARVIS_DIR\" && bash scripts/start-jarvis-pixel.sh" > "$HOME/start-jarvis.sh"
echo "cd \"$JARVIS_DIR\" && bash scripts/start-pixel-chat-only.sh" > "$HOME/start-chat.sh"
chmod +x "$HOME/start-jarvis.sh" "$HOME/start-chat.sh"
echo "Created ~/start-jarvis.sh and ~/start-chat.sh"
echo "Run:  bash ~/start-jarvis.sh   or   bash ~/start-chat.sh"
