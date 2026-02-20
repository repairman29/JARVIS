#!/usr/bin/env bash
# One command from the Mac: sync JARVIS to the Pixel and start the stack.
# Fully automatic after one-time SSH key setup (no password).
#
# One-time (do once):  ./scripts/setup-ssh-keys-to-pixel.sh
#   Enter your Termux password when asked. After that, this script never asks.
#
# Every time:  cd ~/JARVIS && ./scripts/pixel-auto-sync-and-start.sh [pixel-ip]
#
# Prereqs: Pixel on same Wi‑Fi, Termux open with "sshd" running.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"

# Ensure we're in JARVIS and required scripts exist
for f in "$SCRIPT_DIR/push-jarvis-to-pixel-ssh.sh" "$SCRIPT_DIR/push-jarvis-to-pixel.sh" "$SCRIPT_DIR/pixel-bootstrap-and-start.sh"; do
  if [ ! -f "$f" ]; then
    echo "Missing script: $f" >&2
    echo "Run this from the JARVIS repo:  cd ~/JARVIS && ./scripts/pixel-auto-sync-and-start.sh" >&2
    exit 1
  fi
done

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

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -o BatchMode=yes"
nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null || true
SSH_UP=$?

if [ "$SSH_UP" -eq 0 ]; then
  # Test passwordless SSH
  if ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" "echo ok" 2>/dev/null | grep -q "ok"; then
    echo "Pixel: $PIXEL_IP (SSH keys OK — no password needed)"
    echo "Pushing JARVIS and starting stack..."
    bash "$SCRIPT_DIR/push-jarvis-to-pixel-ssh.sh" "$PIXEL_IP" || exit 1
    echo "Starting JARVIS stack on Pixel..."
    ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -p "$PORT" "$USER@$PIXEL_IP" \
      "export HOME=\${HOME:-/data/data/com.termux/files/home}; JARVIS=\"\$HOME/JARVIS\"; [ -d \"\$JARVIS\" ] || JARVIS=/data/data/com.termux/files/home/JARVIS; if [ ! -f \"\$JARVIS/scripts/start-jarvis-pixel.sh\" ]; then echo \"No file exists: \$JARVIS/scripts/start-jarvis-pixel.sh — run setup on Pixel first (see docs/PIXEL_MAKE_IT_WORK.md)\"; exit 1; fi; bash \"\$JARVIS/scripts/start-jarvis-pixel.sh\""
    echo ""
    echo "Done. On the Pixel open Chrome → http://127.0.0.1:18888"
    exit 0
  fi
fi

# SSH not usable (no keys or not reachable) — try ADB push + RunCommand
if adb devices | grep -qE 'device$'; then
  echo "Pixel: $PIXEL_IP (SSH not passwordless or not reachable; using ADB)"
  echo "Pushing JARVIS to Pixel Download..."
  bash "$SCRIPT_DIR/push-jarvis-to-pixel.sh" "${PIXEL_IP:-10.1.10.50}" 2>/dev/null || true

  # Push bootstrap script so RunCommand can run it (if user granted RUN_COMMAND permission)
  adb push "$SCRIPT_DIR/pixel-bootstrap-and-start.sh" /sdcard/Download/ 2>/dev/null || true

  TERMUX_HOME="/data/data/com.termux/files/home"
  # RunCommand needs one -e per extra; arguments are one string (comma-separated for bash -c)
  if adb shell am startservice -n com.termux/com.termux.app.RunCommandService \
    -e com.termux.RUN_COMMAND_PATH "$TERMUX_HOME/../usr/bin/bash" \
    -e com.termux.RUN_COMMAND_ARGUMENTS "-c,bash /storage/emulated/0/Download/pixel-bootstrap-and-start.sh /storage/emulated/0/Download" \
    -e com.termux.RUN_COMMAND_WORKDIR "$TERMUX_HOME" 2>/dev/null; then
    echo "Started bootstrap in Termux. Check the Termux app for progress."
    exit 0
  fi
fi

# Could not automate — print one-time setup
echo ""
echo ">>> Could not run without a password. Do this once to automate:"
echo ""
echo "  1. On the Pixel: open Termux and run:  sshd"
echo "  2. On the Mac run:  ./scripts/setup-ssh-keys-to-pixel.sh"
echo "     (enter your Termux password when asked)"
echo "  3. Then run this script again:  ./scripts/pixel-auto-sync-and-start.sh"
echo ""
echo "After that, sync and start will run with no password."
echo ""
echo "Alternatively, on the Pixel in Termux run:"
echo "  bash ~/storage/downloads/setup-jarvis-termux.sh"
echo "  bash ~/JARVIS/scripts/start-jarvis-pixel.sh"
echo ""
exit 1
