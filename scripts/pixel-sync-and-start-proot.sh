#!/usr/bin/env bash
# From the Mac: push JARVIS to the Pixel, then bootstrap Proot (if needed) and start JARVIS in Proot.
# Uses SSH if reachable (passwordless after setup-ssh-keys-to-pixel.sh), else ADB.
# Respects existing processes: skips start if gateway+chat already up; pass --restart to force restart.
#
# One-time: ./scripts/setup-ssh-keys-to-pixel.sh   (then no password)
# Every time: cd ~/JARVIS && ./scripts/pixel-sync-and-start-proot.sh [pixel-ip] [--restart]
# Push only (run bootstrap later in an existing Pixel/SSH session):  .../pixel-sync-and-start-proot.sh --push-only
# ADB only (JARVIS already on device; no push):  .../pixel-sync-and-start-proot.sh --adb [--restart]
#
# SSH usage: One SCP (push) + one short-lived SSH that runs the bootstrap and exits. Safe to run
# alongside other SSH sessions; if JARVIS is already up we skip start (no --restart). Use --push-only
# to avoid opening the second SSH and run the bootstrap later on the device.
#
# Prereqs: Pixel on same Wi-Fi; Termux with sshd (for SSH) or USB/Wi-Fi ADB (for ADB fallback).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"

# Resolve Pixel IP, --restart, --push-only, --adb (order-independent)
RESTART_ARG=""
PUSH_ONLY=""
USE_ADB=""
PIXEL_IP=""
while [ -n "$1" ]; do
  if [ "$1" = "--restart" ]; then RESTART_ARG="--restart"; shift; continue; fi
  if [ "$1" = "--push-only" ]; then PUSH_ONLY=1; shift; continue; fi
  if [ "$1" = "--adb" ]; then USE_ADB=1; shift; continue; fi
  if [ -n "$1" ] && [ "$1" != "--restart" ] && [ "$1" != "--push-only" ] && [ "$1" != "--adb" ]; then
    PIXEL_IP="$1"
    echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
    shift
    continue
  fi
  shift
done
if [ -z "$PIXEL_IP" ]; then
  PIXEL_IP=$(adb shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1)
  PIXEL_IP=$(echo "$PIXEL_IP" | tr -d '\r\n \t')
  [ -n "$PIXEL_IP" ] && echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
  [ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
  [ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -o BatchMode=yes"

# --- ADB-only path (no push; JARVIS already on device) ---
if [ -n "$USE_ADB" ] && adb devices | grep -qE 'device$'; then
  echo "Pixel (ADB only, no push) — starting JARVIS in Proot..."
  TERMUX_HOME="/data/data/com.termux/files/home"
  RUN_CMD="bash \$HOME/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh $RESTART_ARG"
  if adb shell am startservice -n com.termux/com.termux.app.RunCommandService \
    -e com.termux.RUN_COMMAND_PATH "$TERMUX_HOME/../usr/bin/bash" \
    -e com.termux.RUN_COMMAND_ARGUMENTS "-c,$RUN_CMD" \
    -e com.termux.RUN_COMMAND_WORKDIR "$TERMUX_HOME" 2>/dev/null; then
    echo "Proot bootstrap started in Termux. Check the Termux app for progress."
    echo "Done. On the Pixel: Chrome → http://127.0.0.1:18888"
    exit 0
  fi
  echo "RunCommandService failed. Open Termux on the Pixel and run: bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh $RESTART_ARG"
  exit 1
fi

# --- SSH path ---
if [ -z "$USE_ADB" ] && nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null; then
  if ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" "echo ok" 2>/dev/null | grep -q "ok"; then
    echo "Pixel: $PIXEL_IP (SSH) — pushing JARVIS..."
    bash "$SCRIPT_DIR/push-jarvis-to-pixel-ssh.sh" "$PIXEL_IP" || exit 1
    if [ -n "$PUSH_ONLY" ]; then
      echo "Push done (--push-only). On the Pixel, in Termux or an existing SSH session, run:"
      echo "  bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh $RESTART_ARG"
      exit 0
    fi
    echo "Running Proot bootstrap and start on Pixel..."
    ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" \
      "export HOME=\${HOME:-/data/data/com.termux/files/home}; JARVIS=\"\$HOME/JARVIS\"; [ -d \"\$JARVIS\" ] || JARVIS=/data/data/com.termux/files/home/JARVIS; if [ ! -f \"\$JARVIS/scripts/pixel-proot-bootstrap-and-start.sh\" ]; then echo \"Missing \$JARVIS/scripts/pixel-proot-bootstrap-and-start.sh — push succeeded?\"; exit 1; fi; bash \"\$JARVIS/scripts/pixel-proot-bootstrap-and-start.sh\" $RESTART_ARG"
    echo ""
    echo "Done. On the Pixel: Chrome → http://127.0.0.1:18888"
    exit 0
  fi
fi

# --- ADB fallback ---
if adb devices | grep -qE 'device$'; then
  echo "Pixel: $PIXEL_IP (SSH not passwordless or unreachable; using ADB)"
  echo "Pushing JARVIS + neural-farm to Pixel..."
  bash "$SCRIPT_DIR/push-jarvis-to-pixel.sh" "${PIXEL_IP:-10.1.10.50}" 2>/dev/null || true
  adb push "$SCRIPT_DIR/pixel-proot-adb-launcher.sh" /sdcard/Download/ 2>/dev/null || true
  if [ -n "$PUSH_ONLY" ]; then
    echo "Push done (--push-only). On the Pixel, open Termux and run:"
    echo "  bash /storage/emulated/0/Download/pixel-proot-adb-launcher.sh $RESTART_ARG"
    exit 0
  fi
  TERMUX_HOME="/data/data/com.termux/files/home"
  LAUNCHER="/storage/emulated/0/Download/pixel-proot-adb-launcher.sh"
  if adb shell am startservice -n com.termux/com.termux.app.RunCommandService \
    -e com.termux.RUN_COMMAND_PATH "$TERMUX_HOME/../usr/bin/bash" \
    -e com.termux.RUN_COMMAND_ARGUMENTS "-c,bash $LAUNCHER $RESTART_ARG" \
    -e com.termux.RUN_COMMAND_WORKDIR "$TERMUX_HOME" 2>/dev/null; then
    echo "Proot bootstrap started in Termux. Check the Termux app for progress."
    exit 0
  fi
  # RunCommand failed — try ADB input simulation (Termux must be open)
  echo "RunCommand unavailable; sending command via ADB input (ensure Termux is open)..."
  adb shell am start -n com.termux/com.termux.app.TermuxActivity 2>/dev/null || true
  sleep 2
  adb shell input text "bash /storage/emulated/0/Download/pixel-proot-adb-launcher.sh $RESTART_ARG"
  adb shell input keyevent 66
  echo "Command sent. Check Termux on the Pixel."
  exit 0
fi

echo ""
echo ">>> Could not run. Options:"
echo "  1. On the Pixel: open Termux, run:  sshd"
echo "  2. On the Mac:  ./scripts/setup-ssh-keys-to-pixel.sh  (then re-run this script)"
echo "  3. Or from Pixel Termux:  bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh $RESTART_ARG"
echo ""
exit 1
