# Keep CLIs Sharp — Reference

## Last snapshot (2026-02-01)

| Item | Version |
|------|---------|
| Node | v24.4.1 |
| npm | 11.5.1 |
| Vercel | 44.6.3 |
| Railway | 4.12.0 |
| Stripe | 1.34.0 |
| Supabase | 2.67.1 |
| Fly | v0.4.6 darwin/arm64 |
| Netlify / Wrangler | not in PATH (optional) |

## npm package roots

| Path | Purpose |
|------|---------|
| `package.json` (repo root) | clawdbot, dotenv, stripe; dev: playwright. Node >=22. |
| `apps/jarvis-ui/package.json` | Next.js UI; deps include next, react, react-markdown, highlight.js; dev: @playwright/test, typescript. |
| `olive-e2e/package.json` | Olive E2E tests; Playwright. |

Check each with: `npm outdated` (and optionally `npm audit`).

## Platform CLIs (from jarvis/TOOLS.md)

| CLI | Check version | Typical install/upgrade |
|-----|----------------|--------------------------|
| Vercel | `vercel --version` | `npm i -g vercel` |
| Railway | `railway --version` | `npm i -g @railway/cli` or brew |
| Stripe | `stripe --version` | `brew upgrade stripe` or npm |
| Supabase | `supabase --version` | `brew upgrade supabase` or npm |
| Fly.io | `fly version` | `brew upgrade flyctl` |
| Netlify | `netlify --version` | `npm i -g netlify-cli` |
| Wrangler (Cloudflare) | `wrangler --version` | `npm i -g wrangler` |
| Cursor | N/A (IDE) | App update |

## Repo scripts that depend on CLIs

- **Supabase:** `supabase db push`, `supabase secrets set`, `supabase link` — used in RUNBOOK, migrations, `scripts/sync-edge-auth-token.js`.
- **Vercel:** `vercel deploy`, `vercel env pull` — apps/jarvis-ui deploy.
- **Railway:** `railway up`, `railway variables`, `railway link` — gateway deploy; see docs/JARVIS_LIFT_TO_RAILWAY.md.
- **Node:** Scripts in `scripts/` assume Node >=22 (see root package.json engines).

When you upgrade a CLI, re-run any script that uses it and update RUNBOOK or TOOLS.md if the command or behavior changed.
