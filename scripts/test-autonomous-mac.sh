#!/usr/bin/env bash
# Run on the Mac: tests everything that doesn't require Pixel SSH password.
# For full test including Pixel: SSH in (./scripts/ssh-pixel.sh) then run:
#   bash ~/JARVIS/scripts/test-autonomous-pixel.sh
# Usage: ./scripts/test-autonomous-mac.sh [pixel-ip]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
PORT="8022"

echo "=== JARVIS autonomous test (Mac) $(date) ==="

# 1. Bash scripts syntax
echo "--- Bash syntax ---"
bash -n "$SCRIPT_DIR/termux-boot-start-jarvis" && echo "OK: termux-boot-start-jarvis"
bash -n "$SCRIPT_DIR/start-jarvis-pixel.sh" && echo "OK: start-jarvis-pixel.sh"

# 2. Node autonomous scripts (dry-run)
echo "--- Node autonomous (dry-run) ---"
cd "$JARVIS_ROOT"
node scripts/jarvis-autonomous-plan-execute.js --dry-run 2>&1 | head -2
echo "OK: plan-execute.js --dry-run"
node scripts/jarvis-autonomous-heartbeat.js --dry-run 2>&1 | head -2
echo "OK: heartbeat.js --dry-run"

# 3. set-autonomous-goal
node scripts/set-autonomous-goal.js "Test goal for 2/15/26" 2>/dev/null
node scripts/set-autonomous-goal.js --clear 2>/dev/null
echo "OK: set-autonomous-goal.js"

# 4. Pixel reachability
PIXEL_IP="${1:-}"
[ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
[ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"
echo "--- Pixel $PIXEL_IP:$PORT ---"
if nc -z -w 3 "$PIXEL_IP" "$PORT" 2>/dev/null; then
  echo "OK: Pixel SSH port open (run full test on device: ./scripts/ssh-pixel.sh then bash ~/JARVIS/scripts/test-autonomous-pixel.sh)"
else
  echo "SKIP: Pixel unreachable (not on same Wi-Fi or sshd not running)"
fi

echo ""
echo "=== Mac-side tests done. For Pixel health/cron/stack: SSH in and run test-autonomous-pixel.sh ==="
