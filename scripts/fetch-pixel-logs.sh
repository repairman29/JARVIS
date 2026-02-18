#!/usr/bin/env bash
# From the Mac: trigger Termux to gather JARVIS logs, then pull the file.
# Prereq: Pixel connected (adb devices) and Termux has run termux-setup-storage.
# Usage: ./scripts/fetch-pixel-logs.sh [device-serial]
# Example: ./scripts/fetch-pixel-logs.sh 37201FDJG00FAQ

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEVICE="$1"
[ -z "$DEVICE" ] && DEVICE=$(adb devices | grep -E 'device$' | grep -v emulator | head -1 | awk '{print $1}')
[ -z "$DEVICE" ] && { echo "No device. Connect Pixel or pass serial: $0 37201FDJG00FAQ"; exit 1; }
ADB="adb -s $DEVICE"
OUT_LOCAL="/tmp/jarvis-pixel-logs.txt"

# Push the gather script to a place Termux can run it
GATHER="$SCRIPT_DIR/termux-gather-logs.sh"
$ADB push "$GATHER" /sdcard/Download/termux-gather-logs.sh 2>/dev/null || true

# Trigger Termux to run it (writes to /sdcard/Download/jarvis-logs.txt)
TERMUX_HOME="/data/data/com.termux/files/home"
$ADB shell am startservice -n com.termux/com.termux.app.RunCommandService \
  -e com.termux.RUN_COMMAND_PATH "$TERMUX_HOME/../usr/bin/bash" \
  -e com.termux.RUN_COMMAND_ARGUMENTS "-c,bash $TERMUX_HOME/storage/downloads/termux-gather-logs.sh 2>/dev/null || bash /sdcard/Download/termux-gather-logs.sh" \
  -e com.termux.RUN_COMMAND_WORKDIR "$TERMUX_HOME" 2>/dev/null || true

sleep 3
$ADB pull /sdcard/Download/jarvis-logs.txt "$OUT_LOCAL" 2>/dev/null || {
  echo "Pull failed. On the Pixel, in Termux run: bash ~/storage/downloads/termux-gather-logs.sh"
  echo "Then: adb pull /sdcard/Download/jarvis-logs.txt $OUT_LOCAL"
  exit 1
}
echo "=== JARVIS Pixel logs (from $OUT_LOCAL) ==="
cat "$OUT_LOCAL"
