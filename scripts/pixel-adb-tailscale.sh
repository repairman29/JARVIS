#!/usr/bin/env bash
# Connect to Pixel over Tailscale and run verify-pixel-unbridle.
# On the Pixel: Wireless debugging shows IP:port (e.g. 100.75.3.115:40167). Pairing code if needed.
#
# Usage: bash scripts/pixel-adb-tailscale.sh [ip:port]
#   Example: bash scripts/pixel-adb-tailscale.sh 100.75.3.115:40167
#   If omitted, uses 100.75.3.115:39457 (update this default if your port changes).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADDR="${1:-100.75.3.115:39457}"

echo "Connecting to $ADDR ..."
adb connect "$ADDR" 2>&1
sleep 2
if ! adb devices 2>/dev/null | grep -q "$ADDR"; then
  echo "Connection failed. Try pairing first: adb pair $ADDR <6-digit-code>"
  echo "Get code from Pixel: Wireless debugging → Pair device with pairing code"
  exit 1
fi
echo "Running verify-pixel-unbridle.sh ..."
ADB_SERIAL="$ADDR" bash "$SCRIPT_DIR/verify-pixel-unbridle.sh"
