#!/usr/bin/env bash
# Run ON the Pixel (in Termux). Removes JARVIS one-time setup files and temp copies from Download
# so the Downloads folder stays clean. Safe to run after JARVIS is already installed and running.
#
# From Mac:  ssh -p 8022 u0_a310@<pixel-ip> 'bash -s' < scripts/pixel-cleanup-downloads.sh
# Or:       bash scripts/ssh-pixel.sh <pixel-ip>
#           then run: bash ~/JARVIS/scripts/pixel-cleanup-downloads.sh

set -e
DEST="${HOME}/storage/downloads"
[ ! -d "$DEST" ] && DEST="/storage/emulated/0/Download"
[ ! -d "$DEST" ] && { echo "Download folder not found."; exit 1; }

echo "=== Cleaning Pixel Download (JARVIS artifacts) ==="
echo "Target: $DEST"
echo ""

REMOVED=0
for name in \
  JARVIS.tar.gz \
  neural-farm.tar.gz \
  setup-jarvis-termux.sh \
  pixel-bootstrap-and-start.sh \
  pixel-proot-adb-launcher.sh \
  termux-copy-boot-log.sh \
  termux-gather-logs.sh \
  jarvis-logs.txt \
  speed-test-result.txt \
  jarvis-boot.log \
  gateway.log \
  litellm.log \
  plan-execute.log \
  heartbeat.log \
  ; do
  if [ -f "$DEST/$name" ]; then
    rm -f "$DEST/$name"
    echo "  removed: $name"
    REMOVED=$((REMOVED + 1))
  fi
done

# clawdbot.env in Download is often a one-time copy; only remove if you're sure
# Uncomment next 2 lines to also remove it:
# [ -f "$DEST/clawdbot.env" ] && rm -f "$DEST/clawdbot.env" && echo "  removed: clawdbot.env" && REMOVED=$((REMOVED + 1))

if [ "$REMOVED" -eq 0 ]; then
  echo "  (nothing to remove)"
else
  echo ""
  echo "Removed $REMOVED file(s)."
fi
echo "Done. JARVIS in ~/JARVIS and ~/neural-farm is unchanged."
