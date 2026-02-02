#!/usr/bin/env bash
# E2E tests for JARVIS UI. Run with jarvis-ui dev server already up: npm run dev
# Usage: ./scripts/e2e.sh   or   bash scripts/e2e.sh

set -e
BASE="${1:-http://localhost:3001}"
FAIL=0

echo "=== JARVIS UI E2E (base: $BASE) ==="

# 1. Root returns 200
echo -n "GET / ... "
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/" 2>/dev/null || echo "000")
if [ "$CODE" = "200" ]; then echo "OK ($CODE)"; else echo "FAIL ($CODE)"; FAIL=1; fi

# 2. Health returns 200 and gateway ok
echo -n "GET /api/health ... "
BODY=$(curl -s "$BASE/api/health" 2>/dev/null || echo "{}")
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health" 2>/dev/null || echo "000")
if [ "$CODE" = "200" ]; then
  if echo "$BODY" | grep -q '"ok":true'; then echo "OK (200, gateway ok)"; else echo "FAIL (200 but ok not true)"; FAIL=1; fi
else echo "FAIL ($CODE)"; FAIL=1; fi

# 3. Chat without body returns 400
echo -n "POST /api/chat (no body) ... "
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/chat" -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "000")
if [ "$CODE" = "400" ]; then echo "OK (400)"; else echo "FAIL ($CODE)"; FAIL=1; fi

# 4. Chat with messages (stream) returns 200 or 4xx/5xx if gateway disabled
echo -n "POST /api/chat (stream) ... "
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"E2E"}],"sessionId":"e2e","stream":true}' \
  --max-time 15 2>/dev/null || echo "000")
CODE=$(echo "$RESP" | tail -n1)
BODY=$(echo "$RESP" | sed '$d' | head -c 500)
if [ "$CODE" = "200" ]; then
  if echo "$BODY" | grep -qE 'data: |choices'; then echo "OK (200 stream)"; else echo "OK (200)"; fi
elif [ "$CODE" = "405" ] || [ "$CODE" = "502" ] || [ "$CODE" = "503" ]; then
  echo "OK ($CODE — gateway chat endpoint disabled or unreachable; UI will show error)"
else
  echo "FAIL ($CODE)"; FAIL=1
fi

# 5. Chat non-streaming: must return 200 with extractable content (Clawdbot actually replied)
echo -n "POST /api/chat (non-stream, content check) ... "
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say exactly: E2E-OK"}],"sessionId":"e2e","stream":false}' \
  --max-time 60 2>/dev/null || echo "000")
CODE=$(echo "$RESP" | tail -n1)
JSON=$(echo "$RESP" | sed '$d')
if [ "$CODE" != "200" ]; then
  if [ "$CODE" = "405" ] || [ "$CODE" = "502" ] || [ "$CODE" = "503" ] || [ "$CODE" = "401" ]; then
    echo "SKIP ($CODE — gateway chat disabled/unreachable; start gateway and enable chat completions for full e2e)"
  else
    echo "FAIL ($CODE)"; FAIL=1
  fi
else
  CONTENT=$(echo "$JSON" | node -e "
    let d; try { d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); } catch (_) { process.exit(2); }
    const c = typeof d?.content === 'string' ? d.content : d?.choices?.[0]?.message?.content ?? d?.output ?? d?.response ?? '';
    console.log(typeof c === 'string' ? c : '');
 " 2>/dev/null || echo "")
  if [ -n "$CONTENT" ]; then
    echo "OK (200, content length ${#CONTENT})"
  else
    echo "FAIL (200 but no extractable content — Clawdbot did not return a reply)"
    FAIL=1
  fi
fi

echo "=== Done (fail=$FAIL) ==="
exit $FAIL
