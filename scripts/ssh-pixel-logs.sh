#!/usr/bin/env bash
# From the Mac: SSH into Termux and print JARVIS logs (gateway, plan-execute, curl checks).
# You will be prompted for your Termux user password (the one you set with passwd).
# Prereq: Pixel on same Wi‑Fi, SSH in Termux (sshd on 8022), username jefe.
# Usage: ./scripts/ssh-pixel-logs.sh [pixel-ip]
# If no IP given: tries ADB, then cached IP from last successful ADB, then default.

USER="jefe"
PORT="8022"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_FILE="$SCRIPT_DIR/../.pixel-ip"

if [ -n "$1" ]; then
  PIXEL_IP="$1"
  echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
  echo "Using Pixel IP: $PIXEL_IP"
else
  # 1) Try ADB when Pixel is connected (USB or adb connect)
  PIXEL_IP=$(adb shell "ip -4 addr show wlan0 2>/dev/null" 2>/dev/null | awk '/inet / {gsub(/\/.*/,""); print $2}' | head -1)
  PIXEL_IP=$(echo "$PIXEL_IP" | tr -d '\r\n \t')
  if [ -n "$PIXEL_IP" ]; then
    echo "$PIXEL_IP" > "$CACHE_FILE" 2>/dev/null || true
    echo "Using Pixel IP: $PIXEL_IP (from ADB)"
  else
    # 2) Use last-known IP from cache (from when ADB worked)
    if [ -f "$CACHE_FILE" ]; then
      PIXEL_IP=$(cat "$CACHE_FILE" | tr -d '\r\n \t')
    fi
    if [ -n "$PIXEL_IP" ]; then
      echo "Using Pixel IP: $PIXEL_IP (cached; connect Pixel via ADB once to refresh)"
    else
      PIXEL_IP="10.1.10.50"
      echo "Using Pixel IP: $PIXEL_IP (default; connect Pixel via ADB or pass IP: $0 <ip>)"
    fi
  fi
fi

# Fail fast if Pixel isn't reachable (5s max wait)
nc -z "$PIXEL_IP" "$PORT" 2>/dev/null & pid=$!
for _ in 1 2 3 4 5; do kill -0 $pid 2>/dev/null || break; sleep 1; done
kill $pid 2>/dev/null
wait $pid 2>/dev/null
if [ $? -ne 0 ]; then
  echo "Cannot reach $PIXEL_IP:$PORT within 5s (Pixel on same Wi‑Fi? sshd running in Termux?)"
  echo "Get Pixel IP in Termux: ifconfig | grep 'inet '"
  echo "Then: ./scripts/ssh-pixel-logs.sh <pixel-ip>"
  exit 1
fi

ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -o ServerAliveInterval=5 -o ServerAliveCountMax=2 -p "$PORT" "$USER@$PIXEL_IP" "bash -lc '
  echo \"=== \$(date) ===\"
  echo \"--- Gateway (last 40 lines) ---\"
  tail -40 ~/gateway.log 2>/dev/null || echo \"(no gateway.log)\"
  echo \"\"
  echo \"--- Plan-execute (last 25 lines) ---\"
  tail -25 ~/plan-execute.log 2>/dev/null || echo \"(no plan-execute.log)\"
  echo \"\"
  echo \"--- Curl 18789 ---\"
  curl -s -o /dev/null -w \"Gateway: %{http_code}\n\" http://127.0.0.1:18789/ 2>/dev/null || echo \"Gateway: unreachable\"
  echo \"--- Curl 4000 ---\"
  curl -s -o /dev/null -w \"Proxy: %{http_code}\n\" http://127.0.0.1:4000/ 2>/dev/null || echo \"Proxy: unreachable\"
'"
