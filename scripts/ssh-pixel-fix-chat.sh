#!/usr/bin/env bash
# SSH to the Pixel and fix JARVIS chat (18888): diagnose, ensure deps, re-push if needed, restart stack.
# Run on the Mac. You'll be asked for your Termux SSH password.
# Usage: cd ~/JARVIS && TERMUX_USER=u0_a310 bash scripts/ssh-pixel-fix-chat.sh [pixel-ip]
# Or: bash scripts/ssh-pixel-fix-chat.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"

# Resolve Pixel IP
if [ -n "$1" ]; then
  PIXEL_IP="$1"
  echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
else
  PIXEL_IP=$(adb shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1)
  PIXEL_IP=$(echo "$PIXEL_IP" | tr -d '\r\n \t')
  [ -n "$PIXEL_IP" ] && echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
  [ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
  [ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"
SSH="ssh -p $PORT $SSH_OPTS"

if ! nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null; then
  echo "Cannot reach $PIXEL_IP:$PORT. On the Pixel: open Termux, run: sshd"
  echo "Same Wi-Fi as this Mac. Then run this script again."
  exit 1
fi

echo "=== Fixing JARVIS chat on Pixel ($PIXEL_IP, user $USER) ==="
echo "You may be prompted for your Termux SSH password (once or twice)."
echo ""

# Optional: re-push so pixel-chat-server.js and scripts are definitely on the device
if [ -f "$JARVIS_ROOT/scripts/pixel-chat-server.js" ]; then
  echo "Re-pushing JARVIS to Pixel (ensures chat server script is present)..."
  bash "$SCRIPT_DIR/push-jarvis-to-pixel-ssh.sh" "$PIXEL_IP" || { echo "Push failed. Fix and re-run."; exit 1; }
  echo ""
fi

# Run remote fix-and-restart script
$SSH "$USER@$PIXEL_IP" "bash -s" << 'REMOTE'
export HOME="${HOME:-/data/data/com.termux/files/home}"
JARVIS="$HOME/JARVIS"
[ ! -d "$JARVIS" ] && JARVIS="/data/data/com.termux/files/home/JARVIS"

echo "--- 1. Ports before ---"
for p in 8889 18789 18888; do nc -z 127.0.0.1 $p 2>/dev/null && echo "  $p open" || echo "  $p closed"; done

echo ""
echo "--- 2. Chat server script present? ---"
if [ ! -f "$JARVIS/scripts/pixel-chat-server.js" ]; then
  echo "  MISSING: $JARVIS/scripts/pixel-chat-server.js"
  echo "  You need to re-push from Mac: cd ~/JARVIS && bash scripts/push-jarvis-to-pixel-ssh.sh"
  exit 1
fi
echo "  OK: pixel-chat-server.js exists"

echo ""
echo "--- 3. Chat server log (last 15 lines) ---"
tail -15 "$HOME/chat-server.log" 2>/dev/null || echo "  (no log yet)"

echo ""
echo "--- 4. Ensuring node_modules (npm install) ---"
cd "$JARVIS" && npm install 2>&1 | tail -5

echo ""
echo "--- 5. Restarting JARVIS stack ---"
bash "$JARVIS/scripts/start-jarvis-pixel.sh" 2>&1

echo ""
echo "--- 6. Ports after ---"
for p in 8889 18789 18888; do nc -z 127.0.0.1 $p 2>/dev/null && echo "  $p open" || echo "  $p closed"; done

echo ""
echo "On the Pixel open Chrome → http://127.0.0.1:18888"
REMOTE

echo ""
echo "Done. If 18888 is still closed, run the script again and check the 'Chat server log' section for errors."
echo "If pixel-chat-server.js was missing, run from Mac: cd ~/JARVIS && bash scripts/push-jarvis-to-pixel-ssh.sh"
echo "Then run this fix script again."