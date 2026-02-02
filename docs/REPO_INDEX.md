# CLAWDBOT Repo Index

Quick reference for where things live and what to use.

## Olive (separate repo)

**Olive** (shopolive.xyz — Kroger add-to-cart, Connect Success, First Haul) lives in **[repairman29/olive](https://github.com/repairman29/olive)**. App, e2e, Kroger OAuth, and cartpilot deploy are there.

| Doc | Use |
|-----|-----|
| **docs/OLIVE_PROJECT_README.md** | Olive overview, try it, **give feedback**, beta testers, expansion/contributors. Use this for friends & family and to onboard testers. |
| **docs/OLIVE_LIST_PARSING_SPEC.md** | Olive list/Smart Paste: use **intelligent parser, not AI**; rate limits and abuse controls. Implementation in Olive repo. |
| **docs/OLIVE_NOTES_FOR_TRANSFER.md** | Olive notes to copy when opening Olive repo: parser requirement, verify checklist, doc references. |

## Skills (JARVIS)

| Path | Purpose |
|------|--------|
| **skills/kroger/** | Kroger/King Soopers: product search, cart, OAuth helper. Used by JARVIS “add to cart”. |
| **skills/pr/** | Public Relations / comms: key messages, press outline, social templates, media pitch, comms brief. |
| **skills/pull-request/** | GitHub pull requests: list, create, get, merge, comment, review, request reviewers. Uses GITHUB_TOKEN. |
| **skills/video-creation/** | Demo videos: Playwright recording, ffmpeg (MP4, GIF), voiceover. Used for Olive promo. |
| **jarvis/** | JARVIS agent config, tools, skills (calculator, launcher, etc.). |
| **skills/** | All skills (kroger, launcher, github, pr, pull-request, video-creation, etc.). |

## Key docs

| Doc | Use |
|-----|-----|
| **docs/DOCUMENTATION_MAP.md** | **How docs are organized;** start here by topic (Edge/Supabase, Olive, Vault, agent). Links to REPO_INDEX, onboarding, key docs. |
| **docs/PUBLIC_REPO_CHECKLIST.md** | **Before public push:** strip internal refs, replace Supabase project refs with YOUR_PROJECT_REF, use repos.json.example / products.json.example; quick scan commands. |
| **docs/CURSOR_SESSION_ONBOARDING.md** | **Teach another Cursor session:** what to read first (REPO_INDEX, TOOLS, AGENTS), rules, @ mentions, Edge/Supabase. |
| **README.md** | Project overview, quick start. |
| **DEVELOPER_GUIDE.md** | Full setup, config, skills, troubleshooting. |
| **RUNBOOK.md** | Day-to-day ops. |
| **docs/OLIVE_PROJECT_README.md** | Olive: try it, feedback, beta testers, expansion (friends & family). |
| **docs/JARVIS_UI_DEVELOPER_SPEC.md** | What a developer wants from a JARVIS chat UI — product/UX spec for web or desktop. |
| **docs/JARVIS_UI_ROADMAP.md** | Phased roadmap for the JARVIS UI (foundation → readability → context → polish). |
| **docs/JARVIS_OLIVE_VIDEO_PROMO.md** | JARVIS Olive (shopolive.xyz) video promo: MP4, GIFs, pipeline; run `./scripts/olive-promo-video.sh`. |
| **docs/JARVIS_MCP_SUPABASE.md** | JARVIS MCP: use Supabase (Edge Function + Vault) to expose JARVIS as MCP tools in Cursor. Spec and checklist. |
| **supabase/README.md** | Host and call JARVIS on Supabase: deploy `jarvis` Edge Function, set secrets, call from anywhere (REST). |
| **docs/JARVIS_EDGE_WHAT_CHANGES.md** | What changes when running JARVIS via the Edge Function; what it opens up (scripts, apps, MCP, sharing). |
| **docs/JARVIS_UPDATES_AND_ENHANCEMENTS.md** | What to update/change now; what we can enhance next (Edge, UI→Edge, MCP, streaming). |
| **docs/JARVIS_MCP_CURSOR.md** | Add JARVIS as MCP server in Cursor (URL, tool jarvis_chat, auth). |
| **docs/JARVIS_SUPERPOWERS_UNLOCKED.md** | What this setup unlocks (one URL, MCP, web search/clock, Vault, UI→Edge) and why it’s good. |

## Apps

| App | Use |
|-----|-----|
| **apps/jarvis-ui/** | JARVIS chat UI — Next.js app; talks to Clawdbot gateway (streaming, markdown, session). `cd apps/jarvis-ui && npm run dev` → http://localhost:3001 |

## Olive feedback & expansion (docs/)

- **docs/OLIVE_PROJECT_README.md** — Full overview: try Olive, give feedback, beta testers, expansion.
- **docs/OLIVE_FEEDBACK.md** — Short “how to give feedback” (copy into Olive repo as FEEDBACK.md if desired).
- **docs/OLIVE_READY_FOR_EXPANSION.md** — Checklist: docs done, Olive repo to-dos, feedback channels, before sharing.

## Root markdown (reference)

- **DEPLOYMENT-*.md**, **FINAL-DEPLOYMENT-STATUS.md**, **DNS-SETUP.md**, **MANUAL-DNS-STEPS.md** — Historical deployment/DNS notes.
- **JARVIS_*.md**, **ROG_ALLY_SETUP.md**, **LOCAL_JARVIS_GUIDE.md** — JARVIS setup and modes.
- **DISCORD_SETUP.md**, **SUPABASE_MCP_SETUP.md** — Integrations. **docs/JARVIS_MCP_SUPABASE.md** — JARVIS MCP on Supabase (optional).
- **CREDENTIALS_NOTE.md** — Ignored by .gitignore; do not commit.

## Ignored (no commit)

- `.env`, `.env.*`, `.clawdbot/`, `secrets/`, `CREDENTIALS_NOTE.md`
- `node_modules/`, `dist/`, `build/`, `out/`
