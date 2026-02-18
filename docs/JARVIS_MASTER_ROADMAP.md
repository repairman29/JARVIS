# JARVIS Master Roadmap

**Single view of all JARVIS tracks, current status, and what’s next — including priorities from the 2026 agentic ecosystem.**

Use this as the entry point for "what’s the JARVIS roadmap?" Detail lives in the linked docs.

**Status:** ✅ Done | 🟡 Partial | 🚧 In progress | ⬜ Todo

---

## 1. Track summary

| Track | Scope | Status | Detail |
|-------|--------|--------|--------|
| **Windows / ROG** | Badassery, daily brief, quick notes, focus mode, timers, Win+J, color picker, workspace save/restore | ✅ Phases 1–4 done | [JARVIS_ROADMAP.md](../JARVIS_ROADMAP.md) (root) |
| **Chat UI** | Composer, streaming, session, markdown, tools, settings, polish, sessions, export, /fast /best | ✅ Phases 1–4 done | [JARVIS_UI_ROADMAP.md](./JARVIS_UI_ROADMAP.md), [JARVIS_UI_AUDIT.md](./JARVIS_UI_AUDIT.md) |
| **Edge + MCP** | Hosted JARVIS (Supabase Edge), Cursor MCP, session/prefs in Supabase | ✅ Done | [JARVIS_EDGE_WHAT_CHANGES.md](./JARVIS_EDGE_WHAT_CHANGES.md), [JARVIS_MCP_CURSOR.md](./JARVIS_MCP_CURSOR.md) |
| **Cutting-edge (12)** | Session/prefs, long-context summary, product bootstrap, when-to-invoke, tool visibility, model routing, heartbeat, DECISIONS recall, voice, audit, parallel tools | ✅ All done | [JARVIS_CUTTING_EDGE.md](./JARVIS_CUTTING_EDGE.md) |
| **Next wave (8)** | Session hydrate, set_pref from UI, richer heartbeat brief, streaming+meta, /fast /best, audit log, DECISIONS append, E2E hydration | ✅ All done | [JARVIS_NEXT_WAVE.md](./JARVIS_NEXT_WAVE.md) |
| **Next wave 2 (4)** | Audit script, RUNBOOK, E2E tip, hero skill stubs | ✅ Done | [JARVIS_NEXT_WAVE.md](./JARVIS_NEXT_WAVE.md) § Next wave 2 |
| **Pixel Perfection** | JARVIS on Pixel 8 Pro: voice, latency, wake word when onnxruntime available, Vulkan | 🟡 Foundation + polish done; perfection phase in progress | [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md) |
| **2026 ecosystem** | MCP-first, memory that writes, proactive, agentic security, intent engineering, multimodal | 🚧 Backlog below | This doc §3 |

---

## 2. What’s done (consolidated)

- **Windows/ROG:** Doc & prompt, quick wins (daily brief, quick notes, emoji, power plan, focus mode), medium (timers, get_active_window, prebuilt workflows, clipboard history), polish (Win+J, color picker, workspace save/restore).
- **Chat UI:** Foundation (composer, stream, session, scroll), readability (markdown, code, tool visibility when gateway sends meta, errors, retry, reconnect), context (skills, session hint, settings, slash commands), polish (keyboard, a11y, themes, export, Cmd+J, multiple sessions, Run and copy result). Session hydrate from Edge on load.
- **Edge/MCP:** Supabase Edge function, Vault, session_messages + session_summaries + jarvis_prefs, GET session + set_pref, Cursor MCP.
- **Cutting-edge:** Persistent session/prefs, long-context summary, product context bootstrap (repo_summary), when-to-invoke rules, tool/skill visibility, model routing, heartbeat brief, DECISIONS.md recall, voice doc, audit log table + Edge, parallel tool calls doc.
- **Next wave:** Hydrate session from Edge, set_pref from UI, richer heartbeat (PRs/issues, next action), streaming+meta, /fast /best hint, audit log implementation, DECISIONS append skill, E2E session hydration; audit script, RUNBOOK, E2E with dev server, hero skill stubs.

---

## 3. Newly discovered — 2026 ecosystem backlog

Priorities derived from [AGENTIC_AUTONOMY_2026_ECOSYSTEM.md](./AGENTIC_AUTONOMY_2026_ECOSYSTEM.md) and the development drivers in clawd **PRODUCTS.md** (§ Development drivers). Use these to shape the next wave of work.

