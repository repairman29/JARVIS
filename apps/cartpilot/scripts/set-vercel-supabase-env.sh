#!/usr/bin/env bash
# Add Olive's Supabase anon key to Vercel production.
# Get the key from: https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/settings/api (anon public)
#
# Usage:
#   NEXT_PUBLIC_SUPABASE_ANON_KEY='eyJ...' ./scripts/set-vercel-supabase-env.sh
#   ./scripts/set-vercel-supabase-env.sh 'eyJ...'
#   echo 'eyJ...' | ./scripts/set-vercel-supabase-env.sh

set -e
KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-$1}"
if [[ -z "$KEY" ]]; then
  if [[ -t 0 ]]; then
    echo "Paste the anon public key from rbfzlqmkwhbvrrfdcain → API, then Ctrl-D:"
    KEY=$(cat)
  else
    KEY=$(cat)
  fi
fi
KEY=$(echo -n "$KEY" | tr -d '[:space:]')
if [[ -z "$KEY" ]]; then
  echo "No key provided." >&2
  exit 1
fi
echo -n "$KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "Done. Redeploy the project for changes to take effect."
