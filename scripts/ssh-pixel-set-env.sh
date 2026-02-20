#!/usr/bin/env bash
# Append a line to ~/.clawdbot/.env on the Pixel via SSH (WiFi).
# Usage: ./scripts/ssh-pixel-set-env.sh "JARVIS_IPHONE_LLM_URL=http://192.168.1.100:8889" [pixel-ip]
#        ./scripts/ssh-pixel-set-env.sh "PIXEL_LLM_ROUTE=round-robin"
# Prereq: Pixel on same Wi‑Fi, sshd in Termux. Optional: setup-ssh-keys-to-pixel.sh for no password.

USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/../.pixel-ip"

if [ -z "$1" ]; then
  echo "Usage: $0 \"KEY=value\" [pixel-ip]" >&2
  echo "Example: $0 \"JARVIS_IPHONE_LLM_URL=http://192.168.1.100:8889\"" >&2
  exit 1
fi
LINE="$1"
shift

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

nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null || { echo "Cannot reach $PIXEL_IP:$PORT. In Termux run: sshd"; exit 1; }

# Escape for remote shell: single-quote the line (replace ' with '\'' )
SAFE_LINE="${LINE//\'/\'\\\'\'}"
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -p "$PORT" "$USER@$PIXEL_IP" \
  "mkdir -p ~/.clawdbot; echo '$SAFE_LINE' >> ~/.clawdbot/.env; echo \"Appended to ~/.clawdbot/.env on Pixel: $LINE\""
