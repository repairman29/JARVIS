#!/usr/bin/env bash
# Run on the Pixel in Termux (or after SSH): verifies autonomous setup.
# Usage: bash ~/JARVIS/scripts/test-autonomous-pixel.sh

set -e
HOME="${HOME:-/data/data/com.termux/files/home}"
JARVIS="${JARVIS:-$HOME/JARVIS}"
PREFIX="$HOME"

echo "=== JARVIS autonomous self-test $(date) ==="

# 1. Crontab
echo "--- Crontab ---"
if crontab -l 2>/dev/null | grep -q plan-execute; then
  echo "OK: plan-execute in crontab"
  crontab -l 2>/dev/null | grep -E "plan-execute|heartbeat" || true
else
  echo "MISSING: no plan-execute in crontab (run setup-jarvis-termux.sh)"
fi

# 2. Services
echo "--- Services ---"
G=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/ 2>/dev/null || echo "000")
P=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/ 2>/dev/null || echo "000")
[ "$G" = "200" ] && echo "OK: Gateway 18789 => $G" || echo "FAIL: Gateway 18789 => $G"
[ "$P" = "200" ] && echo "OK: Proxy 4000 => $P" || echo "FAIL: Proxy 4000 => $P"

# 3. Boot script (optional)
echo "--- Termux:Boot ---"
if [ -x "$HOME/.termux/boot/termux-boot-start-jarvis" ]; then
  echo "OK: termux-boot-start-jarvis installed"
else
  echo "OPTIONAL: copy scripts/termux-boot-start-jarvis to ~/.termux/boot/ for start-after-reboot"
fi

# 4. Dry-run plan-execute (no LLM call, just prompt build)
echo "--- Plan-execute dry-run ---"
cd "$JARVIS"
if node scripts/jarvis-autonomous-plan-execute.js --dry-run 2>&1 | head -3; then
  echo "OK: plan-execute.js --dry-run"
else
  echo "FAIL: plan-execute.js --dry-run"
fi

# 5. Dry-run heartbeat
echo "--- Heartbeat dry-run ---"
if node scripts/jarvis-autonomous-heartbeat.js --dry-run 2>&1 | head -3; then
  echo "OK: heartbeat.js --dry-run"
else
  echo "FAIL: heartbeat.js --dry-run"
fi

echo ""
echo "=== Done. Enable Wake lock in Termux settings so cron runs when screen is off. ==="
