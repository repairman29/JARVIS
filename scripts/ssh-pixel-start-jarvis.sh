#!/usr/bin/env bash
# From the Mac: SSH into the Pixel and install launchers + start the JARVIS stack.
# You will be prompted once for your Termux SSH password.
# Usage: ./scripts/ssh-pixel-start-jarvis.sh [pixel-ip]

USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/../.pixel-ip"

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

echo "Connecting to $PIXEL_IP (enter SSH password when prompted)..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -p "$PORT" "$USER@$PIXEL_IP" \
  'cd ~/JARVIS 2>/dev/null || { echo "JARVIS not found. Push from Mac first: ./scripts/push-jarvis-to-pixel-ssh.sh"; exit 1; }
   [ -f scripts/install-pixel-launchers.sh ] && bash scripts/install-pixel-launchers.sh
   if [ -x ~/start-jarvis.sh ]; then bash ~/start-jarvis.sh; else bash scripts/start-jarvis-pixel.sh; fi
   echo ""
   echo "On the Pixel: open Chrome → http://127.0.0.1:18888 or /voice"
   echo "If Proxy/Gateway show down: open InferrLM app, turn Server ON (8889), then run again."'
