#!/usr/bin/env bash
# Run from your Mac/PC with the Pixel connected via USB (or wireless ADB).
# Applies full Phantom Process Killer bypass so JARVIS stack can run 24/7.
# After running, reboot the Pixel.
# See docs/PIXEL_VOICE_RUNBOOK.md §1, docs/SOVEREIGN_MOBILE_NEXUS.md §2.2

set -e
ADB_CMD="adb ${ADB_SERIAL:+ -s $ADB_SERIAL}"
echo "Checking for device..."
if ! $ADB_CMD devices 2>/dev/null | grep -q 'device$'; then
  echo "No device found. Connect the Pixel (USB or adb connect <ip>:5555) and try again."
  echo "Multiple devices? Set ADB_SERIAL=<id> (from 'adb devices')."
  exit 1
fi

echo "Applying full PPK bypass..."
$ADB_CMD shell "/system/bin/device_config set_sync_disabled_for_tests persistent"
$ADB_CMD shell "/system/bin/device_config put activity_manager max_phantom_processes 2147483647"
$ADB_CMD shell settings put global settings_enable_monitor_phantom_procs false

echo "Done. Reboot the Pixel for changes to take effect."
echo "Optional wakelock (run after reboot if desired):"
echo "  $ADB_CMD shell dumpsys deviceidle whitelist +com.termux"
