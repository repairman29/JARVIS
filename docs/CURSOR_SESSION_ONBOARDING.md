# Cursor session onboarding — CLAWDBOT / JARVIS

**Use this when teaching another Cursor session (or yourself) how to work in this repo.**

---

## 30-second model

- **This repo** = CLAWDBOT (JARVIS): agent config, skills, scripts, and apps.
- **JARVIS** = conversational productivity agent; skills live in `jarvis/skills/` and `skills/`.
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

## Edge / Supabase (hosted JARVIS, MCP, UI→Edge)

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
- `@jarvis/TOOLS.md` — tools and scripts
- `@jarvis/AGENTS.md` — agent behavior

Or: *"Read docs/CURSOR_SESSION_ONBOARDING.md and use REPO_INDEX + jarvis/TOOLS.md as the source of truth."*

---

## One-line cheat sheet

**Doc map** → docs/DOCUMENTATION_MAP.md | **Repo map** → REPO_INDEX | **Tools** → jarvis/TOOLS.md | **Behavior** → jarvis/AGENTS.md | **PM mode** → .cursor/rules | **Edge/Supabase** → JARVIS_EDGE_*, supabase/README, JARVIS_MCP_*.
