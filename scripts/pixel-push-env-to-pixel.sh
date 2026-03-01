#!/usr/bin/env bash
# Push Mac's ~/.clawdbot/.env (e.g. DISCORD_BOT_TOKEN) to the Pixel. Use when you add the token on the Mac
# and want the Pixel gateway to pick it up without a full sync.
#
# Usage: ./scripts/pixel-push-env-to-pixel.sh [pixel-ip] [--restart]
#   --restart: after pushing, restart the Proot stack on the Pixel so the gateway reloads .env.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
ENV_FILE="${HOME}/.clawdbot/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "No $ENV_FILE on the Mac. Create it and add DISCORD_BOT_TOKEN (and other vars), then re-run."
  exit 1
fi

RESTART=""
PIXEL_IP=""
for a in "$@"; do
  [ "$a" = "--restart" ] && RESTART=1 && continue
  [ -n "$a" ] && [ "$a" != "--restart" ] && PIXEL_IP="$a"
done
if [ -z "$PIXEL_IP" ]; then
  PIXEL_IP=$(adb shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1)
  PIXEL_IP=$(echo "$PIXEL_IP" | tr -d '\r\n \t')
  [ -n "$PIXEL_IP" ] && echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
  [ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
  [ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -o BatchMode=yes"

# --- SSH path ---
if nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null && \
   ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" "echo ok" 2>/dev/null | grep -q "ok"; then
  echo "Pixel: $PIXEL_IP (SSH) — pushing .clawdbot/.env..."
  ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" "mkdir -p ~/.clawdbot"
  scp -P "$PORT" $SSH_OPTS "$ENV_FILE" "$USER@$PIXEL_IP:.clawdbot/.env"
  echo "Pushed .env to Pixel (Termux ~/.clawdbot/.env)."
  if [ -n "$RESTART" ]; then
    echo "Restarting Proot stack on Pixel..."
    ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" \
      "export HOME=\${HOME:-/data/data/com.termux/files/home}; bash \$HOME/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart"
    echo "Done. Gateway (and Discord) restarted."
  else
    echo "Restart the stack on the Pixel to pick up the new env: bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart"
  fi
  exit 0
fi

# --- ADB fallback ---
if adb devices | grep -qE 'device$'; then
  echo "Pixel: $PIXEL_IP (SSH unreachable; using ADB) — pushing .clawdbot/.env..."
  adb push "$ENV_FILE" /sdcard/Download/clawdbot.env 2>/dev/null || { echo "ADB push failed."; exit 1; }
  TERMUX_HOME="/data/data/com.termux/files/home"
  # Termux can read Download as ~/storage/downloads (after termux-setup-storage) or /storage/emulated/0/Download
  RUN="mkdir -p $TERMUX_HOME/.clawdbot && ( cp $TERMUX_HOME/storage/downloads/clawdbot.env $TERMUX_HOME/.clawdbot/.env 2>/dev/null || cp /storage/emulated/0/Download/clawdbot.env $TERMUX_HOME/.clawdbot/.env ) && echo Pushed .env"
  if adb shell am startservice -n com.termux/com.termux.app.RunCommandService \
    -e com.termux.RUN_COMMAND_PATH "$TERMUX_HOME/../usr/bin/bash" \
    -e com.termux.RUN_COMMAND_ARGUMENTS "-c,$RUN" \
    -e com.termux.RUN_COMMAND_WORKDIR "$TERMUX_HOME" 2>/dev/null; then
    echo "Pushed .env to Pixel (via Download). Restart the stack on the Pixel to pick up: bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh --restart"
  else
    echo "RunCommand failed. On the Pixel, open Termux and run: cp ~/storage/downloads/clawdbot.env ~/.clawdbot/.env  (then restart the stack)."
  fi
  if [ -n "$RESTART" ]; then
    bash "$SCRIPT_DIR/pixel-sync-and-start-proot.sh" --adb --restart 2>/dev/null || true
  fi
  exit 0
fi

echo "Could not reach Pixel (SSH or ADB). Connect the device and try again."
exit 1
