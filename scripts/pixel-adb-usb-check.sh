#!/usr/bin/env bash
# Run with Pixel connected via USB. Resets adb, lists devices, shows version.
# Usage: cd ~/JARVIS && bash scripts/pixel-adb-usb-check.sh

echo "=== ADB version (Android 16 works best with platform-tools 35+) ==="
adb version
echo ""
echo "=== Resetting adb server ==="
adb kill-server 2>/dev/null || true
sleep 1
adb start-server
echo ""
echo "=== Devices (with USB connected) ==="
adb devices -l
echo ""
if adb devices 2>/dev/null | grep -q 'device$'; then
  echo "Device seen. Run: bash scripts/adb-pixel-ppk-bypass.sh"
else
  echo "No device. Check:"
  echo "  1. USB cable is data-capable (not charge-only)"
  echo "  2. On Pixel: Settings → Developer options → USB debugging ON"
  echo "  3. When prompted on Pixel, tap Allow (and optionally Always allow)"
  echo "  4. Try another USB port on the Mac"
fi
