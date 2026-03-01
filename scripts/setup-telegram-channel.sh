#!/usr/bin/env bash
# Set up Telegram as a channel for the JARVIS gateway (ClawdBot).
#
# 1. Adds TELEGRAM_BOT_TOKEN to ~/.clawdbot/.env
# 2. Adds channels.telegram config to ~/.clawdbot/clawdbot.json
# 3. Pushes .env + clawdbot.json to the Pixel and optionally restarts
#
# Usage:
#   ./scripts/setup-telegram-channel.sh <BOT_TOKEN> [--restart]
#   ./scripts/setup-telegram-channel.sh              # prompts for token

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
ENV_FILE="${HOME}/.clawdbot/.env"
CONFIG_FILE="${HOME}/.clawdbot/clawdbot.json"

RESTART=""
TOKEN=""
for a in "$@"; do
  [ "$a" = "--restart" ] && RESTART=1 && continue
  [ -z "$TOKEN" ] && TOKEN="$a"
done

if [ -z "$TOKEN" ]; then
  echo ""
  echo "  Telegram bot setup for JARVIS"
  echo "  ─────────────────────────────"
  echo ""
  echo "  1. Open Telegram → message @BotFather"
  echo "  2. Send /newbot → pick a name (e.g. 'JARVIS') and username (e.g. jarvis_d6_bot)"
  echo "  3. Copy the bot token BotFather gives you"
  echo ""
  read -rp "  Paste your bot token here: " TOKEN
  echo ""
fi

if [ -z "$TOKEN" ]; then
  echo "No token provided. Exiting."
  exit 1
fi

if ! echo "$TOKEN" | grep -qE '^[0-9]+:'; then
  echo "Warning: token doesn't look like a Telegram bot token (expected format: 123456:ABC-DEF...)"
  read -rp "Continue anyway? [y/N] " yn
  [ "$yn" != "y" ] && [ "$yn" != "Y" ] && exit 1
fi

mkdir -p "${HOME}/.clawdbot"

# --- Add token to .env ---
if [ -f "$ENV_FILE" ]; then
  if grep -q '^TELEGRAM_BOT_TOKEN=' "$ENV_FILE"; then
    sed -i.bak "s|^TELEGRAM_BOT_TOKEN=.*|TELEGRAM_BOT_TOKEN=$TOKEN|" "$ENV_FILE"
    rm -f "${ENV_FILE}.bak"
    echo "Updated TELEGRAM_BOT_TOKEN in $ENV_FILE"
  else
    echo "TELEGRAM_BOT_TOKEN=$TOKEN" >> "$ENV_FILE"
    echo "Added TELEGRAM_BOT_TOKEN to $ENV_FILE"
  fi
else
  echo "TELEGRAM_BOT_TOKEN=$TOKEN" > "$ENV_FILE"
  echo "Created $ENV_FILE with TELEGRAM_BOT_TOKEN"
fi

# --- Add channels.telegram to clawdbot.json if missing ---
if [ -f "$CONFIG_FILE" ]; then
  if node -e "
    const fs = require('fs');
    const cfg = JSON.parse(fs.readFileSync('$CONFIG_FILE', 'utf8'));
    if (cfg.channels && cfg.channels.telegram && cfg.channels.telegram.enabled) {
      console.log('Telegram channel already configured in clawdbot.json');
      process.exit(0);
    }
    if (!cfg.channels) cfg.channels = {};
    cfg.channels.telegram = {
      enabled: true,
      dmPolicy: 'pairing',
      streaming: 'partial',
      groups: { '*': { requireMention: true } }
    };
    fs.writeFileSync('$CONFIG_FILE', JSON.stringify(cfg, null, 2), 'utf8');
    console.log('Added channels.telegram to clawdbot.json');
  " 2>/dev/null; then
    :
  else
    echo "Warning: could not update clawdbot.json automatically. channels.telegram may need manual config."
  fi
else
  echo "Warning: $CONFIG_FILE not found. Run 'npx clawdbot setup' first."
fi

echo ""
echo "Local config ready. Telegram channel enabled."
echo ""

# --- Push to Pixel ---
PIXEL_IP=""
[ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
[ -z "$PIXEL_IP" ] && PIXEL_IP="${JARVIS_PIXEL_IP:-}"

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -o BatchMode=yes"

push_to_pixel() {
  echo "Pushing .env + clawdbot.json to Pixel ($PIXEL_IP)..."
  ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" "mkdir -p ~/.clawdbot"
  scp -P "$PORT" $SSH_OPTS "$ENV_FILE" "$USER@$PIXEL_IP:.clawdbot/.env"
  scp -P "$PORT" $SSH_OPTS "$CONFIG_FILE" "$USER@$PIXEL_IP:.clawdbot/clawdbot.json"
  echo "Pushed both files to Pixel."

  if [ -n "$RESTART" ]; then
    echo "Restarting Proot stack on Pixel..."
    ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" \
      "export HOME=\${HOME:-/data/data/com.termux/files/home}; bash \$HOME/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart"
    echo "Gateway restarted with Telegram enabled."
  else
    echo "Run on Pixel to activate: bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart"
  fi
}

if [ -n "$PIXEL_IP" ] && nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null; then
  if ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" "echo ok" 2>/dev/null | grep -q "ok"; then
    push_to_pixel
    echo ""
    echo "Next: DM your bot on Telegram. It will send a pairing code."
    echo "Then approve it:"
    echo "  On Pixel:  npx clawdbot pairing approve telegram <CODE>"
    echo "  From Mac:  bash scripts/pixel-proot-run.sh \"cd \\\$JARVIS_DIR && npx clawdbot pairing approve telegram <CODE>\""
    exit 0
  fi
fi

echo "Pixel not reachable right now (IP: ${PIXEL_IP:-not set})."
echo "When the Pixel is back online:"
echo "  ./scripts/pixel-push-env-to-pixel.sh --restart"
echo "  scp -P 8022 ~/.clawdbot/clawdbot.json u0_a310@<pixel-ip>:.clawdbot/clawdbot.json"
echo ""
echo "Then DM your bot on Telegram → approve the pairing code:"
echo "  bash scripts/pixel-proot-run.sh \"cd \\\$JARVIS_DIR && npx clawdbot pairing approve telegram <CODE>\""
