# JARVIS — Next Wave of Innovation

After the [12 cutting-edge items](JARVIS_CUTTING_EDGE.md), here’s the **next wave**: high-impact improvements to keep JARVIS best-in-class.

---

## Priority stack

| # | Item | Impact | Owner | Status |
|---|------|--------|--------|--------|
| 1 | **UI: Hydrate session from Edge on load** | Session truly survives refresh when using Edge | jarvis-ui | ✅ Done |
| 2 | **set_pref from UI** | "Always use X" / "Remember X" writes to jarvis_prefs via Edge | jarvis-ui + Edge | ⬜ |
| 3 | **Heartbeat → Discord brief (richer)** | Open PRs/issues count, repo freshness, one "next action" in brief | heartbeat-brief.js | ⬜ |
| 4 | **Streaming + meta** | Edge streams response and sends final meta (tools_used) in a trailing event or footer | Edge + UI | ⬜ |
| 5 | **"Use fast" / "Use best" hint** | Optional message or session flag so UI/gateway can route to cheap vs strong model | Gateway + UI | ⬜ |
| 6 | **Audit log implementation** | Gateway or Edge writes exec/workflow_dispatch to table or file per [JARVIS_AUDIT_LOG.md](JARVIS_AUDIT_LOG.md) | Gateway/plugin | ⬜ |
| 7 | **DECISIONS.md append skill** | Tool or agent flow: "remember this decision" → append to DECISIONS.md in repo | Agent + repo | ⬜ |
| 8 | **E2E for session hydration** | Playwright: refresh page, assert messages restored when using Edge | jarvis-ui e2e | ⬜ |

---

## 1. UI: Hydrate session from Edge on load

**Why:** With Edge, session history lives in Supabase. Today the UI only sends `sessionId` with each request; on refresh it starts with an empty thread. If we **load** history from Edge on mount, the thread reappears.

**How:** On mount, when `sessionId` is set, call `GET /api/session?sessionId=...` (which calls Edge `GET ?session_id=...`). If the response has `messages.length > 0`, set initial `messages` so the thread is visible. Only hydrate when current `messages.length === 0` so we don’t overwrite in-flight state.

**Contract:** Already in place: Edge `GET ?session_id=xxx` → `{ ok, messages }`; `/api/session` proxies it.

---

## 2. set_pref from UI

**Why:** User says "always use Groq for simple questions" or "remember I prefer UTC" and it persists across devices.

**How:** Edge already has `POST action=set_pref` with `key`, `value`, optional `scope`. Add a small Settings section or a "Remember this" affordance in the UI that calls `/api/chat` or a dedicated `/api/pref` that forwards to Edge `set_pref`. Optional: `remember_preference` tool so JARVIS can write prefs from chat.

---

## 3. Heartbeat brief (richer)

**Why:** Proactive brief is more actionable with "5 open PRs, 3 issues, repo index 2h old; suggested next: run BEAST MODE on BEAST-MODE."

**How:** In `heartbeat-brief.js`, after safety net: if `GITHUB_TOKEN` is available, call GitHub API for a focus repo (e.g. from products.json or env `JARVIS_FOCUS_REPO`) and add open PRs/issues count to the brief. Keep the script fast; optional `--full` for full report.

---

## 4. Streaming + meta

**Why:** User sees tools_used and structured_result even when streaming; no need to wait for full response.

**How:** Edge/gateway can send a final SSE event (e.g. `data: {"meta": {"tools_used": [...]}}`) or append meta to the stream footer. UI already handles `meta` in non-stream response; extend to parse meta from stream and attach to the last assistant message.

---

## 5. "Use fast" / "Use best" hint

**Why:** User or UI can force a model tier for one message or session (e.g. "use fast" for quick Q&A, "use best" for deep work).

**How:** Gateway config or agent hint (e.g. header or message prefix). Document in GETTING_STARTED_MODES; optional UI toggle or slash command `/fast` / `/best`.

---

## 6–8. Audit log, DECISIONS skill, E2E

See [JARVIS_AUDIT_LOG.md](JARVIS_AUDIT_LOG.md) for implementing the audit log. DECISIONS append can be a small tool or an agent instruction that triggers a GitHub API or file write. E2E for session hydration: open chat, send a message, refresh, assert message list is restored (with Edge URL configured in test env).

---

## Quick reference

**Next step:** Ship **§1 Session hydrate** so the UI restores the thread from Edge on refresh. Then **§2 set_pref from UI** for persistent preferences.

**Refs:** [JARVIS_CUTTING_EDGE.md](JARVIS_CUTTING_EDGE.md) (done), [JARVIS_UI_ROADMAP.md](JARVIS_UI_ROADMAP.md), [JARVIS_PRODUCT_PLAN.md](JARVIS_PRODUCT_PLAN.md).
