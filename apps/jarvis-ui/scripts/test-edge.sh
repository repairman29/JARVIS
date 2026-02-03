#!/usr/bin/env bash
# Test JARVIS UI in Edge mode: config must show mode=edge, health ok, chat 200.
# Run with dev server already up. Start server from apps/jarvis-ui so .env.local is loaded:
#   cd apps/jarvis-ui && npm run dev
# Usage: ./scripts/test-edge.sh [BASE_URL]
# Example: ./scripts/test-edge.sh http://localhost:3001

set -e
BASE="${1:-http://localhost:3001}"
FAIL=0

echo "=== JARVIS UI Edge mode test (base: $BASE) ==="

echo -n "GET /api/config (expect mode=edge) ... "
CONFIG=$(curl -s "$BASE/api/config" 2>/dev/null || echo "{}")
if echo "$CONFIG" | grep -q '"mode":"edge"'; then
  echo "OK (mode=edge)"
else
  echo "FAIL (mode is not edge; got: $CONFIG)"
  echo "  → Restart dev server from apps/jarvis-ui so .env.local is loaded: cd apps/jarvis-ui && npm run dev"
  FAIL=1
fi

echo -n "GET /api/health (expect ok=true) ... "
HEALTH=$(curl -s "$BASE/api/health" 2>/dev/null || echo "{}")
if echo "$HEALTH" | grep -q '"ok":true'; then
  echo "OK"
else
  echo "FAIL ($HEALTH)"
  FAIL=1
fi

echo -n "POST /api/chat (stream, expect 200) ... "
CHAT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hi"}],"sessionId":"edge-test","stream":true}' \
  --max-time 20 2>/dev/null || echo "000")
if [ "$CHAT_CODE" = "200" ]; then
  echo "OK (200)"
else
  echo "FAIL ($CHAT_CODE)"
  FAIL=1
fi

echo "=== Edge test done (fail=$FAIL) ==="
exit $FAIL
