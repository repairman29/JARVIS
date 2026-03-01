#!/usr/bin/env bash
# Wait for Pixel SSH, then sync JARVIS and start the stack (includes LiteLLM install with ANDROID_API_LEVEL fix).
# Usage: cd ~/JARVIS && bash scripts/pixel-wait-then-sync-and-start.sh [pixel-ip]
# On the Pixel: open Termux, run "sshd", same Wi-Fi as Mac. This script will connect when ready.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"

# IP
if [ -n "$1" ]; then
  PIXEL_IP="$1"
else
  [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
  [ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"
fi

echo "Pixel: $PIXEL_IP (port $PORT)"
echo "Waiting for SSH (open Termux on Pixel, run: sshd)..."
while ! nc -z -w 3 "$PIXEL_IP" "$PORT" 2>/dev/null; do
  printf "."
  sleep 5
done
echo " SSH up."

bash "$SCRIPT_DIR/pixel-sync-and-start.sh" "$PIXEL_IP"
