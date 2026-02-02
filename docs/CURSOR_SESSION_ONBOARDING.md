# Cursor session onboarding — CLAWDBOT / JARVIS

**Use this when teaching another Cursor session (or yourself) how to work in this repo.**

---

## 30-second model

- **This repo** = CLAWDBOT (JARVIS): agent config, skills, scripts, and apps.
- **JARVIS** = conversational productivity agent; skills live in `jarvis/skills/` and `skills/`.
- **Repairman29’s GitHub repos** = where the goodies live. Before building from scratch, **check those repos** for existing implementations, skills, configs, and patterns. Use **repos.json** (repo list), **repo-knowledge** (semantic search/summaries), or browse/clone. See **docs/JARVIS_AND_YOUR_REPOS.md** and **jarvis/TOOLS.md** → Repo Knowledge.
- **Olive** (shopolive.xyz) = separate repo; this repo has docs and e2e in `olive-e2e/`.
- **Apps**: `apps/jarvis-ui/` = Next.js chat UI talking to the gateway.
- **Edge / Supabase**: JARVIS behind a public URL via Supabase Edge Function (proxy to gateway); MCP in Cursor; UI can use Edge or local gateway. Code: `supabase/functions/jarvis/`.

---

## What to read first (in order)

| Read | Purpose |
|------|--------|
| **docs/DOCUMENTATION_MAP.md** | How docs are organized by topic; start here for full map. |
| **docs/REPO_INDEX.md** | Map of the repo: where things live, key docs, apps. |
| **jarvis/TOOLS.md** | All tools/skills and when to use them; repo scripts; platform CLIs. |
| **jarvis/AGENTS.md** | How JARVIS behaves by context (Discord, PM mode, deep work, etc.). |

Optional next: **DEVELOPER_GUIDE.md** (full setup), **RUNBOOK.md** (ops).

---

## Talk to JARVIS: our tools first (not Cursor)

**Preferred:** Use **JARVIS UI** (`apps/jarvis-ui`, npm run dev → localhost:3001, with Edge URL in `.env.local`) or **Discord**. They’re built for JARVIS; no hunting in Cursor. See **docs/JARVIS_FIRST_OUR_TOOLS.md**.

**Optional:** JARVIS MCP is configured in Cursor (`~/.cursor/mcp.json`); open Agent (Cmd+I / Ctrl+I) and say *“Ask JARVIS …”* if you want it in-IDE. If it’s clunky, use JARVIS UI or Discord instead.

When the work touches **hosted JARVIS**, **MCP in Cursor**, or **UI talking to Edge**:

| Doc | Use |
|-----|-----|
| **docs/JARVIS_EDGE_WHAT_CHANGES.md** | What changes when JARVIS runs behind the Edge Function; one URL, proxy to gateway. |
| **supabase/README.md** | Deploy `jarvis` Edge Function, set secrets, call from anywhere (REST). |
| **docs/JARVIS_MCP_SUPABASE.md** | JARVIS MCP on Supabase (Edge + Vault); spec and checklist. |
| **docs/JARVIS_MCP_CURSOR.md** | Add JARVIS as MCP server in Cursor (URL, `jarvis_chat`, auth). |
| **docs/JARVIS_SUPERPOWERS_UNLOCKED.md** | What the setup unlocks: one URL, MCP, web search/clock, Vault, UI→Edge. |
| **docs/JARVIS_UPDATES_AND_ENHANCEMENTS.md** | What’s done (UI→Edge, health, MCP, streaming) and what’s next. |

Code: **supabase/functions/jarvis/** = Edge Function. **apps/jarvis-ui/** = UI; set `NEXT_PUBLIC_JARVIS_EDGE_URL` to use Edge backend.

---

## Rules that apply in Cursor

- **.cursor/rules/product-manager.mdc** — Always applied: PM mode (problem → user → outcome, artifacts, prefer `scripts/`, no secrets, next action).
- For more context, you can @ other rules or docs in chat.

---

## Good @ mentions when starting a session

Paste or reference in the first message so the session has context:

- `@docs/REPO_INDEX.md` — repo map
- `@jarvis/TOOLS.md` — tools and scripts (includes Repo Knowledge)
- `@jarvis/AGENTS.md` — agent behavior (includes “repairman29 repos = goodies”)
- `@docs/JARVIS_AND_YOUR_REPOS.md` — repos.json, index, goodies: check repairman29 repos first

Or: *"Read docs/CURSOR_SESSION_ONBOARDING.md and use REPO_INDEX + jarvis/TOOLS.md as the source of truth. Check repairman29 repos for existing goodies before building from scratch."*

---

## JARVIS roadmap: what's next

**Product plan:** [docs/JARVIS_PRODUCT_PLAN.md](docs/JARVIS_PRODUCT_PLAN.md) — themes, tracks, and **§5b Next up** (code blocks + copy, export transcript, settings modal, reconnect copy, a11y, skills list, slash commands). Suggested next: **code blocks (syntax + copy)** and **export transcript**.

**Developer supremacy:** [docs/JARVIS_DEVELOPER_SUPREMACY.md](docs/JARVIS_DEVELOPER_SUPREMACY.md) — make JARVIS the most badass Navy Seal Swiss Army Ninja MI6 developer (playbook, levers, gaps to close).

**JARVIS smarter:** [docs/JARVIS_SMARTER.md](docs/JARVIS_SMARTER.md) — current smarts + next-level levers (bootstrap context, cite sources, when-to-invoke, decision memory).

**UI roadmap:** [docs/JARVIS_UI_ROADMAP.md](docs/JARVIS_UI_ROADMAP.md) | **Audit:** [docs/JARVIS_UI_AUDIT.md](docs/JARVIS_UI_AUDIT.md).

---

## One-line cheat sheet

**Doc map** → docs/DOCUMENTATION_MAP.md | **Repo map** → REPO_INDEX | **Tools** → jarvis/TOOLS.md | **Behavior** → jarvis/AGENTS.md | **PM mode** → .cursor/rules | **Edge/Supabase** → JARVIS_EDGE_*, supabase/README, JARVIS_MCP_* | **Roadmap** → JARVIS_PRODUCT_PLAN §5b.
