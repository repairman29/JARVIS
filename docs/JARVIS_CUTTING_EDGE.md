# JARVIS — Cutting-Edge Improvements

Prioritized list of improvements to make JARVIS best-in-class. Each item has **priority** (P0/P1/P2), **owner** (where to implement), and **how**.

---

## P0 — Highest impact

### 1. Wire session + prefs to Supabase (memory)

**Why:** Session survives refresh and gateway restart; "always use X" persists across devices.

**Status:** Done. Edge loads/appends session_messages, loads/writes session_summaries (long-context), reads/writes jarvis_prefs; GET ?session_id= and set_pref action supported.

**Owner:** Supabase Edge (jarvis) or gateway plugin.

**How:** [JARVIS_MEMORY_WIRING.md](./JARVIS_MEMORY_WIRING.md). Edge: on request with `session_id`, load last N from `session_messages` → build `messages` → call gateway → append user + assistant to `session_messages`. Prefs: read `jarvis_prefs` when building context; write when user says "remember" / "always use X."

---

### 2. Long-context: summary + recent N messages

**Why:** Avoid context overflow on long threads; keep reasoning quality.

**Status:** Done. Edge: loadSessionContext uses session_summaries + last N when history > threshold; after each turn, maybeUpdateSessionSummary refreshes summary every K turns (lightweight LLM summarization).

**Owner:** Gateway or Edge (before calling LLM).

**How:** When thread length > threshold (e.g. 20 turns), query or maintain `session_summaries` for that `session_id`. Send to model: **summary** + **last N messages** (e.g. 15). Summary updated every 10 turns via summarization call.

**Ref:** [JARVIS_MEMORY.md](./JARVIS_MEMORY.md) § Summary + recent.

---

### 3. Bootstrap product context (deep work)

**Why:** Every deep-work or "what can X do?" answer is grounded in code, not guesswork.

**Owner:** Agent instructions (already partially there).

**How:** In **jarvis/DEEP_WORK_PRODUCT.md** and **jarvis/AGENTS.md**: "Before planning or implementing for a product, call **repo_summary(product.repo)** and use the result as context for the PRD/roadmap." Enforce in default behavior: when the user names a product, run repo_summary first when available.

**Ref:** [JARVIS_SMARTER.md](./JARVIS_SMARTER.md) §1, [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md).

---

## P1 — Strong differentiators

### 4. When-to-invoke rules (orchestration)

**Why:** JARVIS consistently uses BEAST MODE, Code Roach, Echeo, workflow_dispatch instead of ad-hoc choices.

**Status:** Done. [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md) has § "When-to-invoke rules" with the table; jarvis/AGENTS.md references it.

**Owner:** Docs + AGENTS.md.

**How:** (1) Before ship → BEAST MODE. (2) PR or after implement → Code Roach. (3) "What should I work on?" / bounties → Echeo. (4) Long implement → sessions_spawn.

---

### 5. Tool/skill visibility in UI

**Why:** User sees which tools JARVIS used (trust, debuggability).

**Status:** Done. Edge extracts `meta` (tools_used, structured_result) from gateway response and forwards to UI; UI displays in Message / StructuredResultView. Gateway or Edge must send `tools_used` when tools were used.

**Owner:** Gateway or Edge response shape.

**How:** [JARVIS_UI_GATEWAY_CONTRACT.md](./JARVIS_UI_GATEWAY_CONTRACT.md) §2.6, §2.7. Chat response includes `meta: { tools_used: string[], structured_result?: ... }` when tools were used.

---

### 6. Model routing (cost + quality)

**Why:** Use a fast/cheap model for simple queries and a strong model for complex reasoning or deep work.

**Status:** Documented. [GETTING_STARTED_MODES.md](../GETTING_STARTED_MODES.md) § Model routing: primary = strong, fallbacks = fast/cheap; optional future hint.

**Owner:** Gateway config + optional agent hint.

**How:** Gateway: primary = strong model (e.g. gpt-4o), fallbacks include a fast model (e.g. groq/llama). Optional: session or message hint ("use fast" / "use best") in UI later.

