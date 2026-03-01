#!/usr/bin/env bash
# Stop the JARVIS stack on the Pixel (Termux and/or Proot). Run ON the Pixel in Termux.
# Usage: bash ~/JARVIS/scripts/pixel-stop-stack.sh

echo "Stopping JARVIS stack..."
pkill -f inferrlm_adapter 2>/dev/null || true
pkill -f "pixel-inferrlm-proxy" 2>/dev/null || true
pkill -f "litellm.*config" 2>/dev/null || true
pkill -f "clawdbot gateway" 2>/dev/null || true
pkill -f "gateway run" 2>/dev/null || true
pkill -f pixel-chat-server 2>/dev/null || true
pkill -f pixel-llm-router 2>/dev/null || true
pkill -f webhook-trigger-server 2>/dev/null || true
pkill -f iphone-vision-bridge 2>/dev/null || true
sleep 1
echo "Done. Ports 4000, 8888, 18789, 18888, 18890, 18791, 18792 should be free."
