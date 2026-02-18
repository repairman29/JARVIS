# One-page map — JARVIS + nodes + farms

**This repo got big.** Use this page to find your way without opening 140+ docs or 130+ scripts.

---

## 1. What are the nodes?

| Node | What it is | Where it lives |
|------|------------|----------------|
| **JARVIS (this repo)** | Gateway + UI + skills + scripts. The “brain” that runs on your Mac (or Railway). | This repo: `scripts/`, `apps/`, `skills/`, `jarvis/`, `supabase/` |
| **Neural Farm** | Local LLM cluster (Pixel + optional iPhone) behind one API. Cursor/JARVIS talk to it. | **Sibling repo:** `neural-farm/` (e.g. `~/neural-farm`). Not inside JARVIS. |
| **Pixel** | Optional edge node: JARVIS/voice/chat on Android. Scripts and skills in this repo; device is separate. | This repo: `scripts/ssh-pixel*.sh`, `scripts/pixel-*.sh`, `skills/pixel-*` |
| **Olive** | Product (shopolive.xyz). Separate repo; JARVIS has docs and Kroger skill here. | **Separate repo:** olive. This repo: `docs/OLIVE_*.md`, `skills/kroger/` |
| **Build server** | Runs builds/tests for repos. JARVIS and cron trigger it. | This repo: `scripts/build-server.js`, `scripts/install-build-server-launchagent.js` |
| **Webhook trigger** | Listens for GitHub (or manual) and runs plan-execute. | This repo: `scripts/webhook-trigger-server.js`, port 18791 |

**Flow (simple):**  
Neural Farm (optional) → **JARVIS gateway** (Mac) ← Cursor / jarvis-ui / Pixel / Discord.  
Build server and webhook are helpers that the gateway or cron use.

---

## 2. Folder cheat sheet (this repo only)

