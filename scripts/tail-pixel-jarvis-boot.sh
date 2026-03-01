#!/usr/bin/env bash
# From the Mac: tail Pixel JARVIS logs. Prefers SSH (no Termux setup); falls back to ADB (copy to Download then pull).
# Usage: ./scripts/tail-pixel-jarvis-boot.sh [pixel-ip] [--follow]
#   With SSH: tail ~/jarvis-boot.log (and gateway.log etc.) directly. One-time: sshd in Termux, setup-ssh-keys-to-pixel.sh on Mac.
#   With ADB: copies logs to Download then pulls (needs termux-setup-storage on Pixel).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
LINES="${TAIL_LINES:-80}"

FOLLOW=""
PIXEL_IP=""
ADB_DEVICE=""
for arg in "$@"; do
  [ "$arg" = "--follow" ] && FOLLOW=1 && continue
  if [ -n "$arg" ]; then
    if echo "$arg" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+$'; then
      ADB_DEVICE="$arg"
      PIXEL_IP="${arg%%:*}"
    else
      PIXEL_IP="$arg"
    fi
    break
  fi
done
[ -z "$PIXEL_IP" ] && [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
[ -z "$PIXEL_IP" ] && PIXEL_IP="${JARVIS_PIXEL_IP:-192.168.86.209}"
[ -z "$ADB_DEVICE" ] && ADB_DEVICE=$(adb devices | grep -E 'device$' | grep -v emulator | head -1 | awk '{print $1}')
[ -z "$ADB_DEVICE" ] && ADB_DEVICE="$PIXEL_IP"

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=6 -o BatchMode=yes -p $PORT"

# --- SSH path: tail directly on Pixel ---
if nc -z -w 3 "$PIXEL_IP" "$PORT" 2>/dev/null && ssh $SSH_OPTS "$USER@$PIXEL_IP" "echo ok" 2>/dev/null | grep -q "ok"; then
  echo "=== JARVIS logs on $PIXEL_IP (SSH) ==="
  if [ -n "$FOLLOW" ]; then
    ssh $SSH_OPTS "$USER@$PIXEL_IP" "tail -f ~/jarvis-boot.log 2>/dev/null || tail -f ~/gateway.log 2>/dev/null || tail -f ~/litellm.log 2>/dev/null || echo '(no log found)'"
  else
    FOUND=0
    for log in jarvis-boot.log gateway.log litellm.log; do
      OUT=$(ssh $SSH_OPTS "$USER@$PIXEL_IP" "tail -n $LINES ~/$log 2>/dev/null" || true)
      if [ -n "$OUT" ]; then
        echo "=== $log (last $LINES) ==="
        echo "$OUT"
        echo ""
        FOUND=1
      fi
    done
    [ "$FOUND" = "0" ] && ssh $SSH_OPTS "$USER@$PIXEL_IP" "tail -n $LINES ~/jarvis-boot.log 2>/dev/null || echo 'No jarvis-boot.log yet. Start JARVIS: bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh'"
  fi
  exit 0
fi

# --- ADB fallback: copy to Download then pull ---
[ -z "$ADB_DEVICE" ] && { echo "No SSH and no ADB device. Start sshd in Termux and run setup-ssh-keys-to-pixel.sh, or connect Pixel via ADB."; exit 1; }
ADB="adb -s $ADB_DEVICE"
TERMUX_HOME="/data/data/com.termux/files/home"

run_copy() {
  $ADB push "$SCRIPT_DIR/termux-copy-boot-log.sh" /sdcard/Download/termux-copy-boot-log.sh 2>/dev/null || true
  $ADB shell am startservice -n com.termux/com.termux.app.RunCommandService \
    -e com.termux.RUN_COMMAND_PATH "$TERMUX_HOME/../usr/bin/bash" \
    -e com.termux.RUN_COMMAND_ARGUMENTS "-c,bash $TERMUX_HOME/storage/downloads/termux-copy-boot-log.sh 2>/dev/null || bash /sdcard/Download/termux-copy-boot-log.sh" \
    -e com.termux.RUN_COMMAND_WORKDIR "$TERMUX_HOME" 2>/dev/null || true
}

pull_tail() {
  run_copy
  sleep 2
  TMP=$(mktemp)
  for log in jarvis-boot.log gateway.log litellm.log plan-execute.log heartbeat.log; do
    if $ADB pull "/sdcard/Download/$log" "$TMP" 2>/dev/null || \
       $ADB pull "/storage/emulated/0/Download/$log" "$TMP" 2>/dev/null; then
      echo "=== $log (last ${LINES}) [ADB] ==="
      tail -n "${LINES}" "$TMP"
      rm -f "$TMP"
      return 0
    fi
  done
  rm -f "$TMP"
  echo "No JARVIS logs in Download yet. Use SSH (sshd + setup-ssh-keys-to-pixel.sh) to tail without ADB."
  exit 1
}

if [ -n "$FOLLOW" ]; then
  echo "Following logs on $ADB_DEVICE (ADB; every 5s; Ctrl+C to stop)"
  LINES=30
  while true; do pull_tail; echo "---"; sleep 5; done
else
  echo "=== JARVIS logs on $ADB_DEVICE (ADB) ==="
  pull_tail
fi
