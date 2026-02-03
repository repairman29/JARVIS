# Documentation map — CLAWDBOT / JARVIS

**Single source for how docs are organized and what exists.** Use this to onboard someone or another Cursor session, or to find the right doc fast.

---

## Start here

| Goal | Doc |
|------|-----|
| **JARVIS plan (vision, tracks, next steps)** | [docs/JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) |
| **Repo map (where everything lives)** | [docs/REPO_INDEX.md](./REPO_INDEX.md) |
| **Teach a Cursor session how to use this repo** | [docs/CURSOR_SESSION_ONBOARDING.md](./CURSOR_SESSION_ONBOARDING.md) |
| **Handoff (current state, next steps)** | [docs/HANDOFF.md](./HANDOFF.md) |
| **Project overview, quick start** | [README.md](../README.md) |
| **Full setup, config, skills** | [DEVELOPER_GUIDE.md](../DEVELOPER_GUIDE.md) |
| **Day-to-day ops** | [RUNBOOK.md](../RUNBOOK.md) |
| **Before public push (strip internal refs)** | [docs/PUBLIC_REPO_CHECKLIST.md](./PUBLIC_REPO_CHECKLIST.md) |
| **Modes, premium skills, Yellow/Hot Rod** | [docs/PREMIUM_CLARITY.md](./PREMIUM_CLARITY.md) |
| **Success metrics (north star, KPIs)** | [docs/METRICS.md](./METRICS.md) |

---

## By topic

### Edge / Supabase (hosted JARVIS, MCP, UI→Edge)

| Doc | Use |
|-----|-----|
| [JARVIS_EDGE_AUTH.md](./JARVIS_EDGE_AUTH.md) | Edge auth: required in cloud when token set; no auth locally; sync script. |
| [JARVIS_EDGE_WHAT_CHANGES.md](./JARVIS_EDGE_WHAT_CHANGES.md) | What changes when JARVIS runs behind the Edge Function. |
| [supabase/README.md](../supabase/README.md) | Deploy `jarvis` Edge Function, set secrets, REST. |
| [JARVIS_MCP_SUPABASE.md](./JARVIS_MCP_SUPABASE.md) | JARVIS MCP on Supabase (Edge + Vault); spec. |
| [JARVIS_MCP_CURSOR.md](./JARVIS_MCP_CURSOR.md) | Add JARVIS as MCP server in Cursor. |
| [JARVIS_SUPERPOWERS_UNLOCKED.md](./JARVIS_SUPERPOWERS_UNLOCKED.md) | What the setup unlocks (one URL, MCP, Vault, UI→Edge). |
| [JARVIS_UPDATES_AND_ENHANCEMENTS.md](./JARVIS_UPDATES_AND_ENHANCEMENTS.md) | Done vs next (UI→Edge, health, MCP, streaming). |

Code: **supabase/functions/jarvis/** (Edge Function), **apps/jarvis-ui/** (UI; `NEXT_PUBLIC_JARVIS_EDGE_URL` for Edge backend).

### Olive (separate repo)

| Doc | Use |
|-----|-----|
| [OLIVE_PROJECT_README.md](./OLIVE_PROJECT_README.md) | Olive overview, try it, feedback, beta testers. |
| [OLIVE_LIST_PARSING_SPEC.md](./OLIVE_LIST_PARSING_SPEC.md) | List/Smart Paste: parser, rate limits. |
| [OLIVE_NOTES_FOR_TRANSFER.md](./OLIVE_NOTES_FOR_TRANSFER.md) | Notes to copy when opening Olive repo. |

### JARVIS product & agent (plan, tools, behavior)

| Doc | Use |
|-----|-----|
| [JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) | Vision, tracks (Windows/ROG, UI, modes, Edge/MCP, showcase), current state, next 6–12 months. |
| [PREMIUM_CLARITY.md](./PREMIUM_CLARITY.md) | Modes (Blue/Yellow/Hot Rod), premium skills, how to get Yellow or Hot Rod. |
| [jarvis/TOOLS.md](../jarvis/TOOLS.md) | All tools/skills and when to use them; repo scripts; platform CLIs. |
| [COMMUNITY_AND_SKILLS.md](./COMMUNITY_AND_SKILLS.md) | Skill marketplace, contributors, hero/premium skills. |
| [jarvis/AGENTS.md](../jarvis/AGENTS.md) | How JARVIS behaves by context (Discord, PM, deep work, etc.). |
| [JARVIS_CUTTING_EDGE.md](./JARVIS_CUTTING_EDGE.md) | Prioritized improvements to make JARVIS best-in-class (memory, long context, orchestration, UI). |
| [REPO_INDEX.md](./REPO_INDEX.md) | Full map: skills paths, key docs, apps, Olive, ignored. |

### Vault / secrets

| Doc | Use |
|-----|-----|
| [VAULT_MIGRATION.md](./VAULT_MIGRATION.md) | Migrate secrets to Supabase Vault. |
| [SETUP_VAULT_AND_ACCESS.md](./SETUP_VAULT_AND_ACCESS.md) | Vault setup and access. |
| [VAULT_ONE_PROJECT_FOR_ALL.md](./VAULT_ONE_PROJECT_FOR_ALL.md) | One Supabase project for Vault. |

### UI, Railway, other

| Doc | Use |
|-----|-----|
| [JARVIS_UI_DEVELOPER_SPEC.md](./JARVIS_UI_DEVELOPER_SPEC.md) | Product/UX spec for JARVIS chat UI. |
| [JARVIS_UI_ROADMAP.md](./JARVIS_UI_ROADMAP.md) | Phased UI roadmap. |
| [JARVIS_UI_VOICE_UAT.md](./JARVIS_UI_VOICE_UAT.md) | Voice, theme & conversation UAT; local setup; checklist. |
| [JARVIS_RAILWAY.md](./JARVIS_RAILWAY.md) | Run gateway on Railway; Edge proxies to it. |
| [JARVIS_GATEWAY_META.md](./JARVIS_GATEWAY_META.md) | Gateway: how to send meta (tools_used, structured_result) for UI 2.6/2.7. |
| [COMMUNITY_AND_SKILLS.md](./COMMUNITY_AND_SKILLS.md) | Skill marketplace, contributors, hero/premium skills. |

---

## How we document

- **REPO_INDEX** = canonical map of the repo (paths, key docs, apps). Keep it updated when adding major areas.
- **CURSOR_SESSION_ONBOARDING** = what to read first and @ mention when teaching another Cursor session; includes Edge/Supabase.
- **DOCUMENTATION_MAP** (this file) = topic-based index and “start here” so nothing is orphaned.
- **README / DEVELOPER_GUIDE** = overview and full setup; they link to REPO_INDEX and Edge/onboarding where relevant.

When you add a new major area (e.g. a new product or integration), add it to **REPO_INDEX** (Key docs or a new section) and to **DOCUMENTATION_MAP** under the right topic.
