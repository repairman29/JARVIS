#!/usr/bin/env bash
# One-time hardening on the Pixel (Termux): swap file + print ADB commands for PPK bypass and wakelock.
# Run on device: bash ~/JARVIS/scripts/pixel-setup-hardening.sh
# See docs/PIXEL_VOICE_RUNBOOK.md and docs/SOVEREIGN_MOBILE_NEXUS.md

set -e
export HOME="${HOME:-/data/data/com.termux/files/home}"
SWAPFILE="${SWAPFILE:-$HOME/swapfile}"
SWAP_GB="${SWAP_GB:-4}"

echo "=== JARVIS Pixel hardening ==="
echo ""

# 1) Swap file (reduce OOM kills)
if [ -f "$SWAPFILE" ]; then
  if swapon --show 2>/dev/null | grep -q "$SWAPFILE"; then
    echo "Swap already active: $SWAPFILE"
  else
    echo "Enabling existing swap file..."
    swapon "$SWAPFILE" 2>/dev/null || echo "  (swapon failed; run as needed: swapon $SWAPFILE)"
  fi
else
  echo "Creating ${SWAP_GB}GB swap file at $SWAPFILE (one-time, may take a minute)..."
  count=$((SWAP_GB * 1024 * 1024))
  dd if=/dev/zero of="$SWAPFILE" bs=1024 count="$count" 2>/dev/null || true
  chmod 600 "$SWAPFILE" 2>/dev/null || true
  mkswap "$SWAPFILE" 2>/dev/null || true
  swapon "$SWAPFILE" 2>/dev/null || echo "  (swapon failed)"
  echo "  Done. To re-enable after reboot: swapon $SWAPFILE"
fi
echo ""

# 2) ADB commands (run from a computer with device connected)
echo "--- Run these from your computer (ADB connected) ---"
echo "Full PPK bypass (then reboot the Pixel):"
echo "  adb shell \"/system/bin/device_config set_sync_disabled_for_tests persistent\""
echo "  adb shell \"/system/bin/device_config put activity_manager max_phantom_processes 2147483647\""
echo "  adb shell settings put global settings_enable_monitor_phantom_procs false"
echo ""
echo "Optional wakelock (so CPU doesn't deep-sleep):"
echo "  adb shell dumpsys deviceidle whitelist +com.termux"
echo ""
echo "Or run the script: bash ~/JARVIS/scripts/adb-pixel-ppk-bypass.sh"
echo ""
