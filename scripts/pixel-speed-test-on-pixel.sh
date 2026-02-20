#!/usr/bin/env bash
# Run on the Pixel in Termux. Runs the LLM speed test and writes result to Download (so Mac can adb pull).
# Usage: bash ~/storage/downloads/pixel-speed-test-on-pixel.sh   or  bash ~/JARVIS/scripts/pixel-speed-test-on-pixel.sh
set -e
DOWNLOAD="${HOME}/storage/downloads"
[ ! -d "$DOWNLOAD" ] && DOWNLOAD="/storage/emulated/0/Download"
OUT="${1:-$DOWNLOAD/speed-test-result.txt}"
JARVIS_DIR="${JARVIS_DIR:-$HOME/JARVIS}"
mkdir -p "$(dirname "$OUT")"
cd "$JARVIS_DIR" && node scripts/pixel-llm-speed-test.js 2>&1 | tee "$OUT"
echo "" >> "$OUT"
echo "Done. From Mac: ./scripts/pixel-llm-speed-test-from-mac.sh pull" >> "$OUT"
