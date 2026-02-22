#!/usr/bin/env bash
# Set VERCEL_TOKEN (and optionally VERCEL_ORG_ID, VERCEL_PROJECT_ID) in GitHub repo secrets
# so the jarvis-ui E2E-on-preview workflow can deploy and run Playwright.
# Requires: gh CLI (brew install gh; gh auth login)
# Get token: https://vercel.com/account/tokens → Create Token (e.g. "GitHub E2E")

set -e
REPO="${GITHUB_REPO:-repairman29/JARVIS}"

echo "Repo: $REPO"
echo "You'll need a Vercel token from https://vercel.com/account/tokens"
echo ""

if ! command -v gh &>/dev/null; then
  echo "Install gh: brew install gh && gh auth login"
  exit 1
fi

echo "Paste your Vercel token (input hidden); press Enter when done."
gh secret set VERCEL_TOKEN --repo "$REPO"

echo ""
read -p "Set VERCEL_ORG_ID? (optional; from vercel project settings or 'vercel whoami') [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Paste VERCEL_ORG_ID (e.g. team_xxx); press Enter."
  gh secret set VERCEL_ORG_ID --repo "$REPO"
fi

read -p "Set VERCEL_PROJECT_ID? (optional; from .vercel/project.json or project settings) [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Paste VERCEL_PROJECT_ID; press Enter."
  gh secret set VERCEL_PROJECT_ID --repo "$REPO"
fi

echo "Done. E2E-on-preview workflow will use these secrets on the next jarvis-ui PR."
