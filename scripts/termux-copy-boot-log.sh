#!/usr/bin/env bash
# Run on Pixel via Termux RunCommandService. Copies JARVIS logs to Download so Mac can adb pull.
DEST="$HOME/storage/downloads"
[ ! -d "$DEST" ] && DEST="/storage/emulated/0/Download"
for f in jarvis-boot.log gateway.log litellm.log plan-execute.log heartbeat.log; do
  [ -f "$HOME/$f" ] && cp "$HOME/$f" "$DEST/$f" 2>/dev/null || true
done
# Proot logs may be in /root on device when stack runs in proot; Termux home is still where we write boot log
[ -f "$HOME/jarvis-boot.log" ] && cp "$HOME/jarvis-boot.log" "$DEST/jarvis-boot.log" 2>/dev/null || true
