#!/usr/bin/env bash
# Set Vercel project Root Directory to repo root (fix "Couldn't find any pages or app directory").
# Requires: VERCEL_TOKEN from https://vercel.com/account/tokens

set -e
PROJECT_ID="${VERCEL_PROJECT_ID:-prj_cIn34Oo8lA4BGT0RxeL2h4DxCZc0}"
TEAM_ID="${VERCEL_TEAM_ID:-team_M4vWbt0aOWZZLPTVhAoI5rSo}"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "Set VERCEL_TOKEN (create at https://vercel.com/account/tokens) and run again."
  exit 1
fi

curl -s -X PATCH "https://api.vercel.com/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory": null}' | head -c 500
echo ""
echo "Done. Root Directory is now repo root (.). Redeploy to apply."
