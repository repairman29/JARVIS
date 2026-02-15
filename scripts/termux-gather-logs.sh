#!/data/data/com.termux/files/usr/bin/bash
# Run inside Termux (or via Termux:Run): write JARVIS logs to shared storage so Mac can adb pull.
# Output: ~/storage/downloads/jarvis-logs.txt (and gateway.log snippet)

OUT="$HOME/storage/downloads/jarvis-logs.txt"
[ ! -d "$HOME/storage/downloads" ] && OUT="/sdcard/Download/jarvis-logs.txt"

{
  echo "=== $(date) ==="
  echo "--- Gateway (last 40 lines) ---"
  tail -40 "$HOME/gateway.log" 2>/dev/null || echo "(no gateway.log)"
  echo ""
  echo "--- Plan-execute (last 25 lines) ---"
  tail -25 "$HOME/plan-execute.log" 2>/dev/null || echo "(no plan-execute.log)"
  echo ""
  echo "--- Curl 18789 ---"
  curl -s -o /dev/null -w "Gateway: %{http_code}\n" http://127.0.0.1:18789/ 2>/dev/null || echo "Gateway: unreachable"
  echo "--- Curl 4000 ---"
  curl -s -o /dev/null -w "Proxy: %{http_code}\n" http://127.0.0.1:4000/ 2>/dev/null || echo "Proxy: unreachable"
} > "$OUT" 2>&1
echo "Logs written to $OUT"
