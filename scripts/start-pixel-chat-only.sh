#!/usr/bin/env bash
# Start only the JARVIS chat server (port 18888) on the Pixel. Use when gateway/stack
# are already running but the chat server died or wasn't started.
# Run in Termux: bash ~/JARVIS/scripts/start-pixel-chat-only.sh  OR  bash /path/to/this/script

export HOME="${HOME:-/data/data/com.termux/files/home}"
PREFIX="$HOME"
SCRIPT_DIR=""
[ -n "${BASH_SOURCE[0]}" ] && SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/pixel-chat-server.js" ]; then
  JARVIS_DIR="$(dirname "$SCRIPT_DIR")"
else
  JARVIS_DIR="$HOME/JARVIS"
fi

[ ! -d "$JARVIS_DIR" ] && { echo "JARVIS not found at $JARVIS_DIR"; exit 1; }

pkill -f "pixel-chat-server" 2>/dev/null || true
sleep 1
cd "$JARVIS_DIR"
nohup node scripts/pixel-chat-server.js >> "$PREFIX/chat-server.log" 2>&1 &
sleep 1
curl -s -o /dev/null -w "Chat server: %{http_code}\n" http://127.0.0.1:18888/ 2>/dev/null || echo "Chat server starting (check ~/chat-server.log if 000)"
