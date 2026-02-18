#!/usr/bin/env bash
# Run from Mac: test Edge-Native Sovereign roadmap phases (ADB + SSH to Pixel).
# Usage: ./scripts/pixel-phase-tests.sh [phase] [pixel-ip]
#   phase: 0-9 or "all" (default: all)
#   pixel-ip: optional; else from ADB or .pixel-ip
# Prereq: Pixel on same Wi‑Fi with sshd, or USB ADB. TERMUX_USER from whoami on Pixel.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${SSH_PORT:-8022}"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
TERMUX_USER="${TERMUX_USER:-u0_a310}"
ADB_CMD="adb ${ADB_SERIAL:+ -s $ADB_SERIAL}"

PHASE="${1:-all}"
PIXEL_IP="${2:-}"

if [ -z "$PIXEL_IP" ]; then
  PIXEL_IP="$($ADB_CMD shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1 | tr -d '\r\n \t')"
  [ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP="$(cat "$CACHE_FILE" | tr -d '\r\n \t')"
fi

echo "=== JARVIS Edge-Native Sovereign — Phase tests (from Mac) ==="
echo "Phase(s): $PHASE"
echo ""

# --- ADB-only checks (no SSH) ---
run_adb_checks() {
  local p="$1"
  local dev_count
  dev_count="$($ADB_CMD devices 2>/dev/null | grep -c 'device$' || true)"
  if [ "$dev_count" -eq 0 ]; then
    echo "  SKIP (ADB): No device. Connect USB or run: adb connect <ip>:5555"
    return 0
  fi
  if [ "$dev_count" -gt 1 ] && [ -z "$ADB_SERIAL" ]; then
    echo "  SKIP (ADB): Multiple devices. Set ADB_SERIAL=\$(adb devices -l | grep device | head -1 | awk '{print \$1}')"
    return 0
  fi
  case "$p" in
    1)
      echo "Phase 1 (Persistence) — ADB checks"
      local sync="" max="" mon=""
      sync="$($ADB_CMD shell "getprop persist.sys.device_config.sync_disabled_for_tests 2>/dev/null" 2>/dev/null | tr -d '\r')"
      max="$($ADB_CMD shell "/system/bin/device_config get activity_manager max_phantom_processes 2>/dev/null" 2>/dev/null | tr -d '\r')"
      mon="$($ADB_CMD shell "settings get global settings_enable_monitor_phantom_procs 2>/dev/null" 2>/dev/null | tr -d '\r')"
      [ "$max" = "2147483647" ] && echo "  PASS: max_phantom_processes set" || echo "  FAIL: max_phantom_processes not set (run adb-pixel-ppk-bypass.sh + reboot)"
      [ "$mon" = "0" ] && echo "  PASS: monitor_phantom_procs disabled" || echo "  FAIL: monitor still enabled (reboot Pixel after adb-pixel-ppk-bypass.sh)"
      $ADB_CMD shell "dumpsys deviceidle whitelist 2>/dev/null" 2>/dev/null | grep -q com.termux && echo "  PASS: Termux in wakelock whitelist" || echo "  SKIP: wakelock not applied (optional)"
      ;;
    3)
      echo "Phase 3 (Networking) — ADB checks"
      $ADB_CMD shell "pm list packages 2>/dev/null" 2>/dev/null | grep -q tailscale && echo "  PASS: Tailscale app installed" || echo "  SKIP: Tailscale app not installed"
      ;;
    *) ;;
  esac
}

# --- SSH to Pixel and run on-device tests ---
run_ssh_tests() {
  local p="$1"
  [ -z "$PIXEL_IP" ] && { echo "  SKIP (SSH): No PIXEL_IP. Set TERMUX_USER and pass pixel-ip or connect ADB (USB)."; return 0; }
  # TERMUX_USER defaults to u0_a310; set TERMUX_USER if your Termux whoami differs
  nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null || {
    echo "  SKIP (SSH): Cannot reach $PIXEL_IP:$PORT. In Termux run: sshd"
    return 0
  }
  echo "  Running on-device tests via SSH ($TERMUX_USER@$PIXEL_IP)..."
  ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -p "$PORT" "$TERMUX_USER@$PIXEL_IP" "bash -s" << REMOTE
export JARVIS_DIR="\${JARVIS_DIR:-\$HOME/JARVIS}"
[ -f "\$JARVIS_DIR/scripts/pixel-test-phases-on-device.sh" ] && bash "\$JARVIS_DIR/scripts/pixel-test-phases-on-device.sh" "$p" || echo "  (pixel-test-phases-on-device.sh not on device — push JARVIS first)"
REMOTE
}

# --- Main ---
FAILED=0
if [ "$PHASE" = "all" ]; then
  for p in 1 3; do run_adb_checks "$p"; done
  run_ssh_tests "all" || FAILED=1
else
  run_adb_checks "$PHASE"
  run_ssh_tests "$PHASE" || FAILED=1
fi
echo ""
echo "=== Done ==="
exit $FAILED
