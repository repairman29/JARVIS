#!/bin/bash
# Print a cron line to run JARVIS watchdog every 5 min. Add it with: crontab -e
# Or run this and pipe to crontab: ./add-watchdog-cron.sh | crontab -

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${HOME}/.jarvis/health"
mkdir -p "$LOG_DIR"

echo "# JARVIS Watchdog: check Ollama + gateway, restart gateway if down (every 5 min)"
echo "*/5 * * * * cd \"$REPO_ROOT\" && node scripts/watchdog-jarvis-local.js >> \"$LOG_DIR/watchdog.log\" 2>&1"