| Folder | Purpose |
|--------|---------|
| **apps/** | jarvis-ui (Next.js chat), jarvis-wake-mac (“Hey JARVIS” native). |
| **config/** | team-agents.json (roster for BEAST MODE, Code Roach, etc.), other config. |
| **docs/** | All 140+ markdown docs. Use **DOCUMENTATION_MAP.md** or this page to find one. |
| **jarvis/** | Agent identity: AGENTS.md, TOOLS.md, IDENTITY.md, SOUL.md. What JARVIS says and does. |
| **scripts/** | Everything runnable: start services, autonomous (plan-execute, heartbeat), team (team-status, pipeline), Pixel, build, webhook, vault, etc. |
| **skills/** | One folder per skill (clock, github, team-status, build-server, pixel-*, kroger, …). Each has `index.js` + `skill.json`. |
| **supabase/** | Edge Function (jarvis) — proxies chat to gateway, session memory, MCP. |
| **tests/** | Tests. |
| **.github/** | Actions, workflows. |

You can ignore at first: `clawd/`, `olive-e2e/`, `private_strategy/`, `assets/`, `.cursor/`, `.vscode/` unless you’re in that part of the stack.

---

## 3. “I want to…” → go here

| I want to… | Where to go |
|------------|-------------|
| **Run the Neural Farm** | Sibling repo: `neural-farm/` → `./dev_farm.sh` or `./farm status`. See neural-farm/README.md. |
| **Run JARVIS (gateway + optional build server)** | `node scripts/start-jarvis-services.js` or LaunchAgent. Docs: JARVIS_AUTO_START_AND_WATCHDOG.md. |
| **Open the chat UI** | `cd apps/jarvis-ui && npm run dev` → http://localhost:3001. |
| **Use Cursor with the farm** | neural-farm: Base URL `http://localhost:4000/v1`, key `sk-local-farm`, model e.g. gpt-4o-mini. JARVIS_NEURAL_FARM_CURSOR_CHOICES.md. |
| **Run autonomous plan-execute (daily)** | Cron: `node scripts/add-plan-execute-cron.js` for line, `--add` to append. Script: `jarvis-autonomous-plan-execute.js`. |
| **Set a multi-day goal for plan-execute** | `node scripts/set-autonomous-goal.js "Your goal"`. Reads ~/.jarvis/autonomous-goal.txt. |
| **See who’s on the team (BEAST MODE, etc.)** | `node scripts/team-status.js` → ~/.jarvis/team-status.json. Skill: `get_team_status` (team-status). |
| **Run a full release (build → quality → deploy)** | `node scripts/run-autonomous-release.js` (optional `--product`, `--tag`). AUTONOMOUS_RELEASES.md. |
| **Trigger plan-execute from GitHub push** | Webhook server: `scripts/webhook-trigger-server.js` (port 18791). GITHUB_WEBHOOK_SETUP.md. |
| **Work on JARVIS on Pixel** | Docs: PIXEL_MAKE_IT_WORK.md, PIXEL_TEST_AND_RUN_OPTIMAL.md. Scripts: `scripts/pixel-*.sh`, `scripts/ssh-pixel*.sh`. |
| **Add or change a skill** | `skills/<name>/` with `index.js` + `skill.json`. See skills/clock or skills/team-status as examples. |
| **Understand how docs are organized** | **DOCUMENTATION_MAP.md** — start here + by topic (Edge, Olive, Pixel, Vault, UI, …). |
| **Find any doc by topic** | **REPO_INDEX.md** — key docs table. **DOCUMENTATION_MAP.md** — by topic (Edge, Pixel, JARVIS product, …). |
| **Hand off to another dev or Cursor** | **HANDOFF.md** — current state, where to start, good first message. |

---

## 4. Docs by theme (no moving files)

- **Start / map:** DOCUMENTATION_MAP.md, REPO_INDEX.md, HANDOFF.md, CURSOR_SESSION_ONBOARDING.md  
- **Autonomous:** JARVIS_AUTONOMOUS_AGENT.md, JARVIS_AUTONOMOUS_NEXT.md, AUTONOMOUS_RELEASES.md, ORCHESTRATION_SCRIPTS.md  
- **Neural Farm (sibling):** JARVIS_NEURAL_FARM.md, JARVIS_NEURAL_FARM_CURSOR_CHOICES.md  
- **Pixel / Android:** DOCUMENTATION_MAP.md § “Pixel / Android” (long list); PIXEL_MAKE_IT_WORK.md first.  
- **Shipping / team:** JARVIS_OWNS_SHIPPING.md, JARVIS_OPTIMAL_TEAM_SETUP.md, JARVIS_AGENT_ORCHESTRATION.md  
- **Edge / UI / voice:** DOCUMENTATION_MAP.md § “Edge / Supabase” and “UI, Railway, other”; JARVIS_WAKE_WORD_ROADMAP.md  
- **Olive:** DOCUMENTATION_MAP.md § “Olive”; OLIVE_PROJECT_README.md  

Full topic index: **docs/DOCUMENTATION_MAP.md**.

---

## 5. Scripts by job (high level)

| Job | Examples | Full list |
|-----|-----------|-----------|
| **Start things** | start-jarvis-services.js, start-gateway-with-vault.js, start-build-server-background.js | ORCHESTRATION_SCRIPTS.md |
| **Autonomous** | jarvis-autonomous-plan-execute.js, jarvis-autonomous-heartbeat.js, run-autonomous-release.js | Same doc |
| **Team / pipeline** | team-status.js, ensure-team-ready.js, run-team-pipeline.js, run-team-quality.js | Same doc |
| **Goal / cron** | set-autonomous-goal.js, add-plan-execute-cron.js | Same doc |
| **Pixel** | ssh-pixel*.sh, pixel-*.sh, start-jarvis-pixel.sh | PIXEL_MAKE_IT_WORK.md, PIXEL_* docs |
| **Webhook / GitHub** | webhook-trigger-server.js, install-webhook-trigger-launchagent.js | GITHUB_WEBHOOK_SETUP.md |
| **Build** | build-server.js, install-build-server-launchagent.js | JARVIS_BUILD_SERVER.md |

Full script index: **docs/ORCHESTRATION_SCRIPTS.md**.

---

## 6. One-line cheat sheet

**Lost?** → **docs/ONE_PAGE_MAP.md** (this file).  
**Repo map** → docs/REPO_INDEX.md.  
**Doc index by topic** → docs/DOCUMENTATION_MAP.md.  
**Tools & when to use** → jarvis/TOOLS.md.  
**Handoff** → docs/HANDOFF.md.