| # | Item | Driver | Notes |
|---|------|--------|--------|
| 1 | **MCP-first for new skills** | MCP-first integrations | ✅ Done. CONTRIBUTING § MCP or skill? + § Creating a New Skill references it before skill structure. |
| 2 | **Memory consolidation/decay** | Memory that writes | ✅ Done. Design + **scripts/prune-jarvis-memory.js** (prune messages per session, remove stale summaries). RUNBOOK + ORCHESTRATION_SCRIPTS; use `--dry-run` then schedule weekly. |
| 3 | **Proactive beyond heartbeat** | Proactive value | ✅ Scheduled brief + failure alerts done (ORCHESTRATION_SCRIPTS § Proactive extensions). Future: calendar/email nudge when Edge has calendar/email access. |
| 4 | **Agentic security runbook** | Agentic security by default | ✅ Done. RUNBOOK § Agentic security; JARVIS_AUDIT_LOG links to it. Permission scoping, audit trail, prompt-injection and memory-poisoning mitigations. |
| 5 | **Intent-engineering flows** | Intent engineering | Deep work + BEAST MODE + Code Roach already support "guide, don’t hand-code." ✅ Done. PREBUILT_WORKFLOWS § Intent-engineering flows (triad, quality gate, deep work, what should I work on?, health check); AGENTS § Orchestrate references it. |
| 6 | **Multimodal: voice polish** | Multimodal when it pays | ✅ Done. Reduced-motion TTS, no-mic fallback, **push-to-talk** (hold mic ~250ms then release to send). Rest: [JARVIS_VOICE.md](./JARVIS_VOICE.md) § Voice polish. **Next: "Hey JARVIS" wake word** — [JARVIS_WAKE_WORD_ROADMAP.md](./JARVIS_WAKE_WORD_ROADMAP.md) (POC → MVP → production). |
| 7 | **Multimodal: vision/screen (optional)** | Multimodal when it pays | ✅ UI + API + Edge pass-through done; gateway accepts imageDataUrl when ready. [JARVIS_VISION_BACKLOG.md](./JARVIS_VISION_BACKLOG.md). |
| 8 | **Gateway meta contract** | Tool visibility / trust | UI and Edge are ready for `meta.tools_used` and `meta.structured_result`. Ensure gateway implementers (and any fork) follow [JARVIS_UI_GATEWAY_CONTRACT.md](./JARVIS_UI_GATEWAY_CONTRACT.md) and [JARVIS_GATEWAY_META.md](./JARVIS_GATEWAY_META.md). |
| 9 | **Ecosystem doc sync** | Keep PRODUCTS + ecosystem in sync | ✅ Rule documented. HANDOFF + DOCUMENTATION_MAP § How we document: update clawd PRODUCTS.md and cite ecosystem doc when adding products/patterns. |

---

## 4. Suggested next actions

- **Short term:** ~~(1) Add agentic security runbook section to RUNBOOK + JARVIS_AUDIT_LOG~~ ✅; ~~(2) Document "MCP or skill?" in CONTRIBUTING or skill README~~ ✅; ~~(3) Ensure gateway meta contract is in gateway repo/docs~~ ✅ (added docs/GATEWAY_IMPLEMENTER.md; RUNBOOK + DOCUMENTATION_MAP point to it).
- **Medium term:** ~~(4) Optional proactive extensions (scheduled brief to channel, failure alerts)~~ ✅ (ORCHESTRATION_SCRIPTS § Proactive extensions); ~~(5) Intent-engineering flows in PREBUILT_WORKFLOWS or AGENTS~~ ✅ (PREBUILT_WORKFLOWS § Intent-engineering flows; AGENTS § Orchestrate); (6) Voice polish if usage justifies.
- **Backlog:** Vision in gateway (accept imageDataUrl); voice polish if usage justifies; periodic refresh of ecosystem doc.
- **Done this pass:** Memory consolidation + prune script; voice polish (reduced-motion, no-mic fallback, push-to-talk); vision UI + API + Edge pass-through; gateway meta (GATEWAY_IMPLEMENTER); **hero skills:** Focus Pro (timer + macOS/Linux/Windows notify), Notion (search, create page, query database, append blocks). See HERO_SKILLS_NEXT.md.

---

## 5. References

| Topic | Doc |
|-------|-----|
| Product plan (vision, tracks, next 6–12 months) | [JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) |
| Windows/ROG roadmap | [JARVIS_ROADMAP.md](../JARVIS_ROADMAP.md) |
| Chat UI roadmap + audit | [JARVIS_UI_ROADMAP.md](./JARVIS_UI_ROADMAP.md), [JARVIS_UI_AUDIT.md](./JARVIS_UI_AUDIT.md) |
| Cutting-edge (12 items) | [JARVIS_CUTTING_EDGE.md](./JARVIS_CUTTING_EDGE.md) |
| Next wave + next wave 2 | [JARVIS_NEXT_WAVE.md](./JARVIS_NEXT_WAVE.md) |
| 2026 agentic ecosystem (stored article) | [AGENTIC_AUTONOMY_2026_ECOSYSTEM.md](./AGENTIC_AUTONOMY_2026_ECOSYSTEM.md) |
| Developer supremacy, smarter, deep work | [JARVIS_DEVELOPER_SUPREMACY.md](./JARVIS_DEVELOPER_SUPREMACY.md), [JARVIS_SMARTER.md](./JARVIS_SMARTER.md), [jarvis/DEEP_WORK_PRODUCT.md](../jarvis/DEEP_WORK_PRODUCT.md) |
| Gateway contract + meta | [JARVIS_UI_GATEWAY_CONTRACT.md](./JARVIS_UI_GATEWAY_CONTRACT.md), [JARVIS_GATEWAY_META.md](./JARVIS_GATEWAY_META.md) |
| Memory consolidation (design) | [JARVIS_MEMORY_CONSOLIDATION.md](./JARVIS_MEMORY_CONSOLIDATION.md) |
| Vision/screen backlog | [JARVIS_VISION_BACKLOG.md](./JARVIS_VISION_BACKLOG.md) |
| Pixel 8 Pro (voice, wake word, perfection) | [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md) |

**How to use:** Pick a track from §1, confirm status in §2, then either close gaps in the detailed roadmap or pull from the §3 backlog. Update this doc when a track phase completes or when new "newly discovered" items are added.
