#!/usr/bin/env bash
# Check Vercel + Supabase + Edge + deployed UI (CLI/API).
# Run from repo root or apps/jarvis-ui. Requires: vercel CLI, supabase CLI, curl.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/../../.." 2>/dev/null && pwd)"
REPO_ROOT="${REPO_ROOT:-.}"
cd "$REPO_ROOT"

echo "=== 1. Vercel env (jarvis-ui) ==="
(cd apps/jarvis-ui && vercel env ls 2>/dev/null) || echo "Run from repo with vercel linked: cd apps/jarvis-ui && vercel env ls"

echo ""
echo "=== 2. Supabase Edge secrets (linked project) ==="
(supabase secrets list 2>/dev/null) || echo "Run from repo with supabase linked: supabase secrets list"

EDGE_URL="${EDGE_URL:-https://rbfzlqmkwhbvrrfdcain.supabase.co/functions/v1/jarvis}"
echo ""
echo "=== 3. Edge GET (health) ==="
CODE=$(curl -s -o /tmp/edge_get.json -w "%{http_code}" "$EDGE_URL")
echo "HTTP $CODE"
cat /tmp/edge_get.json 2>/dev/null | head -1
echo ""

echo "=== 4. Edge POST (chat) – no auth ==="
CODE=$(curl -s -o /tmp/edge_post.json -w "%{http_code}" -X POST "$EDGE_URL" -H "Content-Type: application/json" -d '{"message":"hi"}')
echo "HTTP $CODE"
cat /tmp/edge_post.json 2>/dev/null | head -1
echo ""
if [ "$CODE" = "502" ]; then
  echo "  -> 502 usually means Edge → gateway failed (gateway down or CLAWDBOT_GATEWAY_TOKEN / JARVIS_GATEWAY_URL wrong). Check Supabase Edge logs."
fi

DEPLOY_URL="${DEPLOY_URL:-https://jarvis-ui-xi.vercel.app}"
echo "=== 5. Deployed UI /api/health ==="
CODE=$(curl -s -o /tmp/ui_health.json -w "%{http_code}" "$DEPLOY_URL/api/health")
echo "HTTP $CODE"
cat /tmp/ui_health.json 2>/dev/null | head -1
echo ""

SUPABASE_REF="${SUPABASE_REF:-rbfzlqmkwhbvrrfdcain}"
echo "=== 6. Supabase Edge function logs ==="
if [ -n "$SUPABASE_ACCESS_TOKEN" ]; then
  LOGS_RESP=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
    "https://api.supabase.com/v1/projects/${SUPABASE_REF}/analytics/endpoints/logs.all" 2>/dev/null)
  LOGS_HTTP=$(echo "$LOGS_RESP" | tail -1)
  LOGS_BODY=$(echo "$LOGS_RESP" | sed '$d')
  if [ "$LOGS_HTTP" = "200" ]; then
    echo "API 200. Sample (last 1 min of edge_logs):"
    echo "$LOGS_BODY" | head -c 1200
    echo ""
  else
    echo "API HTTP $LOGS_HTTP (PAT may need scope). Dashboard: https://supabase.com/dashboard/project/${SUPABASE_REF}/functions/jarvis/logs"
  fi
else
  echo "Set SUPABASE_ACCESS_TOKEN (Supabase PAT from https://supabase.com/dashboard/account/tokens) to fetch logs via API."
  echo "Dashboard: https://supabase.com/dashboard/project/${SUPABASE_REF}/functions/jarvis/logs"
fi
echo ""

echo "Done. Fix 502: ensure JARVIS_GATEWAY_URL is reachable from Supabase and CLAWDBOT_GATEWAY_TOKEN matches the gateway."
