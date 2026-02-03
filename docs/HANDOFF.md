# Handoff — CLAWDBOT / JARVIS

**Use this when handing off to another developer or Cursor session.** Copy or reference in the first message so the next person has context.

---

## Current state (as of handoff)

- **JARVIS UI** (`apps/jarvis-ui`): Next.js chat UI; runs on port 3001 (`npm run dev`). Uses **Edge** when `NEXT_PUBLIC_JARVIS_EDGE_URL` is set in `.env.local`; otherwise uses local gateway.
- **Edge Function** (`supabase/functions/jarvis`): Deployed on Supabase. Proxies chat to gateway (Railway or local). **Auth: required in cloud** when `JARVIS_AUTH_TOKEN` is set; **no auth when run locally** (`supabase functions serve`). See **docs/JARVIS_EDGE_AUTH.md**.
- **Token sync:** UI and Edge must use the same `JARVIS_AUTH_TOKEN` when calling cloud Edge. Run `node scripts/sync-edge-auth-token.js` from repo root, then `supabase functions deploy jarvis` if you change the token in `apps/jarvis-ui/.env.local`.
- **Message flow / crashes:** API route only forwards as stream when backend returns `text/event-stream`; otherwise returns JSON so the UI can show the reply. Message/chat components guard against non-string content to avoid crashes.
- **Memory:** Supabase tables `session_messages`, `session_summaries`, `jarvis_prefs`; Edge loads/appends session history. See **docs/JARVIS_MEMORY.md**, **docs/JARVIS_MEMORY_WIRING.md**.
- **JARVIS identity in web UI:** Edge injects a system prompt for REST chat so JARVIS knows its identity and that in the **web chat** it has no live repo access—so it directs users to Cursor or pasted code for repo work instead of saying "I can't access GitHub." In **Cursor** (MCP jarvis_chat or in-IDE agent), JARVIS has workspace/repo access per jarvis/AGENTS.md.

---

## Where to start (in order)

1. **docs/REPO_INDEX.md** — Map of repo (paths, key docs, apps).
2. **docs/CURSOR_SESSION_ONBOARDING.md** — What to read first, @ mentions, Edge/Supabase, rules.
3. **jarvis/TOOLS.md** — Scripts, skills, when to use what.
4. **docs/JARVIS_EDGE_AUTH.md** — Edge auth (cloud vs local), sync script, troubleshooting.

---

## Good first message for next session

Paste or adapt:

*"Read docs/CURSOR_SESSION_ONBOARDING.md and docs/HANDOFF.md. Use REPO_INDEX + jarvis/TOOLS.md as source of truth. Edge auth: cloud requires Bearer when JARVIS_AUTH_TOKEN is set; sync with `node scripts/sync-edge-auth-token.js`. Check repairman29 repos for existing goodies before building from scratch."*

---

## Likely next work (from product plan / roadmap)

- **JARVIS_PRODUCT_PLAN.md** §5b — Code blocks + copy, export transcript, settings modal, reconnect copy, a11y, skills list, slash commands.
- **JARVIS_UI_ROADMAP.md** — Phased UI roadmap; **JARVIS_UI_AUDIT.md** for what’s already built.
- **Gateway meta** — Gateway can send `meta.tools_used` and `meta.structured_result` for UI 2.6/2.7; see **docs/JARVIS_GATEWAY_META.md**.

---

## One-line cheat sheet

**Doc map** → docs/DOCUMENTATION_MAP.md | **Repo map** → docs/REPO_INDEX.md | **Tools** → jarvis/TOOLS.md | **Edge auth** → docs/JARVIS_EDGE_AUTH.md | **Handoff** → docs/HANDOFF.md.
