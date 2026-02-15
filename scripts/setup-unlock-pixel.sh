#!/data/data/com.termux/files/usr/bin/bash
# Run in Termux on the Pixel: enable ntfy push + Termux:Widget one-tap.
# Usage: bash setup-unlock-pixel.sh [ntfy-topic]
# Example: bash setup-unlock-pixel.sh jarvis-pixel

set -e
HOME="${HOME:-/data/data/com.termux/files/home}"
JARVIS="${JARVIS:-$HOME/JARVIS}"
ENV_FILE="$HOME/.clawdbot/.env"
TOPIC="${1:-jarvis-pixel}"

echo "=== JARVIS unlock: ntfy + widget ==="

# 1. Ensure .clawdbot exists
mkdir -p "$(dirname "$ENV_FILE")"
[ ! -f "$ENV_FILE" ] && touch "$ENV_FILE"

# 2. Add or update NTFY_TOPIC
if grep -q "NTFY_TOPIC=" "$ENV_FILE" 2>/dev/null; then
  echo "NTFY_TOPIC already set in .clawdbot/.env"
else
  echo "" >> "$ENV_FILE"
  echo "# Push reports to phone (subscribe to this topic in ntfy app)" >> "$ENV_FILE"
  echo "NTFY_TOPIC=$TOPIC" >> "$ENV_FILE"
  echo "NTFY_URL=https://ntfy.sh" >> "$ENV_FILE"
  echo "Added NTFY_TOPIC=$TOPIC to .clawdbot/.env"
fi
echo "  Topic: $TOPIC — subscribe in the ntfy app (https://ntfy.sh/$TOPIC or in-app)"

# 3. Termux:Widget shortcuts
SHORTCUTS="$HOME/.shortcuts"
mkdir -p "$SHORTCUTS"

# Plan-execute now (run in background, show message so user sees something)
cat > "$SHORTCUTS/plan-execute.sh" << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
export HOME=/data/data/com.termux/files/home
cd "$HOME/JARVIS" 2>/dev/null || cd "$HOME/jarvis" 2>/dev/null || { echo "JARVIS dir not found"; sleep 3; exit 1; }
echo "JARVIS plan-execute starting..."
node scripts/jarvis-autonomous-plan-execute.js >> "$HOME/plan-execute.log" 2>&1 &
echo "Running in background. You'll get an ntfy push when done."
echo "Log: ~/plan-execute.log"
sleep 4
EOF

# Heartbeat now
cat > "$SHORTCUTS/heartbeat.sh" << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
export HOME=/data/data/com.termux/files/home
cd "$HOME/JARVIS" 2>/dev/null || cd "$HOME/jarvis" 2>/dev/null || { echo "JARVIS dir not found"; sleep 3; exit 1; }
echo "JARVIS heartbeat starting..."
node scripts/jarvis-autonomous-heartbeat.js >> "$HOME/heartbeat.log" 2>&1 &
echo "Running in background. You'll get an ntfy push when done."
echo "Log: ~/heartbeat.log"
sleep 4
EOF

chmod +x "$SHORTCUTS/plan-execute.sh" "$SHORTCUTS/heartbeat.sh"
echo "  Widget scripts: $SHORTCUTS/plan-execute.sh, heartbeat.sh"

# Open JARVIS chat in browser (chat server must be running: start-jarvis-pixel.sh starts it)
cat > "$SHORTCUTS/open-jarvis-chat.sh" << 'EOFCHAT'
#!/usr/bin/env bash
export HOME=/data/data/com.termux/files/home
termux-open-url "http://127.0.0.1:18888" 2>/dev/null || echo "Open Chrome and go to: http://127.0.0.1:18888"
EOFCHAT
chmod +x "$SHORTCUTS/open-jarvis-chat.sh"
echo "  Chat shortcut: $SHORTCUTS/open-jarvis-chat.sh (opens browser to chat with JARVIS)"

# Open JARVIS voice (tap mic to talk, JARVIS speaks replies)
cat > "$SHORTCUTS/open-jarvis-voice.sh" << 'EOFVOICE'
#!/usr/bin/env bash
export HOME=/data/data/com.termux/files/home
termux-open-url "http://127.0.0.1:18888/voice" 2>/dev/null || echo "Open Chrome and go to: http://127.0.0.1:18888/voice"
EOFVOICE
chmod +x "$SHORTCUTS/open-jarvis-voice.sh"
echo "  Voice shortcut: $SHORTCUTS/open-jarvis-voice.sh (tap mic to talk, JARVIS speaks replies)"

echo ""
echo "Done."
echo "1. Install 'Termux:Widget' from F-Droid, add a widget → pick 'plan-execute' or 'heartbeat'."
echo "2. Install 'ntfy' app, subscribe to topic: $TOPIC — you'll get a push when plan-execute/heartbeat finish."
echo "3. (Optional) Run a report now: bash $SHORTCUTS/plan-execute.sh"
