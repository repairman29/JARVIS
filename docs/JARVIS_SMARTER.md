# How We Make JARVIS Even Smarter

**Goal:** One place for "how JARVIS is smart today" and **concrete levers** to make JARVIS even smarter — context, grounding, orchestration, memory, and proactive behavior.

---

## Current smarts (what we have)

| Area | What JARVIS does | Where it lives |
|------|-------------------|----------------|
| **Product awareness** | Knows what products **can do** (code) vs. what we say (description) | repo_summary, repo_search per product; [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md) |
| **Goodies first** | Checks repairman29 repos before building from scratch | [JARVIS_AND_YOUR_REPOS.md](./JARVIS_AND_YOUR_REPOS.md), jarvis/AGENTS.md |
| **Orchestration** | Uses BEAST MODE, Code Roach, Echeo, workflow_dispatch to build products | [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md) |
| **Deep work** | Plan → develop → ship with checkpoints and next action | [jarvis/DEEP_WORK_PRODUCT.md](../jarvis/DEEP_WORK_PRODUCT.md) |
| **Repo-knowledge** | Semantic search/summaries across all indexed repos | repo-knowledge skill, index-repos.js |
| **Session** | Persistent conversation per session (UI localStorage, gateway session) | apps/jarvis-ui, gateway |
| **Hot Rod** | Best model when it matters (complex reasoning) | [GETTING_STARTED_MODES.md](../GETTING_STARTED_MODES.md) |
| **Workflows + learn_patterns** | Repeatable combos; workflow-automation can learn from usage | workflow-automation skill, learn_patterns |
| **Heartbeat** | Periodic "next product," issues, PRs, workflow_dispatch | [jarvis/HEARTBEAT.md](../jarvis/HEARTBEAT.md) |
| **UI audit** | Knows what's already built so we don't redo work | [JARVIS_UI_AUDIT.md](./JARVIS_UI_AUDIT.md) |
| **Memory (long life)** | Short-term (session thread) vs long-term (DECISIONS, prefs); session persistence, summarization | [JARVIS_MEMORY.md](./JARVIS_MEMORY.md) |

---

## Next-level smarts (actionable levers)

### 1. Bootstrap product context

**Idea:** When JARVIS switches to a product (e.g. "deep work on olive") or answers "what can [product] do?", **always** run **repo_summary(repo)** first (and optionally repo_search for "architecture" or "main flows") so the model has code-grounded context from the start.

**Where:** Already in [PRODUCT_CAPABILITIES.md](./PRODUCT_CAPABILITIES.md) ("bootstrap with repo_summary"). Strengthen in **jarvis/DEEP_WORK_PRODUCT.md** and **jarvis/AGENTS.md**: "Before planning or implementing for a product, call repo_summary(product.repo) and use the result as context."

**Action:** Add one line to DEEP_WORK "Planning phase": "Bootstrap: run repo_summary(repo) for this product and use it as context for the PRD/roadmap."

---

### 2. Cite sources (grounding)

**Idea:** When JARVIS answers from repo-knowledge, **cite** the source (e.g. "From repo_summary(olive): …" or "From repo_search(olive, 'OAuth'): …"). Reduces hallucination and builds trust.

**Where:** **jarvis/AGENTS.md** (default behavior or a new "Grounding" bullet).

**Action:** Add: "When answering from repo-knowledge (repo_summary, repo_search, repo_file), cite the source briefly (e.g. 'From repo_summary(olive): …') so the user sees where the answer came from."

---

### 3. When to invoke which system (decision rules)

**Idea:** Clear rules so JARVIS doesn't guess: e.g. "PR open → run Code Roach"; "pre-ship → run BEAST MODE quality"; "what should I work on? → consider Echeo bounties."

**Where:** [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md) has the table; add a short **"When to invoke"** subsection.

**Action:** Add to orchestration doc: "When to invoke: (1) Before ship → BEAST MODE quality. (2) When PR exists or after implement → Code Roach analyze/health. (3) When user asks 'what should I work on?' or 'bounties' → Echeo. (4) Long implement → sessions_spawn."

---

### 4. Tool descriptions (smarter tool choice)

**Idea:** The model picks the right tool when skill.json **descriptions** are clear and actionable. "When to use" and examples in SKILL.md help too.

**Where:** [scripts/SKILLS_ROG_ED.md](../scripts/SKILLS_ROG_ED.md), per-skill **skill.json** and **SKILL.md**.

**Action:** When adding or changing a skill, follow SKILLS_ROG_ED: actionable descriptions, narrow parameters. Optional: periodic pass over skills to tighten "when to use" in SKILL.md.

