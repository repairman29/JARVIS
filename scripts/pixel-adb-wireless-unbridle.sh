#!/usr/bin/env bash
# Full wireless unbridle: pair + connect + verify + PPK bypass. Run from your Mac Terminal.
# Android 16: TWO PORTS (they are different):
#   - PAIR port: from "Pair device with pairing code" dialog only → adb pair <ip>:<pair_port> <code>
#   - CONNECT port: from main "Wireless debugging" screen → adb connect <ip>:<connect_port>
# Using the connect port in adb pair causes "protocol fault".
#
# Usage:
#   cd ~/JARVIS && bash scripts/pixel-adb-wireless-unbridle.sh
#   cd ~/JARVIS && bash scripts/pixel-adb-wireless-unbridle.sh 100.75.3.115 36775 446966 39457

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
DEFAULT_IP="192.168.86.209"

echo "=== ADB version (need 35+ for Android 16) ==="
adb version
echo ""

echo "=== Resetting ADB server ==="
adb kill-server 2>/dev/null || true
sleep 1
adb start-server
echo ""

# Parse args: [ip] [pair_port] [code] [connect_port]
if [ -n "$1" ] && [ -n "$2" ] && [ -n "$3" ] && [ -n "$4" ]; then
  IP="$1"
  PAIR_PORT="$2"
  CODE="$3"
  CONNECT_PORT="$4"
else
  [ -z "$IP" ] && IP="${PIXEL_IP:-$(cat "$CACHE_FILE" 2>/dev/null | tr -d '\r\n \t')}"
  [ -z "$IP" ] && IP="$DEFAULT_IP"
  echo "On Pixel: open Wireless debugging → tap 'Pair device with pairing code'."
  echo -n "Enter PAIR port from that dialog (e.g. 36775): "
  read -r PAIR_PORT
  echo -n "Enter 6-digit pairing code: "
  read -r CODE
  echo "On Pixel: main Wireless debugging screen shows 'IP address & port'."
  echo -n "Enter CONNECT port from main screen (e.g. 39457): "
  read -r CONNECT_PORT
fi

PAIR_ADDR="$IP:$PAIR_PORT"
CONNECT_ADDR="$IP:$CONNECT_PORT"

echo ""
echo "=== Pairing $PAIR_ADDR with code $CODE ==="
if ! adb pair "$PAIR_ADDR" "$CODE"; then
  echo "Pair failed. If you see 'protocol fault', use the port from 'Pair device with pairing code' dialog (not the main screen)."
  echo "If on Tailscale, try same Wi-Fi (192.168.x.x) to test. See docs/PIXEL_UNBRIDLE.md"
  exit 1
fi

echo ""
echo "=== Connecting to $CONNECT_ADDR (optional; device may already appear after pair) ==="
adb connect "$CONNECT_ADDR" 2>/dev/null || true
sleep 2
adb devices -l
echo ""

# After pairing, the device may show as CONNECT_ADDR or as a guid (e.g. adb-XXX._adb-tls-connect._tcp). Use whichever is present.
SERIAL=""
if adb devices 2>/dev/null | grep -q "$CONNECT_ADDR.*device"; then
  SERIAL="$CONNECT_ADDR"
fi
if [ -z "$SERIAL" ]; then
  SERIAL=$(adb devices 2>/dev/null | grep -E '\tdevice$' | head -1 | awk '{print $1}')
fi
if [ -z "$SERIAL" ]; then
  echo "No device found. If connect was 'Connection refused', try the CONNECT port from the main Wireless debugging screen (not the pair dialog)."
  echo "If you see 'Operation not permitted', allow adb in macOS Firewall."
  exit 1
fi
echo "Using device: $SERIAL"
echo ""

echo "=== Applying PPK bypass (unbridle) ==="
ADB_SERIAL="$SERIAL" bash "$SCRIPT_DIR/adb-pixel-ppk-bypass.sh"
echo ""
echo "=== Quick verify (full check after reboot) ==="
ADB_SERIAL="$SERIAL" bash "$SCRIPT_DIR/verify-pixel-unbridle.sh" || true

echo ""
echo "=== Optional: deviceidle whitelist (keep Termux out of doze) ==="
ADB_SERIAL="$SERIAL" adb shell dumpsys deviceidle whitelist +com.termux || true

echo ""
echo "=== Done. Reboot the Pixel. ==="
echo "After reboot: get new CONNECT port from Wireless debugging, then run:"
echo "  adb connect $IP:<new_port>"
echo "  ADB_SERIAL=$IP:<new_port> bash $SCRIPT_DIR/verify-pixel-unbridle.sh"
echo ""
echo "On the Pixel: Termux → Battery → Unrestricted; Wake lock ON."
