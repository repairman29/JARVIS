# JARVIS Product Plan

**Single plan for JARVIS: vision, tracks, current state, and next steps.**  
Use this to see how everything fits and what to do next.

Status: ✅ Done | 🚧 In progress | ⬜ Todo

---

## 1. Vision & North Star

- **What JARVIS is:** AI-powered conversational productivity — natural language to run skills (launcher, files, clipboard, GitHub, PR, web search, etc.) locally or via a hosted gateway.
- **North star:** One place to talk to JARVIS (CLI, chat UI, or MCP in Cursor); same skills and context whether you’re on Windows/ROG, Mac, or in the browser.
- **Outcomes:** Developer/productivity users ship faster; premium users get stronger models and optional premium skills; community extends via skills and contributions.

---

## 2. Tracks (What Exists Today)

| Track | Scope | Status | Doc |
|-------|--------|--------|-----|
| **Windows / ROG Ed** | Badassery, daily brief, quick notes, focus mode, timers, Win+J, color picker, workspace save/restore | ✅ Phases 1–4 done | [JARVIS_ROADMAP.md](../JARVIS_ROADMAP.md) |
| **Chat UI** | Developer-grade web UI: composer, streaming, session, markdown, tools, settings, polish | ✅ Phase 1 done; Phase 2–4 partly done (see audit) | [JARVIS_UI_ROADMAP.md](./JARVIS_UI_ROADMAP.md), [JARVIS_UI_AUDIT.md](./JARVIS_UI_AUDIT.md), [JARVIS_UI_DEVELOPER_SPEC.md](./JARVIS_UI_DEVELOPER_SPEC.md) |
| **Modes (Blue / Yellow / Hot Rod)** | Free → premium fallback → paid primary; same repo, different keys/config | ✅ Doc’d, config-driven | [GETTING_STARTED_MODES.md](../GETTING_STARTED_MODES.md) |
| **Hosted JARVIS (Edge + MCP)** | Run JARVIS on Supabase Edge; call from scripts, apps, Cursor MCP | ✅ Spec + setup | [JARVIS_EDGE_WHAT_CHANGES.md](./JARVIS_EDGE_WHAT_CHANGES.md), [JARVIS_MCP_CURSOR.md](./JARVIS_MCP_CURSOR.md), [JARVIS_MCP_SUPABASE.md](./JARVIS_MCP_SUPABASE.md) |
| **Showcase / premium** | Same site [repairman29.github.io/JARVIS](https://repairman29.github.io/JARVIS); premium skills (Notion, GitHub++, Focus Pro, etc.) and skill marketplace | ✅ Live; content/features evolve | README, JARVIS_WINDOWS_EPIC, JARVIS_OFFICE_EMAIL_CALENDAR |

---

## 3. Current State (Summary)

- **Core:** Gateway + skills (launcher, window manager, file search, clipboard, snippets, calculator, workflow, marketplace, voice, performance, PR, web search, clock, etc.) — **done and shipped** (v1.0.0).
- **Windows/ROG:** All roadmap phases done; Win+J quick access, daily brief, focus mode, timers, workspace save/restore, etc.
- **Modes:** Blue (free), Yellow (premium fallback), Hot Rod (paid) — documented; users add keys and config.
- **Hosted/Edge:** Supabase Edge Function + Vault; MCP in Cursor; one URL for scripts/apps.
- **UI:** Spec, roadmap, and **audit** exist; implementation in `apps/jarvis-ui/` — **Phase 1 done**; Phase 2 (markdown, errors, retry) mostly done, 2.4 syntax highlighting not wired; Phase 3 (3.2, 3.3 done); Phase 4 (4.3, 4.4 themes done). See [JARVIS_UI_AUDIT.md](./JARVIS_UI_AUDIT.md).
- **Showcase:** GitHub Pages live; premium positioning and skill list documented in multiple docs but not one “premium roadmap.”

---

## 4. How the Pieces Fit

```
                    ┌─────────────────────────────────────────┐
                    │           JARVIS Product Plan            │
                    └─────────────────────────────────────────┘
                                         │
         ┌───────────────────────────────┼───────────────────────────────┐
         │                               │                               │
         ▼                               ▼                               ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│  How you run it  │           │  What you get   │           │  Where it runs  │
│  • CLI           │           │  • Modes:       │           │  • Local        │
│  • Chat UI       │           │    Blue /       │           │  • Edge (hosted)│
│  • MCP (Cursor)  │           │    Yellow /     │           │  • Showcase     │
│                  │           │    Hot Rod      │           │    (Pages)      │
└─────────────────┘           └─────────────────┘           └─────────────────┘
         │                               │                               │
         └───────────────────────────────┼───────────────────────────────┘
                                         │
                                         ▼
                    ┌─────────────────────────────────────────┐
                    │  Same skills, gateway, and context       │
                    │  (launcher, files, GitHub, PR, search…)  │
                    └─────────────────────────────────────────┘
```

- **Skills** are shared across local, Edge, and (where applicable) showcase.
- **Modes** only change primary/fallback models and cost; they don’t change the skill set.
- **UI** and **MCP** are two front-ends to the same gateway (local or Edge).

---

## 5. Next 6–12 Months (Themes & Milestones)

| Theme | Outcome | Rough order |
|-------|---------|-------------|
| **Chat UI foundation** | Developer can use `apps/jarvis-ui` to chat, stream, keep one session across reloads | ✅ Done — Phase 1 complete |
| **UI readability & trust** | Markdown/code, tool visibility, clear errors, reconnect | 2 — Phase 2 |
| **UI context & polish** | Skills list, settings, keyboard/a11y/themes, optional export/shortcut | 3 — Phases 3–4 |
| **UI → Edge** | Chat UI talks to hosted JARVIS (Supabase Edge) so “JARVIS in browser” without local gateway | ✅ Done — Edge URL + auth in UI |
| **Premium clarity** | One place that lists premium skills, pricing/packaging (if any), and how to get Yellow/Hot Rod | ✅ Done — [docs/PREMIUM_CLARITY.md](./PREMIUM_CLARITY.md) |
| **Community & skills** | Skill marketplace, docs for contributors, maybe 1–2 “hero” premium skills (e.g. Notion, Focus Pro) | [docs/COMMUNITY_AND_SKILLS.md](./COMMUNITY_AND_SKILLS.md) — ongoing |

No fixed dates here; order is priority. Adjust when dependencies (e.g. gateway session API) are clear.

---

## 5b. Next up (keep going with the roadmap)

**Focus: JARVIS UI as the primary JARVIS surface** (per [JARVIS_FIRST_OUR_TOOLS.md](./JARVIS_FIRST_OUR_TOOLS.md)). Roadmap and audit: [JARVIS_UI_ROADMAP.md](./JARVIS_UI_ROADMAP.md), [JARVIS_UI_AUDIT.md](./JARVIS_UI_AUDIT.md).

**Done:** Code blocks (2.4), export transcript (4.5), Settings modal (3.4), Reconnecting… (2.10), a11y live region (4.2), discoverable skills (3.1), slash commands (3.5), keyboard/Escape/focus trap (4.1), Cmd+J (4.6), multiple sessions (4.7), "Prompt trimmed to N chars" (2.2).

**Remaining (gateway-dependent):**

| Priority | Item | Phase | Effort | Impact |
|----------|------|--------|--------|--------|
| 1 | **Tool/skill visibility** — Show when JARVIS used a skill (e.g. "Used: launcher") | 2.6 | ✅ | Edge passes through `meta.tools_used` and extracts from `tool_calls`; UI shows chips. |
| 2 | **Structured tool output** — Render lists/tables/expandable when gateway returns structured results | 2.7 | ✅ | UI renders list/table/key_value/expandable JSON; API + Edge pass-through. |
| 3 | **CLI parity** — "Run and copy result" | 4.8 | ✅ | UI: "Run and copy result" button sends once, copies response to clipboard. |

**Suggested next:** Gateway/Edge send `meta.tools_used` and `meta.structured_result` when available; premium/community themes (skill marketplace, hero skills).

---

## 6. Success Metrics (Proposed)

- **North star:** Active sessions (local + Edge) per week or month.
- **Supporting:**  
  - Chat UI: “Phase 1 done” (streaming + persistent session).  
  - MCP: Number of Cursor users using JARVIS MCP.  
  - Showcase: Traffic and install attempts (e.g. from Pages).  
  - Community: New skills or PRs per quarter.

Tune these when you lock a launch or a premium offering.

---

## 7. References (Where the Detail Lives)

| Topic | Doc |
|-------|-----|
| **Master roadmap** (all tracks + 2026 ecosystem backlog) | [JARVIS_MASTER_ROADMAP.md](./JARVIS_MASTER_ROADMAP.md) |
| **Developer supremacy** (unbeatable JARVIS playbook) | [JARVIS_DEVELOPER_SUPREMACY.md](./JARVIS_DEVELOPER_SUPREMACY.md) |
| **JARVIS smarter** (current smarts + next-level levers) | [JARVIS_SMARTER.md](./JARVIS_SMARTER.md) |
| Windows/ROG roadmap (done) | [JARVIS_ROADMAP.md](../JARVIS_ROADMAP.md) |
| Chat UI spec | [JARVIS_UI_DEVELOPER_SPEC.md](./JARVIS_UI_DEVELOPER_SPEC.md) |
| Chat UI phased roadmap | [JARVIS_UI_ROADMAP.md](./JARVIS_UI_ROADMAP.md) |
| Modes (Blue / Yellow / Hot Rod) | [GETTING_STARTED_MODES.md](../GETTING_STARTED_MODES.md) |
| Hosted JARVIS (Edge) | [JARVIS_EDGE_WHAT_CHANGES.md](./JARVIS_EDGE_WHAT_CHANGES.md) |
| JARVIS as MCP in Cursor | [JARVIS_MCP_CURSOR.md](./JARVIS_MCP_CURSOR.md), [JARVIS_MCP_SUPABASE.md](./JARVIS_MCP_SUPABASE.md) |
| JARVIS-first (our tools, not Cursor) | [JARVIS_FIRST_OUR_TOOLS.md](./JARVIS_FIRST_OUR_TOOLS.md) |
| Repo map | [REPO_INDEX.md](./REPO_INDEX.md) |
| Doc map | [DOCUMENTATION_MAP.md](./DOCUMENTATION_MAP.md) |

---

**How to use this plan:** Pick a theme from §5, map it to the right track in §2, then work from the referenced roadmap or spec. Update this doc when you add a new track or change north star / milestones.