---

### 5. Project / decision memory

**Idea:** When the user says "remember this decision" or "we decided X," JARVIS writes to a durable place (e.g. **DECISIONS.md** in the repo, or a small memory skill) so it can reference it later.

**Where:** New convention: **DECISIONS.md** in repo root (or per-product). Optional: small skill `remember_decision` / `recall_decisions` that appends and searches.

**Action:** Document in AGENTS or a short **docs/DECISIONS_MEMORY.md**: "When the user says 'remember this decision' or 'we decided X,' append to DECISIONS.md (or product-specific doc) with date and one-line summary. When planning or answering, repo_search for 'decision' or read DECISIONS.md if present."

---

### 6. User corrections as preference

**Idea:** When the user says "no, use X not Y" or "always do Z," JARVIS could store a **preference** (e.g. in session, or in a prefs file like `~/.jarvis/prefs.json`) and use it next time.

**Where:** Would need a small convention or skill (e.g. "user said: use Vercel for frontend deploys" → store; when user says "deploy frontend," prefer Vercel).

**Action:** Optional. Document as "future: user prefs" or add a minimal prefs file + one bullet in AGENTS: "If the user corrects you ('use X not Y'), note it in this session and prefer X for the rest of the conversation; optional: persist to prefs for next time."

---

### 7. Proactive suggestions

**Idea:** Heartbeat already suggests "next product, issues, PRs." Extend with: "Repo index for [product] is stale — run index-repos?" or "You have 3 open PRs in olive — run Code Roach on them?"

**Where:** [jarvis/HEARTBEAT.md](../jarvis/HEARTBEAT.md), or gateway/skill that runs heartbeat logic.

**Action:** Add optional heartbeat bullets: "If repo index is stale (safety net), suggest running index-repos for focus repo"; "If focus repo has open PRs, suggest running Code Roach on one."

---

### 8. Hot Rod by task type

**Idea:** JARVIS suggests or uses Hot Rod (best model) automatically for: security review, multi-file refactor, complex design, or when the user says "think carefully."

**Where:** [GETTING_STARTED_MODES.md](../GETTING_STARTED_MODES.md), **jarvis/AGENTS.md**.

**Action:** Add to AGENTS: "For security review, large refactor, or when the user says 'think carefully' or 'full analysis,' suggest Hot Rod (best model) or use it if already configured."

---

### 9. Always next action + checkpoints

**Idea:** Every JARVIS reply ends with a **next action**; after each phase (plan, implement, ship) a **checkpoint** (what was done, what's next). Reduces "what do I do now?"

**Where:** Already in [jarvis/AGENTS.md](../jarvis/AGENTS.md) (PM mode, deep work), [jarvis/DEEP_WORK_PRODUCT.md](../jarvis/DEEP_WORK_PRODUCT.md).

**Action:** Reinforce in AGENTS default behavior: "End every reply with a **next action** (one thing the user or JARVIS can do next). After each major phase, give a one-line checkpoint."

---

## Summary: priority order

| # | Lever | Effort | Impact |
|---|-------|--------|--------|
| 1 | Bootstrap product context (repo_summary at start of deep work) | Low | High — JARVIS starts with code truth |
| 2 | Cite sources when using repo-knowledge | Low | Medium — trust, less hallucination |
| 3 | When-to-invoke rules in orchestration doc | Low | Medium — correct use of BEAST/Code Roach/Echeo |
| 4 | Decision memory (DECISIONS.md convention) | Low | Medium — durable context |
| 5 | Proactive heartbeat (stale index, Code Roach on PRs) | Medium | Medium |
| 6 | Hot Rod by task type (suggest best model) | Low | Medium |
| 7 | Tool descriptions pass (SKILLS_ROG_ED) | Medium | High over time |
| 8 | User prefs (corrections → prefer next time) | Medium | Nice-to-have |
| 9 | **Session persistence** (short-term long life) | Medium | High — thread survives refresh/restart; see [JARVIS_MEMORY.md](./JARVIS_MEMORY.md). |
| 10 | **Summarization** (summary + recent turns) | Medium | High when threads are long; see [JARVIS_MEMORY.md](./JARVIS_MEMORY.md). |

**TL;DR:** Make JARVIS smarter by (1) bootstrapping with repo_summary when working on a product, (2) citing sources from repo-knowledge, (3) clear "when to invoke" rules for BEAST/Code Roach/Echeo, (4) DECISIONS.md for durable decisions, and (5) reinforcing next action + checkpoints. Then layer in proactive heartbeat and Hot Rod by task type.
