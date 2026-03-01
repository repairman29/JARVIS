#!/usr/bin/env bash
# Do it all from the Mac: start JARVIS on the Pixel (Proot) and tail logs.
# Prefers SSH (no Termux Run command or storage setup needed). Falls back to ADB.
#
# One-time for SSH: on Pixel run 'sshd' in Termux; on Mac run ./scripts/setup-ssh-keys-to-pixel.sh
# Usage: bash scripts/pixel-do-it-all.sh [pixel-ip-or-adb-serial]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"
USER="${TERMUX_USER:-u0_a310}"
PORT="8022"
ARG="${1:-}"

one_time_steps() {
  echo ""
  echo ">>> One-time on the Pixel (do these once):"
  echo "  1. Open Termux → run:  termux-setup-storage   (allow when prompted)."
  echo "  2. Termux → Settings → Run command: allow (so Mac can start JARVIS via ADB)."
  echo "  3. In Termux run once:  bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh"
  echo "  Then from Mac you can run:  bash scripts/pixel-do-it-all.sh"
  echo ""
}

# Resolve device: for SSH we need IP; for ADB we need serial (can be IP:port)
PIXEL_IP=""
ADB_DEVICE=""
if [ -n "$ARG" ]; then
  if adb devices | grep -qE "^$ARG"; then
    ADB_DEVICE="$ARG"
  else
    PIXEL_IP="$ARG"
    echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
  fi
fi
if [ -z "$ADB_DEVICE" ]; then
  ADB_DEVICE=$(adb devices | grep -E 'device$' | grep -v emulator | head -1 | awk '{print $1}')
fi
if [ -z "$PIXEL_IP" ]; then
  [ -f "$CACHE_FILE" ] && PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
  [ -z "$PIXEL_IP" ] && PIXEL_IP="${ADB_DEVICE%%:*}"
  [ -z "$PIXEL_IP" ] && PIXEL_IP="192.168.86.209"
fi

echo "=== Pixel: start JARVIS (Proot) + tail logs ==="
echo "  SSH target: $PIXEL_IP  ADB device: ${ADB_DEVICE:-none}"
echo ""

# --- 1) Try SSH (push + start + tail) ---
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=8 -o BatchMode=yes"
if nc -z -w 3 "$PIXEL_IP" "$PORT" 2>/dev/null && \
   ssh -p "$PORT" $SSH_OPTS "$USER@$PIXEL_IP" "echo ok" 2>/dev/null | grep -q "ok"; then
  echo "[1/2] Starting JARVIS via SSH..."
  bash "$SCRIPT_DIR/pixel-sync-and-start-proot.sh" "$PIXEL_IP" || true
  sleep 3
  echo ""
  echo "[2/2] Tailing logs (SSH)..."
  bash "$SCRIPT_DIR/tail-pixel-jarvis-boot.sh" "$PIXEL_IP" 2>/dev/null || true
  echo ""
  echo "Done. On Pixel: Chrome → http://127.0.0.1:18888"
  exit 0
fi

# --- 2) ADB: start then tail ---
if [ -z "$ADB_DEVICE" ]; then
  echo "No ADB device. Connect the Pixel (USB or Wi‑Fi debugging)."
  one_time_steps
  exit 1
fi

ADB="adb -s $ADB_DEVICE"
export ADB_SERIAL="$ADB_DEVICE"
echo "[1/2] Starting JARVIS via ADB (Proot)..."
if bash "$SCRIPT_DIR/pixel-sync-and-start-proot.sh" --adb 2>/dev/null; then
  echo "Bootstrap started in Termux."
else
  echo "RunCommand didn't start (see one-time steps below if needed)."
fi

echo "Waiting 8s for bootstrap to write logs..."
sleep 8

echo ""
echo "[2/2] Copying logs from Pixel and tailing..."
bash "$SCRIPT_DIR/tail-pixel-jarvis-boot.sh" "$ADB_DEVICE" 2>/dev/null || true

echo ""
echo "---"
echo "On the Pixel: Chrome → http://127.0.0.1:18888"
echo ""

# If tail found nothing, print one-time steps
if ! $ADB pull /sdcard/Download/jarvis-boot.log /dev/null 2>/dev/null && \
   ! $ADB pull /sdcard/Download/gateway.log /dev/null 2>/dev/null; then
  one_time_steps
fi
exit 0
