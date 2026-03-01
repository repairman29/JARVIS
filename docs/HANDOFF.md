# Handoff — CLAWDBOT / JARVIS

**Use this when handing off to another developer or Cursor session.** Copy or reference in the first message so the next person has context.

---

## Merge note (multi-agent)

When another agent is running: read this file + `git status`. This session edited: `scripts/start-jarvis-pixel-proot.sh`, `run-jarvis-in-proot.sh`, `pixel-proot-bootstrap-and-start.sh`, `pixel-proot-run.sh`, `pixel-sync-and-start-proot.sh`, `docs/PIXEL_TROUBLESHOOTING.md`. Reconcile any overlapping edits before commit.

---

## Current state (as of handoff)

- **JARVIS UI** (`apps/jarvis-ui`): Next.js chat UI; runs on port 3001 (`npm run dev`). Uses **Edge** when `NEXT_PUBLIC_JARVIS_EDGE_URL` is set in `.env.local`; otherwise uses local gateway. **Pixel can be the primary JARVIS server** (Mac = client); see **docs/PIXEL_AS_JARVIS_SERVER.md**, **docs/PIXEL_STABLE_ENVIRONMENT.md**.
- **Edge Function** (`supabase/functions/jarvis`): Deployed on Supabase. Proxies chat to gateway (Railway or local). **Auth: required in cloud** when `JARVIS_AUTH_TOKEN` is set; **no auth when run locally** (`supabase functions serve`). See **docs/JARVIS_EDGE_AUTH.md**.
- **Token sync:** UI and Edge must use the same `JARVIS_AUTH_TOKEN` when calling cloud Edge. Run `node scripts/sync-edge-auth-token.js` from repo root, then `supabase functions deploy jarvis` if you change the token in `apps/jarvis-ui/.env.local`.
- **Message flow / crashes:** API route only forwards as stream when backend returns `text/event-stream`; otherwise returns JSON so the UI can show the reply. Message/chat components guard against non-string content to avoid crashes.
- **Memory:** Supabase tables `session_messages`, `session_summaries`, `jarvis_prefs`; Edge loads/appends session history. See **docs/JARVIS_MEMORY.md**, **docs/JARVIS_MEMORY_WIRING.md**.
- **JARVIS identity in web UI:** Edge injects a system prompt for REST chat so JARVIS knows its identity and that **web chat has repo access** (repo_summary, repo_search, repo_file) when the gateway has a workspace and indexed repos—so JARVIS uses those tools and cites sources. Cursor is suggested only for live file edit or host exec when no tool can do it. In **Cursor** (MCP jarvis_chat or in-IDE agent), JARVIS also has workspace/repo access per jarvis/AGENTS.md.

---

## Where to start (in order)

1. **docs/ONE_PAGE_MAP.md** — **Project got big?** Nodes (Farm, JARVIS, Pixel, Olive), folder cheat sheet, “I want to…” table, docs/scripts by theme. Start here if you’re lost.
2. **docs/REPO_INDEX.md** — Map of repo (paths, key docs, apps).
3. **docs/CURSOR_SESSION_ONBOARDING.md** — What to read first, @ mentions, Edge/Supabase, rules.
4. **jarvis/TOOLS.md** — Scripts, skills, when to use what.
5. **docs/JARVIS_EDGE_AUTH.md** — Edge auth (cloud vs local), sync script, troubleshooting.

---

## Good first message for next session

Paste or adapt:

*"Read docs/CURSOR_SESSION_ONBOARDING.md and docs/HANDOFF.md. Use REPO_INDEX + jarvis/TOOLS.md as source of truth. Edge auth: cloud requires Bearer when JARVIS_AUTH_TOKEN is set; sync with `node scripts/sync-edge-auth-token.js`. Check repairman29 repos for existing goodies before building from scratch."*

---

## Likely next work (from product plan / roadmap)

- **Done recently:** jarvis-ui proxy, lint, CI (lint + build + Knip), Knip bot, CodeQL, E2E-on-preview (VERCEL_TOKEN set). **Pixel/Proot (this session):** Fixed Proot stack — `lscpu`/scols error (PATH), gateway 000 (HOME=$TERMUX_HOME), gateway logging; added ADB input fallback when RunCommand fails (`pixel-sync-and-start-proot.sh`); §1d in PIXEL_TROUBLESHOOTING. **Code quality:** **jarvis/CODE_QUALITY.md** §6; **.cursor/rules/code-quality.mdc** (always-on).
- **JARVIS_UI_ROADMAP.md** — Phased UI roadmap; **JARVIS_UI_AUDIT.md** for what’s built. Phase 2–4 items are done; UI ready for `meta.tools_used` when gateway sends it.
- **Gateway meta** — Gateway can send `meta.tools_used` and `meta.structured_result` for UI 2.6/2.7; see **docs/JARVIS_GATEWAY_META.md** (implementation checklist §6). UI and Edge are ready.
- **Next:** Vision: Edge merges pasted image into last user message (multimodal); use a vision-capable model in the gateway. Notion MCP alignment when ready. Voice polish if usage justifies (JARVIS_VOICE). Autonomous: add plan-execute to cron (`node scripts/add-plan-execute-cron.js --add`); optional multi-day goal via `node scripts/set-autonomous-goal.js`.
- **Ecosystem doc sync:** When adding a product or pattern, update clawd **PRODUCTS.md** and consider citing or refreshing **docs/AGENTIC_AUTONOMY_2026_ECOSYSTEM.md**. See **docs/JARVIS_MASTER_ROADMAP.md** §3 item 9.

---

## One-line cheat sheet

**Doc map** → docs/DOCUMENTATION_MAP.md | **Repo map** → docs/REPO_INDEX.md | **Tools** → jarvis/TOOLS.md | **Edge auth** → docs/JARVIS_EDGE_AUTH.md | **Handoff** → docs/HANDOFF.md.
