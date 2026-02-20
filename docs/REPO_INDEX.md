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
| **skills/focus-pro/** | Focus sessions and timers; macOS `say` when session ends. Hero skill (was stub, now has real timer). |
| **skills/notion/** | Notion: search, create pages, query databases, append blocks. Hero skill. Requires NOTION_API_KEY. |
| **skills/zendesk/** | Zendesk Support: tickets (search, get, update, comments), users/groups/orgs, CSAT, SLA, triggers/automations/macros. CXO Sidekick blueprint. Env: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, ZENDESK_API_TOKEN. |
| **jarvis/** | JARVIS agent config, tools, skills (calculator, launcher, etc.). |
| **skills/** | All skills (kroger, launcher, github, pr, pull-request, video-creation, focus-pro, notion, zendesk, etc.). |

## Key docs

| Doc | Use |
|-----|-----|
| **docs/ONE_PAGE_MAP.md** | **Project got big?** One page: nodes (Neural Farm, JARVIS, Pixel, Olive), folder cheat sheet, "I want to…" table, docs/scripts by theme. Start here if lost. |
| **docs/JARVIS_PRODUCT_PLAN.md** | **JARVIS in one place:** vision, tracks (Windows/ROG, UI, modes, Edge/MCP, showcase), current state, next 6–12 months, references. Start here for “what’s the plan?” |
| **docs/PREMIUM_CLARITY.md** | **Modes, premium skills, Yellow/Hot Rod:** Blue vs Yellow vs Hot Rod; how to get Yellow or Hot Rod; where premium skills live (showcase). |
| **docs/JARVIS_GATEWAY_META.md** | **Gateway: how to send meta** — tools_used, structured_result (non-stream and streaming) for UI 2.6/2.7. |
| **docs/COMMUNITY_AND_SKILLS.md** | **Community & skills:** skill marketplace, contributors, hero/premium skills; links to CONTRIBUTING, showcase. |
| **docs/METRICS.md** | **Success metrics:** north star (active sessions), supporting KPIs (MCP, showcase, community); how to measure. |
| **docs/JARVIS_DEVELOPER_SUPREMACY.md** | **Make JARVIS unbeatable:** Navy Seal Swiss Army Ninja MI6 developer — playbook, levers (deep work, repo-knowledge, ship, triad), gaps to close. |
| **docs/JARVIS_AGENT_ORCHESTRATION.md** | **JARVIS uses autonomous systems to build products:** BEAST MODE, Code Roach, Echeo, workflow_dispatch, sessions_spawn — build flow and invocation table. |
| **docs/LOCAL_INFERENCE_AGENTS.md** | **Echeo and other agents with local inference:** Run JARVIS + Echeo (bounty hunter) and other bots on Ollama; gateway config, exec vs subagent, per-tool LLM. |
| **docs/JARVIS_AUTO_START_AND_WATCHDOG.md** | **Auto-start and keep JARVIS running:** Cursor “on folder open” task, login (LaunchAgent / Task Scheduler), watchdog (check + restart gateway). |
| **docs/PRODUCT_CAPABILITIES.md** | **What products CAN do vs. what we say:** Use repo_summary/repo_search for code-grounded capabilities; don't rely only on products.json description. |
| **docs/JARVIS_SMARTER.md** | **How we make JARVIS even smarter:** Current smarts + next-level levers (bootstrap context, cite sources, when-to-invoke, decision memory, etc.). |
| **docs/DECISIONS_MEMORY.md** | **Decision memory:** "Remember this decision" → append to DECISIONS.md; JARVIS reads it when planning or when user asks what we decided. |
| **docs/JARVIS_MEMORY.md** | **Long life + short-term vs long-term memory:** Session persistence, summarization, DECISIONS + prefs; what to implement for long life. |
| **docs/JARVIS_COFOUNDER.md** | **JARVIS as co-founder for life:** Operating system for the partnership — setup once, habits, memory, one-page map. Entry point for "work with JARVIS for the rest of your life." |
| **docs/JARVIS_MEMORY_WIRING.md** | **Wire memory to Edge/gateway:** Apply migration, implement load/append for session_messages and optional prefs; checklist. |
| **docs/JARVIS_MANY_SESSIONS.md** | **Many Cursor bots:** Stitch into one session; optional speaker so JARVIS knows which bot said what. |
| **docs/JARVIS_SCALE_AND_CONNECTIVITY.md** | **JARVIS talks to everything / scale:** One URL, one contract; add any client; scale Edge, DB, gateway. |
| **docs/JARVIS_SCALE_WHEN_NEEDED.md** | **When to scale (runbook):** You’re set up to scale; do nothing until you need it. When you do: Railway replicas or multiple gateways + LB; set JARVIS_GATEWAY_URL. |
| **docs/JARVIS_WHERE_AM_I_RUNNING.md** | **Where is JARVIS running?** Local vs Railway + Supabase; how to tell (UI env, Edge secrets, Railway dashboard). |
| **docs/JARVIS_EDGE_AUTH.md** | **Edge auth:** Required in cloud when JARVIS_AUTH_TOKEN set; no auth locally. Sync UI token: `node scripts/sync-edge-auth-token.js`. |
| **docs/HANDOFF.md** | **Handoff:** Current state, where to start, good first message for next session, likely next work. |
| **docs/JARVIS_LIFT_TO_RAILWAY.md** | **Lift JARVIS to Railway (checklist):** Step-by-step to finish the lift — Railway vars, deploy, Edge secret, optional UI → Edge. |
| **docs/JARVIS_RAILWAY.md** | **Running JARVIS on Railway:** What you get, high-level steps, caveats, troubleshooting. |
| **docs/DOCUMENTATION_MAP.md** | **How docs are organized;** start here by topic (Edge/Supabase, Olive, Vault, agent). Links to REPO_INDEX, onboarding, key docs. |
| **docs/PUBLIC_REPO_CHECKLIST.md** | **Before public push:** strip internal refs, replace Supabase project refs with YOUR_PROJECT_REF, use repos.json.example / products.json.example; quick scan commands. |
| **docs/CURSOR_SESSION_ONBOARDING.md** | **Teach another Cursor session:** what to read first (REPO_INDEX, TOOLS, AGENTS), rules, @ mentions, Edge/Supabase. |
| **README.md** | Project overview, quick start. |
| **DEVELOPER_GUIDE.md** | Full setup, config, skills, troubleshooting. |
| **RUNBOOK.md** | Day-to-day ops. |
| **docs/OLIVE_PROJECT_README.md** | Olive: try it, feedback, beta testers, expansion (friends & family). |
| **docs/JARVIS_UI_DEVELOPER_SPEC.md** | What a developer wants from a JARVIS chat UI — product/UX spec for web or desktop. |
| **docs/JARVIS_UI_ROADMAP.md** | Phased roadmap for the JARVIS UI (foundation → readability → context → polish). |
| **docs/JARVIS_UI_AUDIT.md** | Roadmap vs code: what’s already built in apps/jarvis-ui (so we don’t redo work). |
| **docs/JARVIS_UI_GATEWAY_CONTRACT.md** | Response shapes for tool visibility (2.6), structured output (2.7), run-and-copy (4.8); gateway/Edge can send when ready. |
| **docs/JARVIS_UI_DEPLOY_RAILWAY_VERCEL.md** | Deploy the JARVIS chat UI (currently localhost:3001) to Railway or Vercel; env vars, root `apps/jarvis-ui`, Edge vs gateway. |
| **docs/JARVIS_OLIVE_VIDEO_PROMO.md** | JARVIS Olive (shopolive.xyz) video promo: MP4, GIFs, pipeline; run `./scripts/olive-promo-video.sh`. |
| **docs/JARVIS_MCP_SUPABASE.md** | JARVIS MCP: use Supabase (Edge Function + Vault) to expose JARVIS as MCP tools in Cursor. Spec and checklist. |
| **supabase/README.md** | Host and call JARVIS on Supabase: deploy `jarvis` Edge Function, set secrets, call from anywhere (REST). |
| **docs/JARVIS_EDGE_WHAT_CHANGES.md** | What changes when running JARVIS via the Edge Function; what it opens up (scripts, apps, MCP, sharing). |
| **docs/JARVIS_UPDATES_AND_ENHANCEMENTS.md** | What to update/change now; what we can enhance next (Edge, UI→Edge, MCP, streaming). |
| **docs/JARVIS_MCP_CURSOR.md** | Add JARVIS as MCP server in Cursor (URL, tool jarvis_chat, auth). |
| **docs/JARVIS_CHAT_FROM_MAC.md** | **Chat with JARVIS on the Pixel from your Mac:** GUI (jarvis-chat-gui) and CLI (jarvis-chat); start, Pixel IP, troubleshooting. |
| **docs/JARVIS_SUPERPOWERS_UNLOCKED.md** | What this setup unlocks (one URL, MCP, web search/clock, Vault, UI→Edge) and why it’s good. |

## Apps

| App | Use |
|-----|-----|
| **apps/jarvis-ui/** | JARVIS chat UI — Next.js app; talks to Clawdbot gateway (streaming, markdown, session). `cd apps/jarvis-ui && npm run dev` → http://localhost:3001 |
| **apps/jarvis-wake-mac/** | "Hey JARVIS" native macOS menu bar app — Speech + AVFoundation, wake phrase, POST to gateway/Edge, TTS reply. See [README](apps/jarvis-wake-mac/README.md) and [JARVIS_WAKE_WORD_ROADMAP.md](docs/JARVIS_WAKE_WORD_ROADMAP.md). |

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
