#!/usr/bin/env bash
# One command: what's actually going on with the Pixel + JARVIS. Run from Mac.
# Usage: bash scripts/pixel-wtf-status.sh [pixel-ip]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/../.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
PIXEL_IP="${1:-$(cat "$CACHE_FILE" 2>/dev/null | tr -d '\r\n \t')}"
[ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"

echo "=============================================="
echo "PIXEL + JARVIS STATUS ($PIXEL_IP)"
echo "=============================================="
echo ""

# 1. From Mac: can we reach the Pixel at all?
echo "1. FROM MAC → PIXEL"
if nc -z -w 3 "$PIXEL_IP" "$PORT" 2>/dev/null; then
  echo "   SSH (8022):     reachable"
else
  echo "   SSH (8022):     NOT REACHABLE (Pixel on same Wi‑Fi? Termux → sshd?)"
fi
G=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://$PIXEL_IP:18789/ 2>/dev/null || echo "000")
C=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 http://$PIXEL_IP:18888/ 2>/dev/null || echo "000")
echo "   Gateway (18789): $G  (want 200)"
echo "   Chat (18888):    $C  (want 200)"
if [ "$G" = "200" ] && [ "$C" = "200" ]; then
  echo "   → Stack is UP from Mac. Use http://$PIXEL_IP:18888"
elif [ "$C" = "200" ]; then
  echo "   → Chat is UP; Gateway (18789) not reachable from Mac (on-device + Discord may still work)"
else
  echo "   → Stack not reachable from Mac (sleep/different network/stack down)"
fi
echo ""

# 2. On device (if SSH works)
if ! nc -z -w 3 "$PIXEL_IP" "$PORT" 2>/dev/null; then
  echo "2. ON PIXEL (skipped — SSH not reachable)"
  echo ""
  echo "FIX: On Pixel open Termux, run:  sshd"
  echo "     Same Wi‑Fi as Mac. Then re-run this script."
  exit 0
fi

echo "2. ON PIXEL (via SSH)"
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=8 -p "$PORT" "$USER@$PIXEL_IP" "bash -s" << 'REMOTE'
echo "   Ports (localhost in Termux):"
for p in 8889 4000 18789 18888; do
  nc -z 127.0.0.1 $p 2>/dev/null && echo "     $p open" || echo "     $p closed"
done
echo "   (If stack runs in Proot, Termux localhost may show closed; Mac→Pixel Chat 200 = stack up)"
echo "   Proot/Ubuntu:"
command -v proot-distro >/dev/null 2>&1 && proot-distro login ubuntu -- true 2>/dev/null && echo "     installed" || echo "     not installed or broken"
command -v proot-distro >/dev/null 2>&1 || echo "     proot-distro missing"
echo "   JARVIS dir:"
[ -d "$HOME/JARVIS" ] && echo "     present" || echo "     MISSING"
REMOTE
echo ""
echo "=============================================="
echo "ONE FIX (from Mac, Pixel on same Wi‑Fi):"
echo "  cd ~/JARVIS && bash scripts/pixel-do-it-all.sh"
echo "  (stops anything running, starts stack in Proot, tails logs)"
echo "On Pixel: Chrome → http://127.0.0.1:18888"
echo "=============================================="
