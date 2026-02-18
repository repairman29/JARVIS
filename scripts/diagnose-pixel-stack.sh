#!/usr/bin/env bash
# Run on the Pixel in Termux (or via ssh-pixel-diagnose.sh): see why Proxy/Gateway show 000.
export HOME="${HOME:-/data/data/com.termux/files/home}"
echo "=== JARVIS stack diagnostic ==="
echo ""
echo "--- Ports (is anything listening?) ---"
for port in 8889 4000 18789 18888; do
  if nc -z 127.0.0.1 "$port" 2>/dev/null; then
    echo "  $port: open"
  elif curl -s -o /dev/null -w "" --connect-timeout 1 "http://127.0.0.1:$port/" 2>/dev/null; then
    echo "  $port: open (curl)"
  else
    echo "  $port: closed"
  fi
done
echo ""
echo "--- Processes ---"
pgrep -af "inferrlm_adapter|litellm|clawdbot|pixel-chat" 2>/dev/null || true
echo ""
echo "--- InferrLM (8889) - must be ON in the app ---"
curl -s -o /dev/null -w "  HTTP %{http_code}\n" --connect-timeout 2 http://127.0.0.1:8889/ 2>/dev/null || echo "  unreachable (start InferrLM app, Server ON)"
echo ""
echo "--- Last 15 lines: gateway.log ---"
tail -15 "$HOME/gateway.log" 2>/dev/null || echo "(no file)"
echo ""
echo "--- Last 15 lines: litellm.log ---"
tail -15 "$HOME/litellm.log" 2>/dev/null || echo "(no file)"
echo ""
echo "--- Last 10 lines: adapter.log ---"
tail -10 "$HOME/adapter.log" 2>/dev/null || echo "(no file)"
echo ""
echo "--- JARVIS dir ---"
ls -la "$HOME/JARVIS/scripts/pixel-chat-server.js" 2>/dev/null && echo "  JARVIS present" || echo "  JARVIS missing or path wrong"
echo ""
echo "--- If Proxy 000: run  pip install litellm[proxy]   then restart ---"
echo "--- If Gateway 000 (EACCES /tmp/clawdbot): push latest scripts (they set TMPDIR=~/tmp) ---"
