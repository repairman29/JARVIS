#!/usr/bin/env bash
# Push JARVIS + neural-farm + setup to Pixel Download via ADB (USB), then show exact command to run in Termux.
# Use this when termux-setup-storage didn't work and "bash ~/storage/downloads/..." gives "no such file".
#
# Prereq: Pixel connected by USB, USB debugging on. Run from Mac: ./scripts/adb-push-and-setup-command.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FARM_ROOT="${NEURAL_FARM_DIR:-$(dirname "$JARVIS_ROOT")/neural-farm}"
OUT="/tmp/jarvis-pixel-push"
DOWNLOAD="/sdcard/Download"

echo "=== Push JARVIS to Pixel (ADB USB) and get Termux command ==="
adb devices | grep -qE 'device$' || { echo "No device. Connect Pixel via USB and enable USB debugging."; exit 1; }

mkdir -p "$OUT"
rm -f "$OUT/JARVIS.tar.gz" "$OUT/neural-farm.tar.gz"
echo "Creating tarballs..."
JARVIS_PARENT="$(dirname "$JARVIS_ROOT")"
JARVIS_NAME="$(basename "$JARVIS_ROOT")"
(export COPYFILE_DISABLE=1; cd "$JARVIS_PARENT" && tar -czf "$OUT/JARVIS.tar.gz" \
  --exclude=node_modules --exclude=.next --exclude=.git "$JARVIS_NAME")
[ -d "$FARM_ROOT" ] || { echo "Neural-farm not found at $FARM_ROOT"; exit 1; }
FARM_PARENT="$(dirname "$FARM_ROOT")"
FARM_NAME="$(basename "$FARM_ROOT")"
(export COPYFILE_DISABLE=1; cd "$FARM_PARENT" && tar -czf "$OUT/neural-farm.tar.gz" \
  --exclude=.venv --exclude=.git "$FARM_NAME")
cp "$SCRIPT_DIR/setup-jarvis-termux.sh" "$OUT/"
[ -f "$HOME/.clawdbot/.env" ] && cp "$HOME/.clawdbot/.env" "$OUT/clawdbot.env"

echo "Pushing to $DOWNLOAD on device..."
adb push "$OUT/JARVIS.tar.gz" "$DOWNLOAD/"
adb push "$OUT/neural-farm.tar.gz" "$DOWNLOAD/"
adb push "$OUT/setup-jarvis-termux.sh" "$DOWNLOAD/"
[ -f "$OUT/clawdbot.env" ] && adb push "$OUT/clawdbot.env" "$DOWNLOAD/"

echo ""
echo "--- In Termux on the Pixel, do this ---"
echo "1. If you haven't: Android Settings > Apps > Termux > Permissions > turn ON 'Files and media' (or Storage)."
echo "2. In Termux, run this single line (copy/paste):"
echo ""
echo "bash /storage/emulated/0/Download/setup-jarvis-termux.sh /storage/emulated/0/Download"
echo ""
echo "That tells the script exactly where the tarballs are, so it doesn't need termux-setup-storage."
echo "Done."
