#!/usr/bin/env bash
# From the Mac: SSH to Pixel and print all JARVIS stack logs (for pasting to Cursor/AI).
# You will be prompted for your Termux SSH password.
# Usage: ./scripts/ssh-pixel-logs-full.sh [pixel-ip]

USER="jefe"
PORT="8022"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/../.pixel-ip"
PIXEL_IP="${1:-$(cat "$CACHE_FILE" 2>/dev/null | tr -d '\r\n \t')}"
[ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"

nc -z "$PIXEL_IP" "$PORT" 2>/dev/null || { echo "Cannot reach $PIXEL_IP:$PORT. Is Pixel on same Wi-Fi? sshd running in Termux?"; exit 1; }

echo "Connecting to $PIXEL_IP (enter SSH password when prompted)..."
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -p "$PORT" "$USER@$PIXEL_IP" "bash -lc '
  echo \"=== Pixel JARVIS logs \$(date) ===\"
  echo \"\"
  echo \"--- adapter.log (last 30) ---\"
  tail -30 ~/adapter.log 2>/dev/null || echo \"(no adapter.log)\"
  echo \"\"
  echo \"--- litellm.log (last 40) ---\"
  tail -40 ~/litellm.log 2>/dev/null || echo \"(no litellm.log)\"
  echo \"\"
  echo \"--- gateway.log (last 50) ---\"
  tail -50 ~/gateway.log 2>/dev/null || echo \"(no gateway.log)\"
  echo \"\"
  echo \"--- chat-server.log (last 20) ---\"
  tail -20 ~/chat-server.log 2>/dev/null || echo \"(no chat-server.log)\"
  echo \"\"
  echo \"--- webhook.log (last 15) ---\"
  tail -15 ~/webhook.log 2>/dev/null || echo \"(no webhook.log)\"
  echo \"\"
  echo \"--- Ports ---\"
  for p in 8889 4000 18789 18888; do
    curl -s -o /dev/null -w \"  \$p: %{http_code}\n\" --connect-timeout 1 http://127.0.0.1:\$p/ 2>/dev/null || echo \"  \$p: closed\"
  done
'"
