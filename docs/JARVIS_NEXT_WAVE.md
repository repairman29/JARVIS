# JARVIS — Next Wave of Innovation

After the [12 cutting-edge items](JARVIS_CUTTING_EDGE.md), here’s the **next wave**: high-impact improvements to keep JARVIS best-in-class.

---

## Priority stack

| # | Item | Impact | Owner | Status |
|---|------|--------|--------|--------|
| 1 | **UI: Hydrate session from Edge on load** | Session truly survives refresh when using Edge | jarvis-ui | ✅ Done |
| 2 | **set_pref from UI** | "Always use X" / "Remember X" writes to jarvis_prefs via Edge | jarvis-ui + Edge | ✅ Done |
| 3 | **Heartbeat → Discord brief (richer)** | Open PRs/issues count, repo freshness, one "next action" in brief | heartbeat-brief.js | ✅ Done |
| 4 | **Streaming + meta** | Edge streams response and sends final meta (tools_used) in a trailing event or footer | Edge + UI | ✅ Done (UI parses meta from SSE; gateway sends meta in stream) |
| 5 | **"Use fast" / "Use best" hint** | Optional message or session flag so UI/gateway can route to cheap vs strong model | Gateway + UI | ✅ Done |
| 6 | **Audit log implementation** | Gateway or Edge writes exec/workflow_dispatch to table or file per [JARVIS_AUDIT_LOG.md](JARVIS_AUDIT_LOG.md) | Gateway/plugin | ✅ Done |
| 7 | **DECISIONS.md append skill** | Tool or agent flow: "remember this decision" → append to DECISIONS.md in repo | Agent + repo | ✅ Done |
| 8 | **E2E for session hydration** | Playwright: refresh page, assert messages restored when using Edge | jarvis-ui e2e | ✅ Done |

---

## 1. UI: Hydrate session from Edge on load

**Why:** With Edge, session history lives in Supabase. Today the UI only sends `sessionId` with each request; on refresh it starts with an empty thread. If we **load** history from Edge on mount, the thread reappears.

**How:** On mount, when `sessionId` is set, call `GET /api/session?sessionId=...` (which calls Edge `GET ?session_id=...`). If the response has `messages.length > 0`, set initial `messages` so the thread is visible. Only hydrate when current `messages.length === 0` so we don’t overwrite in-flight state.

**Contract:** Already in place: Edge `GET ?session_id=xxx` → `{ ok, messages }`; `/api/session` proxies it.

---

## 2. set_pref from UI ✅

**Why:** User says "always use Groq for simple questions" or "remember I prefer UTC" and it persists across devices.

**How:** Implemented. Edge has `POST action=set_pref`. UI: Settings modal (when backend is Edge) includes a "Preferences" section with Key/Value and "Save preference" that calls `POST /api/pref`, which forwards to Edge `set_pref`. Optional: `remember_preference` tool so JARVIS can write prefs from chat.

---

## 3. Heartbeat brief (richer) ✅

**Why:** Proactive brief is more actionable with "5 open PRs, 3 issues, repo index 2h old; suggested next: run BEAST MODE on BEAST-MODE."

**How:** Implemented in `heartbeat-brief.js`. When `gh` is available, script gets open PR and issue counts via `gh pr list` / `gh issue list` and adds them to the brief. A "Next action" line is derived: fix first failing check, address first warning, review N open PR(s), triage N open issue(s), or "all clear".

---

## 4. Streaming + meta ✅

**Why:** User sees tools_used and structured_result even when streaming; no need to wait for full response.

**How:** Done. UI parses SSE events for top-level `meta` (tools_used, structured_result) and attaches to the last assistant message. Edge passes the gateway stream through unchanged. When the gateway includes `meta` in streamed SSE events, it appears in the UI automatically.

---

## 5. "Use fast" / "Use best" hint ✅

**Why:** User or UI can force a model tier for one message or session (e.g. "use fast" for quick Q&A, "use best" for deep work).

**How:** Done. UI: type **`/fast`** or **`/best`** in the composer to set a session hint; **`/model`** clears it. Header shows a "Fast" or "Best" chip when set. API and Edge pass `model_hint`; Edge injects into system prompt. Documented in GETTING_STARTED_MODES.

---

## 6. Audit log ✅

**How:** Done. Migration **supabase/migrations/20250203120000_jarvis_audit_log.sql** creates `jarvis_audit_log`. Edge accepts `POST action=audit_log` with `event_action`, optional `details`, `session_id`, `channel`, `actor`. See [JARVIS_AUDIT_LOG.md](JARVIS_AUDIT_LOG.md).

## 7. DECISIONS.md append skill ✅

**How:** Done. **scripts/append-decision.js** appends a dated entry to DECISIONS.md (creates file with "# Decisions" if missing). AGENTS.md and DECISIONS_MEMORY.md tell JARVIS to run `node scripts/append-decision.js "Summary"` when the user says "remember this decision."

## 8. E2E for session hydration ✅

**How:** Done. **e2e/session.spec.ts** includes "Session hydrate: when GET /api/session returns messages, thread shows them on load" — mocks /api/session and asserts hydrated messages appear. Run with dev server stopped or use Playwright's webServer.

---

## Quick reference

**Next step:** §1–8 done. **Next wave 2** (below): audit script, RUNBOOK, E2E tip.

**Refs:** [JARVIS_CUTTING_EDGE.md](JARVIS_CUTTING_EDGE.md) (done), [JARVIS_UI_ROADMAP.md](JARVIS_UI_ROADMAP.md), [JARVIS_PRODUCT_PLAN.md](JARVIS_PRODUCT_PLAN.md).

---

## Next wave 2 (follow-on)

| # | Item | Status |
|---|------|--------|
| 9 | **Audit log from scripts** — `node scripts/audit-log.js exec "cmd" --channel X --actor Y` POSTs to Edge | ✅ Done |
| 10 | **RUNBOOK: apply migrations + audit script** — Document jarvis_audit_log and audit-log.js | ✅ Done |
| 11 | **E2E with running dev server** — Use `PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e` so Playwright doesn’t start a second Next server | ✅ Doc in jarvis-ui README |
| 12 | **Hero skill stub** — focus-pro (timer + macOS say), notion stub; CONTRIBUTING § Hero skill checklist | ✅ Done |

**Next after 2:** Gateway implementers: send `meta.tools_used` and `meta.structured_result` per [JARVIS_GATEWAY_META.md](JARVIS_GATEWAY_META.md) (implementation checklist in §6). UI and Edge are ready. Premium/community themes per [JARVIS_PRODUCT_PLAN.md](JARVIS_PRODUCT_PLAN.md) §5b.
