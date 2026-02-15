#!/usr/bin/env bash
# Download Termux + Termux:API (GitHub debug builds, matching signatures) and push to Pixel.
# Then you install them on the Pixel: open Files → Downloads, tap each APK, Install.
# Usage: ./scripts/push-termux-github-apks-to-pixel.sh [pixel-ip]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUT="$JARVIS_ROOT/.termux-apks"
USER="jefe"
PORT="8022"
CACHE_FILE="$JARVIS_ROOT/.pixel-ip"

# Termux app (latest beta for Android 14+, arm64 for Pixel 8 Pro) and Termux:API (github.debug = same key)
TERMUX_URL="https://github.com/termux/termux-app/releases/download/v0.119.0-beta.3/termux-app_v0.119.0-beta.3+apt-android-7-github-debug_arm64-v8a.apk"
TERMUX_API_URL="https://github.com/termux/termux-api/releases/download/v0.53.0/termux-api-app_v0.53.0+github.debug.apk"

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

mkdir -p "$OUT"
cd "$OUT"

echo "=== Downloading GitHub APKs (matching signatures) ==="
curl -sL -o termux-app_github-debug_arm64-v8a.apk "$TERMUX_URL" && echo "  Termux OK"
curl -sL -o termux-api-app_github.debug.apk "$TERMUX_API_URL" && echo "  Termux:API OK"

if ! nc -z -w 5 "$PIXEL_IP" "$PORT" 2>/dev/null; then
  echo ""
  echo "Cannot reach $PIXEL_IP:$PORT. Start Termux on the Pixel, run: sshd"
  echo ""
  echo "Copy the APKs to the Pixel another way:"
  echo "  1. USB: Connect Pixel, copy from Mac folder:"
  echo "     $OUT"
  echo "     Files: termux-app_github-debug_arm64-v8a.apk  and  termux-api-app_github.debug.apk"
  echo "  2. Or on this Mac run:  cd $OUT && python3 -m http.server 8080"
  echo "     On Pixel (same Wi-Fi) open Chrome: http://<YOUR_MAC_IP>:8080  and download the two .apk files."
  echo "       (Find Mac IP: System Settings → Network → Wi-Fi → Details, or run: ipconfig getifaddr en0)"
  echo ""
  exit 1
fi

echo ""
echo "=== Pushing to Pixel (storage/downloads) ==="
SCP_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"
scp -P "$PORT" $SCP_OPTS termux-app_github-debug_arm64-v8a.apk termux-api-app_github.debug.apk "$USER@$PIXEL_IP:storage/downloads/"

echo ""
echo "Done. On your Pixel:"
echo "  1. Uninstall existing Termux and Termux:API (if any)."
echo "  2. Open Files → Downloads (or open the Downloads folder)."
echo "  3. Tap termux-app_github-debug_arm64-v8a.apk → Install (allow from this source if asked)."
echo "  4. Tap termux-api-app_github.debug.apk → Install."
echo "  5. Open Termux → pkg update && pkg install nodejs python pulseaudio sox alsa-utils termux-api termux-exec git -y"
echo "  6. Settings → Apps → Termux:API → Permissions → Location ON."
echo "  7. From Mac: cd ~/JARVIS && bash scripts/push-jarvis-to-pixel-ssh.sh"
