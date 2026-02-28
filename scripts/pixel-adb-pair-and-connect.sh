#!/usr/bin/env bash
# Pair wireless ADB to Pixel, then connect and verify.
# Two ports (different): PAIR port = "Pair device with pairing code" dialog. CONNECT port = main Wireless debugging screen.
#
# Usage:
#   bash scripts/pixel-adb-pair-and-connect.sh [ip] [pair_port] [code] [connect_port]
#   bash scripts/pixel-adb-pair-and-connect.sh ip:pair_port code [connect_port]
# If you omit args, the script prompts for them.
#
# Example (same WiFi):  bash scripts/pixel-adb-pair-and-connect.sh 192.168.86.209 40111 123456 40113
# Example (Tailscale): bash scripts/pixel-adb-pair-and-connect.sh 100.75.3.115 36775 446966 39457
# Example (same WiFi): bash scripts/pixel-adb-pair-and-connect.sh 192.168.86.209 39093 642641 39093
#                      (pair port from "Pair device with pairing code" dialog; connect port from main screen, may be same)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
DEFAULT_IP="192.168.86.209"

# Parse args: [ip] [pair_port] [code] [connect_port]  OR  ip:pair_port code [connect_port]
if [ -n "$1" ]; then
  if [[ "$1" == *:* ]]; then
    # ip:pair_port code [connect_port]
    IP="${1%%:*}"
    PAIR_PORT="${1##*:}"
    CODE="${2:?Usage: $0 ip:pair_port code [connect_port]}"
    CONNECT_PORT="${3:-}"
  else
    IP="$1"
    PAIR_PORT="${2:-}"
    CODE="${3:-}"
    CONNECT_PORT="${4:-}"
  fi
else
  IP=""
  PAIR_PORT=""
  CODE=""
  CONNECT_PORT=""
fi

[ -z "$IP" ] && IP="${PIXEL_IP:-$(cat "$CACHE_FILE" 2>/dev/null | tr -d '\r\n \t')}"
[ -z "$IP" ] && IP="$DEFAULT_IP"

if [ -z "$PAIR_PORT" ]; then
  echo "On Pixel: open Wireless debugging → tap 'Pair device with pairing code'."
  echo -n "Enter PAIR port from that dialog (e.g. 40111): "
  read -r PAIR_PORT
fi
if [ -z "$CODE" ]; then
  echo -n "Enter the 6-digit pairing code: "
  read -r CODE
fi
if [ -z "$CONNECT_PORT" ]; then
  echo "On Pixel: main Wireless debugging screen shows 'IP address & port'."
  echo -n "Enter CONNECT port from main screen (e.g. 40113): "
  read -r CONNECT_PORT
fi

PAIR_ADDR="$IP:$PAIR_PORT"
CONNECT_ADDR="$IP:$CONNECT_PORT"

echo "Pairing $PAIR_ADDR with code $CODE ..."
adb pair "$PAIR_ADDR" "$CODE" || true
echo "Connecting to $CONNECT_ADDR ..."
adb connect "$CONNECT_ADDR"
sleep 2
adb devices -l
echo ""
echo "Running verify-pixel-unbridle.sh ..."
ADB_SERIAL="$CONNECT_ADDR" bash "$SCRIPT_DIR/verify-pixel-unbridle.sh"
