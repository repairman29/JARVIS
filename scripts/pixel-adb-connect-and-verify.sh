#!/usr/bin/env bash
# Connect to Pixel via Wireless debugging and run verify-pixel-unbridle.
# On the Pixel: Settings → Developer options → Wireless debugging — note the "IP address & port" (e.g. 192.168.86.209:40113).
#
# Usage: bash scripts/pixel-adb-connect-and-verify.sh [ip:port]
#   If you omit ip:port, uses 192.168.86.209 and prompts for port, or reads from .pixel-ip and PIXEL_ADB_PORT.
#
# Example: bash scripts/pixel-adb-connect-and-verify.sh 192.168.86.209:40113

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
DEFAULT_IP="192.168.86.209"

if [ -n "$1" ]; then
  ADDR="$1"
else
  IP="${PIXEL_IP:-$(cat "$CACHE_FILE" 2>/dev/null | tr -d '\r\n \t')}"
  [ -z "$IP" ] && IP="$DEFAULT_IP"
  PORT="${PIXEL_ADB_PORT:-}"
  if [ -z "$PORT" ]; then
    echo "Pixel Wireless debugging: enter the port shown on the phone (e.g. 40113):"
    read -r PORT
  fi
  [ -z "$PORT" ] && { echo "No port. Run: $0 $IP:<port>"; exit 1; }
  ADDR="$IP:$PORT"
fi

echo "Connecting to $ADDR ..."
adb connect "$ADDR" 2>&1
sleep 2
if ! adb devices 2>/dev/null | grep -q "$ADDR"; then
  echo "Connection failed. Check IP and port on the Pixel (Wireless debugging screen)."
  exit 1
fi
echo "Running verify-pixel-unbridle.sh ..."
ADB_SERIAL="$ADDR" bash "$SCRIPT_DIR/verify-pixel-unbridle.sh"
