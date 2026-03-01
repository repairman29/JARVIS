#!/usr/bin/env bash
# Launcher for ADB RunCommand: run setup from Download if tarballs present, then pixel-proot-bootstrap-and-start.sh.
# Push this to /sdcard/Download and run via Termux RunCommand with workdir = Termux home.
# Usage: bash /storage/emulated/0/Download/pixel-proot-adb-launcher.sh [--restart]

export HOME="${HOME:-/data/data/com.termux/files/home}"
DOWNLOAD="/storage/emulated/0/Download"
if [ -f "$DOWNLOAD/JARVIS.tar.gz" ] && [ -f "$DOWNLOAD/neural-farm.tar.gz" ] && [ -f "$DOWNLOAD/setup-jarvis-termux.sh" ]; then
  echo "[launcher] Running setup from Download..."
  bash "$DOWNLOAD/setup-jarvis-termux.sh" "$DOWNLOAD"
fi
if [ ! -d "$HOME/JARVIS" ]; then
  echo "JARVIS not found. Push from Mac: cd ~/JARVIS && bash scripts/push-jarvis-to-pixel.sh"
  exit 1
fi
bash "$HOME/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh" "$@"
