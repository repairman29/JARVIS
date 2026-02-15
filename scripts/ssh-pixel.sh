#!/usr/bin/env bash
# Open an interactive SSH shell on the Pixel (Termux). Stays connected until you exit.
# Same IP logic as ssh-pixel-logs.sh (ADB → cache → default).
# Usage: ./scripts/ssh-pixel.sh [pixel-ip]
# Password: use the one you set with passwd in Termux. If it has "!", type: yourpass\!

USER="jefe"
PORT="8022"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/../.pixel-ip"

if [ -n "$1" ]; then
  PIXEL_IP="$1"
  echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
  echo "Connecting to $PIXEL_IP ..."
else
  PIXEL_IP=$(adb shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1)
  PIXEL_IP=$(echo "$PIXEL_IP" | tr -d '\r\n \t')
  if [ -n "$PIXEL_IP" ]; then
    echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
    echo "Connecting to $PIXEL_IP (from ADB) ..."
  elif [ -f "$CACHE_FILE" ]; then
    PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
    echo "Connecting to $PIXEL_IP (cached) ..."
  else
    PIXEL_IP="10.1.10.50"
    echo "Connecting to $PIXEL_IP (default) ..."
  fi
fi

nc -z "$PIXEL_IP" "$PORT" 2>/dev/null & pid=$!
for _ in 1 2 3 4 5; do kill -0 $pid 2>/dev/null || break; sleep 1; done
kill $pid 2>/dev/null
wait $pid 2>/dev/null
if [ $? -ne 0 ]; then
  echo "Cannot reach $PIXEL_IP:$PORT. In Termux run: sshd"
  echo "Or pass IP: $0 <pixel-ip>"
  exit 1
fi

exec ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -p "$PORT" "$USER@$PIXEL_IP"
