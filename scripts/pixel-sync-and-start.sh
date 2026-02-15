#!/usr/bin/env bash
# One script: push JARVIS to the Pixel, then start the stack.
# Prereq: On the Pixel — Termux open, run "sshd", same Wi‑Fi as Mac. InferrLM app Server ON.
# In Termux run: whoami   and  passwd   (use that username if not jefe).
# Usage: cd ~/JARVIS && bash scripts/pixel-sync-and-start.sh [pixel-ip]
# Or: TERMUX_USER=u0_a310 bash scripts/pixel-sync-and-start.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-jefe}"
PORT="8022"

# IP
if [ -n "$1" ]; then
  PIXEL_IP="$1"
  echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
else
  PIXEL_IP=$(adb shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1)
  PIXEL_IP=$(echo "$PIXEL_IP" | tr -d '\r\n \t')
  [ -n "$PIXEL_IP" ] && echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
  [ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
  [ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"
fi

echo "Pixel: $PIXEL_IP (port $PORT, user $USER)"
if ! nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null; then
  echo ""
  echo ">>> SSH not reachable. On the Pixel: open Termux, run:  sshd"
  echo "    Same Wi‑Fi as this Mac. Then run this script again."
  echo ""
  exit 1
fi

echo "Pushing JARVIS (enter SSH password when asked)..."
bash "$SCRIPT_DIR/push-jarvis-to-pixel-ssh.sh" "$PIXEL_IP" || exit 1

echo ""
echo "Starting JARVIS stack on Pixel (enter password again if asked)..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -p "$PORT" "$USER@$PIXEL_IP" "bash -s" << 'REMOTE'
export HOME="${HOME:-/data/data/com.termux/files/home}"
JARVIS="${HOME}/JARVIS"
[ ! -d "$JARVIS" ] && JARVIS="/data/data/com.termux/files/home/JARVIS"
if [ ! -d "$JARVIS" ]; then
  echo "JARVIS not found at $JARVIS"
  exit 1
fi
bash "$JARVIS/scripts/start-jarvis-pixel.sh"
REMOTE

echo ""
echo "Done. On the Pixel open Chrome → http://127.0.0.1:18888"
