#!/usr/bin/env bash
# One-time setup: copy your Mac's SSH public key to the Pixel (Termux) so you never type the password again.
# After this, ssh-pixel-logs-full.sh, ssh-pixel-start-jarvis.sh, ssh-pixel-diagnose.sh run without prompting.
#
# Usage: ./scripts/setup-ssh-keys-to-pixel.sh [pixel-ip]
# You will be asked for your Termux password ONCE; after that, no password needed.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/../.pixel-ip"
PORT="8022"
USER="jefe"

# Pixel IP
PIXEL_IP="${1:-$(cat "$CACHE_FILE" 2>/dev/null | tr -d '\r\n \t')}"
[ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"

# Ensure we have a key on the Mac
KEY=""
for k in ~/.ssh/id_ed25519.pub ~/.ssh/id_rsa.pub ~/.ssh/id_ecdsa.pub; do
  [ -f "$k" ] && KEY="$k" && break
done
if [ -z "$KEY" ]; then
  echo "No SSH public key found. Creating one (press Enter for default path, optional passphrase)..."
  ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N "" -q 2>/dev/null || ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519
  KEY=~/.ssh/id_ed25519.pub
fi

echo "Using key: $KEY"
echo "Copying to jefe@$PIXEL_IP port $PORT (enter your Termux password when prompted)..."
echo "If it fails, on the Pixel run once:  mkdir -p ~/.ssh && chmod 700 ~/.ssh"
ssh-copy-id -i "$KEY" -p "$PORT" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$USER@$PIXEL_IP"

echo ""
echo "Done. From now on these will work without a password:"
echo "  ./scripts/ssh-pixel-logs-full.sh"
echo "  ./scripts/ssh-pixel-start-jarvis.sh"
echo "  ./scripts/ssh-pixel-diagnose.sh"
echo "  ./scripts/ssh-pixel.sh"
