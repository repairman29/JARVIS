# CLAWDBOT Repo Index

Quick reference for where things live and what to use.

## Olive (separate repo)

**Olive** (shopolive.xyz — Kroger add-to-cart, Connect Success, First Haul) lives in **[repairman29/olive](https://github.com/repairman29/olive)**. App, e2e, Kroger OAuth, and cartpilot deploy are there.

## Skills (JARVIS)

| Path | Purpose |
|------|--------|
| **skills/kroger/** | Kroger/King Soopers: product search, cart, OAuth helper. Used by JARVIS “add to cart”. |
| **jarvis/** | JARVIS agent config, tools, skills (calculator, launcher, etc.). |
| **skills/** | All skills (kroger, launcher, github, etc.). |

## Key docs

| Doc | Use |
|-----|-----|
| **README.md** | Project overview, quick start. |
| **DEVELOPER_GUIDE.md** | Full setup, config, skills, troubleshooting. |
| **RUNBOOK.md** | Day-to-day ops. |

## Root markdown (reference)

- **DEPLOYMENT-*.md**, **FINAL-DEPLOYMENT-STATUS.md**, **DNS-SETUP.md**, **MANUAL-DNS-STEPS.md** — Historical deployment/DNS notes.
- **JARVIS_*.md**, **ROG_ALLY_SETUP.md**, **LOCAL_JARVIS_GUIDE.md** — JARVIS setup and modes.
- **DISCORD_SETUP.md**, **SUPABASE_MCP_SETUP.md** — Integrations.
- **CREDENTIALS_NOTE.md** — Ignored by .gitignore; do not commit.

## Ignored (no commit)

- `.env`, `.env.*`, `.clawdbot/`, `secrets/`, `CREDENTIALS_NOTE.md`
- `node_modules/`, `dist/`, `build/`, `out/`
