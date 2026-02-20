#!/data/data/com.termux/files/usr/bin/bash
# Run on the Pixel inside Termux (or via Termux RunCommand from ADB).
# If tarballs exist in DOWNLOAD (arg or auto-detect), run setup then start. Else just start.
# Usage: bash pixel-bootstrap-and-start.sh [path-to-download-dir]
# Example: bash /storage/emulated/0/Download/pixel-bootstrap-and-start.sh /storage/emulated/0/Download

set -e
export HOME="${HOME:-/data/data/com.termux/files/home}"
PREFIX="$HOME"
JARVIS="$PREFIX/JARVIS"

DOWNLOAD=""
if [ -n "$1" ] && [ -d "$1" ] && [ -f "$1/JARVIS.tar.gz" ] && [ -f "$1/neural-farm.tar.gz" ]; then
  DOWNLOAD="$1"
fi
if [ -z "$DOWNLOAD" ]; then
  for try in "$PREFIX/storage/downloads" "/storage/emulated/0/Download" "/sdcard/Download"; do
    [ -n "$try" ] && [ -f "$try/JARVIS.tar.gz" ] && [ -f "$try/neural-farm.tar.gz" ] && DOWNLOAD="$try" && break
  done
fi

if [ -n "$DOWNLOAD" ] && [ -f "$DOWNLOAD/setup-jarvis-termux.sh" ]; then
  echo "[bootstrap] Extracting from $DOWNLOAD and setting up..."
  bash "$DOWNLOAD/setup-jarvis-termux.sh" "$DOWNLOAD"
fi

if [ ! -d "$JARVIS" ]; then
  echo "JARVIS not found at $JARVIS. Run setup from Download first (see docs)."
  exit 1
fi

echo "[bootstrap] Starting JARVIS stack..."
bash "$JARVIS/scripts/start-jarvis-pixel.sh"
