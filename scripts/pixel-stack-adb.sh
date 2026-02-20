#!/usr/bin/env bash
# Push JARVIS to the Pixel via ADB and start the stack (extract + start-jarvis-pixel.sh).
# Uses ADB only: push to Download, then run Termux bootstrap via RunCommand (if permission granted).
#
# One-time: get ADB connected
#   Option A (USB): Connect Pixel via USB, enable USB debugging. Run: adb devices
#   Option B (WiFi): On Pixel enable Wireless debugging, pair then connect from Mac:
#     adb pair <pixel-ip>:<pair_port>   # use pairing code once
#     adb connect <pixel-ip>:5555
#
# Usage: ./scripts/pixel-stack-adb.sh [pixel-ip]
# Pixel IP: from .pixel-ip, or 10.1.10.50, or pass as first arg.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
PIXEL_IP="${1:-$(cat "$CACHE_FILE" 2>/dev/null | tr -d '\r\n \t')}"
PIXEL_IP="${PIXEL_IP:-10.1.10.50}"
ADB_PORT="${2:-5555}"

echo "=== Pixel stack via ADB ($PIXEL_IP) ==="

# 1. Ensure device
if ! adb devices | grep -qE 'device$'; then
  echo "No device. Trying adb connect $PIXEL_IP:$ADB_PORT..."
  adb connect "${PIXEL_IP}:${ADB_PORT}" 2>/dev/null || true
  sleep 2
fi
if ! adb devices | grep -qE 'device$'; then
  echo ""
  echo ">>> ADB not connected. Do one of:"
  echo "  1. Connect Pixel via USB, enable USB debugging, run: adb devices"
  echo "  2. On Pixel: Settings → Developer options → Wireless debugging ON."
  echo "     Then on Mac: adb connect $PIXEL_IP:$ADB_PORT"
  echo "     (If first time: Wireless debugging → Pair device with pairing code, then connect.)"
  echo ""
  exit 1
fi
echo "Device: $(adb devices | grep -E 'device$' | head -1)"

# 2. Push (reuse push-jarvis-to-pixel.sh logic but we already have device)
FARM_ROOT="${NEURAL_FARM_DIR:-$(dirname "$JARVIS_ROOT")/neural-farm}"
OUT="/tmp/jarvis-pixel-push"
DOWNLOAD="/sdcard/Download"
mkdir -p "$OUT"
rm -f "$OUT/JARVIS.tar.gz" "$OUT/neural-farm.tar.gz"

echo "Creating tarballs..."
JARVIS_PARENT="$(dirname "$JARVIS_ROOT")"
JARVIS_NAME="$(basename "$JARVIS_ROOT")"
(export COPYFILE_DISABLE=1; cd "$JARVIS_PARENT" && tar -czf "$OUT/JARVIS.tar.gz" \
  --exclude=node_modules --exclude=.next --exclude=.git \
  "$JARVIS_NAME") 2>/dev/null
[ -d "$FARM_ROOT" ] && FARM_PARENT="$(dirname "$FARM_ROOT")" && FARM_NAME="$(basename "$FARM_ROOT")" && \
  (export COPYFILE_DISABLE=1; cd "$FARM_PARENT" && tar -czf "$OUT/neural-farm.tar.gz" --exclude=.venv --exclude=.git "$FARM_NAME") 2>/dev/null
cp "$SCRIPT_DIR/setup-jarvis-termux.sh" "$OUT/"
[ -f "$HOME/.clawdbot/.env" ] && cp "$HOME/.clawdbot/.env" "$OUT/clawdbot.env"
cp "$SCRIPT_DIR/pixel-bootstrap-and-start.sh" "$OUT/"

echo "Pushing to Pixel Download..."
adb push "$OUT/JARVIS.tar.gz" "$DOWNLOAD/" 2>/dev/null || { echo "Push failed. Run termux-setup-storage in Termux."; exit 1; }
adb push "$OUT/neural-farm.tar.gz" "$DOWNLOAD/" 2>/dev/null || true
adb push "$OUT/setup-jarvis-termux.sh" "$DOWNLOAD/" 2>/dev/null || true
adb push "$OUT/pixel-bootstrap-and-start.sh" "$DOWNLOAD/" 2>/dev/null || true
[ -f "$OUT/clawdbot.env" ] && adb push "$OUT/clawdbot.env" "$DOWNLOAD/" 2>/dev/null || true

# 3. Run bootstrap + start in Termux (needs RUN_COMMAND permission in Termux)
TERMUX_HOME="/data/data/com.termux/files/home"
BOOTSTRAP="/storage/emulated/0/Download/pixel-bootstrap-and-start.sh"
DOWNLOAD_DIR="/storage/emulated/0/Download"
echo "Starting stack in Termux (extract + start)..."
if adb shell am startservice -n com.termux/com.termux.app.RunCommandService \
  -e com.termux.RUN_COMMAND_PATH "$TERMUX_HOME/../usr/bin/bash" \
  -e com.termux.RUN_COMMAND_ARGUMENTS "-c,bash $BOOTSTRAP $DOWNLOAD_DIR" \
  -e com.termux.RUN_COMMAND_WORKDIR "$TERMUX_HOME" 2>/dev/null; then
  echo "Started. Check the Termux app on the Pixel for progress."
else
  echo ""
  echo ">>> RunCommand failed (Termux may need RUN_COMMAND permission)."
  echo "On the Pixel, open Termux and run:"
  echo "  bash /storage/emulated/0/Download/pixel-bootstrap-and-start.sh /storage/emulated/0/Download"
  echo "Or: bash ~/storage/downloads/setup-jarvis-termux.sh && bash ~/JARVIS/scripts/start-jarvis-pixel.sh"
  echo ""
fi
echo "Done."
