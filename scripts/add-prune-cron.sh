#!/bin/bash
# Print a cron line to run JARVIS memory prune weekly. Run --dry-run first, then add: crontab -e
# Or: ./scripts/add-prune-cron.sh >> crontab (then crontab crontab)

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${LOG_DIR:-$REPO_ROOT/logs}"
mkdir -p "$LOG_DIR"

echo "# JARVIS memory prune: cap session_messages, remove stale session_summaries (weekly Sun 2 AM)"
echo "0 2 * * 0 cd \"$REPO_ROOT\" && node scripts/prune-jarvis-memory.js --max-messages-per-session 100 --session-max-age-days 30 >> \"$LOG_DIR/prune.log\" 2>&1"
