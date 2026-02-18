#!/usr/bin/env bash
# Push JARVIS + neural-farm + setup script to Pixel over WiFi and run setup in Termux.
# Prereqs: Pixel on same Wi-Fi, Termux installed (from F-Droid), Wireless debugging enabled.
# One-time: adb connect <pixel-ip>:5555 (or USB once: adb tcpip 5555 then connect).
#
# Usage: ./scripts/push-jarvis-to-pixel.sh [pixel-ip]
# Default pixel-ip: 10.1.10.50

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FARM_ROOT="${NEURAL_FARM_DIR:-$(dirname "$JARVIS_ROOT")/neural-farm}"
PIXEL_IP="${1:-10.1.10.50}"
ADB_PORT="${2:-5555}"
OUT="/tmp/jarvis-pixel-push"
DOWNLOAD="/sdcard/Download"

echo "=== Push JARVIS to Pixel ($PIXEL_IP) over WiFi ==="
echo "JARVIS: $JARVIS_ROOT"
echo "Farm:   $FARM_ROOT"
echo ""

# 1. Prepare tarballs (exclude heavy dirs)
mkdir -p "$OUT"
rm -f "$OUT/JARVIS.tar.gz" "$OUT/neural-farm.tar.gz"

echo "Creating JARVIS tarball..."
JARVIS_PARENT="$(dirname "$JARVIS_ROOT")"
JARVIS_NAME="$(basename "$JARVIS_ROOT")"
(export COPYFILE_DISABLE=1; cd "$JARVIS_PARENT" && tar -czf "$OUT/JARVIS.tar.gz" \
  --exclude=node_modules --exclude=.next --exclude=.git \
  "$JARVIS_NAME")

echo "Creating neural-farm tarball..."
[ -d "$FARM_ROOT" ] || { echo "Neural-farm not found at $FARM_ROOT"; exit 1; }
FARM_PARENT="$(dirname "$FARM_ROOT")"
FARM_NAME="$(basename "$FARM_ROOT")"
(export COPYFILE_DISABLE=1; cd "$FARM_PARENT" && tar -czf "$OUT/neural-farm.tar.gz" \
  --exclude=.venv --exclude=.git \
  "$FARM_NAME")

# 2. Copy setup script and optional env
cp "$SCRIPT_DIR/setup-jarvis-termux.sh" "$OUT/"
[ -f "$HOME/.clawdbot/.env" ] && cp "$HOME/.clawdbot/.env" "$OUT/clawdbot.env" && echo "Including .clawdbot/.env"

# 3. ADB: connect over WiFi if no device, else use USB
if ! adb devices | grep -qE 'device$'; then
  echo "Connecting to $PIXEL_IP:$ADB_PORT over WiFi..."
  adb connect "${PIXEL_IP}:${ADB_PORT}" 2>/dev/null || true
fi
adb devices | grep -qE 'device$' || { echo "No device. Connect Pixel via USB or enable Wireless debugging and: adb connect $PIXEL_IP:$ADB_PORT"; exit 1; }
echo "Using device: $(adb devices | grep -E 'device$' | head -1)"

echo "Pushing to $DOWNLOAD on Pixel..."
adb push "$OUT/JARVIS.tar.gz" "$DOWNLOAD/" 2>/dev/null || { echo "Push failed. Is Termux installed? Run: termux-setup-storage (in Termux) so Download is accessible."; exit 1; }
adb push "$OUT/neural-farm.tar.gz" "$DOWNLOAD/"
adb push "$OUT/setup-jarvis-termux.sh" "$DOWNLOAD/"
[ -f "$OUT/clawdbot.env" ] && adb push "$OUT/clawdbot.env" "$DOWNLOAD/"

# 4. Run setup in Termux (Termux:Run intent; path = Termux home + storage/downloads)
TERMUX_HOME="/data/data/com.termux/files/home"
SETUP_PATH="$TERMUX_HOME/storage/downloads/setup-jarvis-termux.sh"
echo "Triggering setup in Termux..."
if adb shell am startservice -n com.termux/com.termux.app.RunCommandService \
  -e com.termux.RUN_COMMAND_PATH "$TERMUX_HOME/../usr/bin/bash" \
  -e com.termux.RUN_COMMAND_ARGUMENTS "-c,bash $SETUP_PATH" \
  -e com.termux.RUN_COMMAND_WORKDIR "$TERMUX_HOME" 2>/dev/null; then
  echo "Setup started in Termux. Check the Termux app for progress."
else
  echo ""
  echo "Auto-start not available. On the Pixel, open Termux and run ONE of these:"
  echo ""
  echo "  Option A (if termux-setup-storage worked and ~/storage/downloads exists):"
  echo "    bash ~/storage/downloads/setup-jarvis-termux.sh"
  echo ""
  echo "  Option B (grant Termux 'Files and media' in Android Settings > Apps > Termux > Permissions first):"
  echo "    bash /storage/emulated/0/Download/setup-jarvis-termux.sh /storage/emulated/0/Download"
  echo ""
  echo "  Option C (after push via SSH so files are in home): bash ~/setup-jarvis-termux.sh"
fi

echo ""
echo "Done. On Pixel: enable Wake lock in Termux settings and keep plugged in for 24/7."
