#!/usr/bin/env bash
# From Mac: verify that "Android crap that kills JARVIS" is actually off.
# Run: bash scripts/verify-pixel-unbridle.sh
# Or with a specific device: ADB_SERIAL=192.168.86.209:40113 bash scripts/verify-pixel-unbridle.sh
#
# If any check fails, re-run the step from docs/PIXEL_UNBRIDLE.md (and Battery step below).

set -e
ADB_CMD="adb ${ADB_SERIAL:+ -s $ADB_SERIAL}"

echo "=== Verify Pixel unbridled (Android not killing JARVIS) ==="
echo ""

if ! $ADB_CMD devices 2>/dev/null | grep -q 'device$'; then
  echo "No ADB device. Connect USB or: adb connect <pixel-ip>:<wireless-debug-port>"
  echo "Get port from Pixel: Settings → Developer options → Wireless debugging"
  exit 1
fi

FAIL=0

# PPK
max="$($ADB_CMD shell "/system/bin/device_config get activity_manager max_phantom_processes 2>/dev/null" 2>/dev/null | tr -d '\r')"
mon="$($ADB_CMD shell "settings get global settings_enable_monitor_phantom_procs 2>/dev/null" 2>/dev/null | tr -d '\r')"

if [ "$max" = "2147483647" ]; then
  echo "  OK  max_phantom_processes = $max"
else
  echo "  FAIL max_phantom_processes = '$max' (expected 2147483647). Run: bash scripts/adb-pixel-ppk-bypass.sh then reboot."
  FAIL=1
fi

if [ "$mon" = "0" ] || [ "$mon" = "false" ]; then
  echo "  OK  settings_enable_monitor_phantom_procs = $mon (disabled)"
else
  echo "  FAIL monitor_phantom_procs = '$mon' (expected 0 or false). Run: adb shell settings put global settings_enable_monitor_phantom_procs false ; reboot."
  FAIL=1
fi

if $ADB_CMD shell "dumpsys deviceidle whitelist 2>/dev/null" 2>/dev/null | grep -q com.termux; then
  echo "  OK  Termux in deviceidle whitelist"
else
  echo "  SKIP deviceidle whitelist (optional). To add: adb shell dumpsys deviceidle whitelist +com.termux"
fi

echo ""
echo "--- Manual checks (on the Pixel) ---"
echo "  [ ] Termux → Settings → Wake lock = ON"
echo "  [ ] Android Settings → Apps → Termux → Battery → Unrestricted (or Don't optimize)"
echo "     (If you see Optimized / Restricted, change to Unrestricted so Android doesn't kill Termux.)"
echo ""
if [ "$FAIL" -gt 0 ]; then
  echo "Result: $FAIL check(s) failed. Re-apply steps in docs/PIXEL_UNBRIDLE.md and reboot."
  exit 1
fi
echo "Result: PPK bypass looks good. Ensure Wake lock + Battery Unrestricted on the device."
