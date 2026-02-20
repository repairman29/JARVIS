#!/usr/bin/env bash
# Run the Pixel LLM speed test on the Pixel (via SSH or ADB fallback).
# Usage: ./scripts/pixel-llm-speed-test-from-mac.sh [pixel-ip]   or   ./scripts/pixel-llm-speed-test-from-mac.sh pull
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
JARVIS_DIR="${JARVIS_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
ADB_DEVICE="${ADB_SERIAL:-192.168.86.209:40113}"

# Pull results (after you ran the test on the Pixel)
if [ "${1:-}" = "pull" ]; then
  TMP="$JARVIS_DIR/.speed-test-result.txt"
  if adb -s "$ADB_DEVICE" pull /storage/emulated/0/Download/speed-test-result.txt "$TMP" 2>/dev/null || \
     adb -s "$ADB_DEVICE" pull /sdcard/Download/speed-test-result.txt "$TMP" 2>/dev/null; then
    cat "$TMP"
    rm -f "$TMP"
  else
    echo "No result file found. On the Pixel, open Termux and run:"
    echo "  bash ~/JARVIS/scripts/pixel-speed-test-on-pixel.sh"
    echo "Then run this script with 'pull' again."
    exit 1
  fi
  exit 0
fi

PIXEL_IP="${1:-${JARVIS_PIXEL_IP}}"
if [ -z "$PIXEL_IP" ] && [ -f "$JARVIS_DIR/.pixel-ip" ]; then
  PIXEL_IP=$(cat "$JARVIS_DIR/.pixel-ip")
fi
PIXEL_IP="${PIXEL_IP:-192.168.86.209}"
SSH_USER="${PIXEL_SSH_USER:-u0_a310}"
SSH_PORT="${PIXEL_SSH_PORT:-8022}"

echo "Running speed test on Pixel at $PIXEL_IP..."
if ssh -o ConnectTimeout=8 -o BatchMode=yes -p "$SSH_PORT" "$SSH_USER@$PIXEL_IP" "cd ~/JARVIS && node scripts/pixel-llm-speed-test.js" 2>/dev/null; then
  exit 0
fi

# SSH failed: push runner and tell user to run in Termux, or try once with password prompt
if ssh -o ConnectTimeout=5 -p "$SSH_PORT" "$SSH_USER@$PIXEL_IP" "cd ~/JARVIS && node scripts/pixel-llm-speed-test.js" 2>/dev/null; then
  exit 0
fi

echo "SSH not available (port $SSH_PORT refused or no key). Using ADB."
adb -s "$ADB_DEVICE" push "$SCRIPT_DIR/pixel-speed-test-on-pixel.sh" /storage/emulated/0/Download/ 2>/dev/null || \
  adb -s "$ADB_DEVICE" push "$SCRIPT_DIR/pixel-speed-test-on-pixel.sh" /sdcard/Download/ 2>/dev/null || true
echo ""
echo "On the Pixel: open Termux and run:"
echo "  bash ~/storage/downloads/pixel-speed-test-on-pixel.sh"
echo "  (or: cd ~/JARVIS && node scripts/pixel-llm-speed-test.js)"
echo ""
echo "Then on the Mac, fetch results:"
echo "  ./scripts/pixel-llm-speed-test-from-mac.sh pull"
echo ""
echo "To use SSH next time: in Termux run  pkg install openssh  and  sshd  (and allow network in Termux)."
