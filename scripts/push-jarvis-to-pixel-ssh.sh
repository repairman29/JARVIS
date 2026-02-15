#!/usr/bin/env bash
# Push JARVIS + neural-farm to the Pixel over SSH (no ADB). Then run setup in Termux.
# Prereqs: Pixel on same Wi‑Fi, Termux with SSH (sshd on 8022).
# In Termux run: whoami   (that's your SSH user) and  passwd   (set password).
# Usage: ./scripts/push-jarvis-to-pixel-ssh.sh [pixel-ip]
# Or: TERMUX_USER=u0_a310 ./scripts/push-jarvis-to-pixel-ssh.sh
# You will be prompted for your Termux SSH password (twice: scp then ssh).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
FARM_ROOT="${NEURAL_FARM_DIR:-$(dirname "$JARVIS_ROOT")/neural-farm}"
OUT="/tmp/jarvis-pixel-push"
USER="${TERMUX_USER:-jefe}"
PORT="8022"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"

# Resolve Pixel IP
if [ -n "$1" ]; then
  PIXEL_IP="$1"
  echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
  echo "Using Pixel IP: $PIXEL_IP"
else
  PIXEL_IP=$(adb shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1)
  PIXEL_IP=$(echo "$PIXEL_IP" | tr -d '\r\n \t')
  if [ -n "$PIXEL_IP" ]; then
    echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
    echo "Using Pixel IP: $PIXEL_IP (from ADB)"
  elif [ -f "$CACHE_FILE" ]; then
    PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
    echo "Using Pixel IP: $PIXEL_IP (cached)"
  else
    PIXEL_IP="10.1.10.50"
    echo "Using Pixel IP: $PIXEL_IP (default)"
  fi
fi

# Reachability (5s timeout)
if ! nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null; then
  echo "Cannot reach $PIXEL_IP:$PORT. In Termux run: sshd"
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"
SCP="scp -P $PORT $SSH_OPTS"
SSH="ssh -p $PORT $SSH_OPTS"

echo "=== Push JARVIS to Pixel over SSH ==="
echo "JARVIS: $JARVIS_ROOT"
echo "Farm:   $FARM_ROOT"
echo ""

# 1. Prepare tarballs
mkdir -p "$OUT"
rm -f "$OUT/JARVIS.tar.gz" "$OUT/neural-farm.tar.gz"

echo "Creating JARVIS tarball..."
JARVIS_PARENT="$(dirname "$JARVIS_ROOT")"
JARVIS_NAME="$(basename "$JARVIS_ROOT")"
(export COPYFILE_DISABLE=1; cd "$JARVIS_PARENT" && tar -czf "$OUT/JARVIS.tar.gz" \
  --exclude=node_modules --exclude=.next --exclude=.git \
  "$JARVIS_NAME")

echo "Creating neural-farm tarball..."
[ -d "$FARM_ROOT" ] || { echo "Neural-farm not found at $FARM_ROOT"; exit 1; }
FARM_PARENT="$(dirname "$FARM_ROOT")"
FARM_NAME="$(basename "$FARM_ROOT")"
(export COPYFILE_DISABLE=1; cd "$FARM_PARENT" && tar -czf "$OUT/neural-farm.tar.gz" \
  --exclude=.venv --exclude=.git \
  "$FARM_NAME")

cp "$SCRIPT_DIR/setup-jarvis-termux.sh" "$OUT/"
[ -f "$HOME/.clawdbot/.env" ] && cp "$HOME/.clawdbot/.env" "$OUT/clawdbot.env" && echo "Including .clawdbot/.env"

# 2. Copy to Pixel home (works even if termux-setup-storage wasn't run)
echo "Copying to Pixel (you may be asked for SSH password)..."
$SCP "$OUT/JARVIS.tar.gz" "$OUT/neural-farm.tar.gz" "$OUT/setup-jarvis-termux.sh" \
  "$USER@$PIXEL_IP:"
[ -f "$OUT/clawdbot.env" ] && $SCP "$OUT/clawdbot.env" "$USER@$PIXEL_IP:"

# 3. Run setup on Pixel (setup script looks for tarballs in $HOME)
echo "Running setup on Pixel (you may be asked for SSH password again)..."
$SSH "$USER@$PIXEL_IP" "bash ~/setup-jarvis-termux.sh"

echo ""
echo "Done. On Pixel: enable Wake lock in Termux settings."