---

### 7. Proactive heartbeat / briefs

**Why:** JARVIS surfaces "next product," open issues/PRs, or alerts without the user asking.

**Status:** Done. **scripts/heartbeat-brief.js** runs safety net, builds a short brief, and posts to JARVIS_ALERT_WEBHOOK_URL or DISCORD_WEBHOOK_URL. Schedule via cron or run on-demand. See [jarvis/HEARTBEAT.md](../jarvis/HEARTBEAT.md).

---

## P2 — Polish and scale

### 8. User prefs ("always use X")

**Why:** Corrections and preferences persist across sessions.

**Status:** Done (with §1). Edge reads jarvis_prefs when building context and injects "User preferences: …"; set_pref action (POST action=set_pref) writes to jarvis_prefs. Optional: add remember_preference / recall_prefs tool later.

**Owner:** Memory wiring (same as §1) + small prefs API or skill.

**How:** When user says "always use X" or "prefer Y for Z," write to `jarvis_prefs` (key/value/scopes). When building context for the model, read prefs and inject: "User preferences: …".

**Ref:** [JARVIS_MEMORY.md](./JARVIS_MEMORY.md) § Preferences.

---

### 9. DECISIONS.md + recall

**Why:** Durable decision log; JARVIS can answer "what did we decide about X?"

**Status:** Done. jarvis/AGENTS.md: remember → append DECISIONS.md; recall → use repo_search for "decision" or read DECISIONS.md. See [DECISIONS_MEMORY.md](./DECISIONS_MEMORY.md).

---

### 10. Voice in/out

**Why:** Hands-free and natural for many users.

**Status:** Done. UI: Voice button + conversation mode (browser TTS + mic). Skills: voice-control (wake word, voice_command). See [JARVIS_VOICE.md](./JARVIS_VOICE.md).

---

### 11. Audit log for elevated actions

**Why:** Security and compliance; "who ran what when."

**Status:** Documented. [JARVIS_AUDIT_LOG.md](./JARVIS_AUDIT_LOG.md) describes what to log, how to enable (gateway config, Supabase table, or file), and optional approval for high-risk actions.

---

### 12. Parallel or batched tool calls

**Why:** Faster when multiple tools are independent (e.g. clock + web_search + repo_summary).

**Status:** Documented. [JARVIS_PARALLEL_TOOL_CALLS.md](./JARVIS_PARALLEL_TOOL_CALLS.md): use an LLM that supports multiple tool calls in one turn; gateway merges results. Otherwise "prefer one tool per turn" until supported.

---

## Quick reference

| # | Item | Priority | Status |
|---|------|----------|--------|
| 1 | Session + prefs to Supabase | P0 | Done (Edge) |
| 2 | Summary + recent N (long context) | P0 | Done (Edge) |
| 3 | Bootstrap repo_summary (deep work) | P0 | Done (AGENTS, DEEP_WORK) |
| 4 | When-to-invoke rules | P1 | Done (orchestration doc, AGENTS) |
| 5 | Tool visibility in UI | P1 | Done (Edge + UI) |
| 6 | Model routing (cost/quality) | P1 | Documented (GETTING_STARTED_MODES) |
| 7 | Proactive heartbeat | P1 | Done (heartbeat-brief.js) |
| 8 | User prefs persistence | P2 | Done (with §1) |
| 9 | DECISIONS.md + recall | P2 | Done (AGENTS) |
| 10 | Voice in/out | P2 | Done (UI + JARVIS_VOICE.md) |
| 11 | Audit log elevated | P2 | Documented (JARVIS_AUDIT_LOG.md) |
| 12 | Parallel tool calls | P2 | Documented (JARVIS_PARALLEL_TOOL_CALLS.md) |

---

**Next wave:** See [JARVIS_NEXT_WAVE.md](./JARVIS_NEXT_WAVE.md) for the next innovation stack (UI session hydrate from Edge, set_pref from UI, richer heartbeat, streaming+meta, etc.). First item (session hydrate) is done.
