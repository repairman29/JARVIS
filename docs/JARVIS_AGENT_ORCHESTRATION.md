# JARVIS Agent Orchestration — Using Autonomous Systems to Build Products

**Goal:** JARVIS uses the ecosystem’s autonomous and AI agent systems to **build out products** — not just JARVIS alone, but JARVIS as the conductor that invokes BEAST MODE, Code Roach, Echeo, workflow_dispatch, and spawns so that products get planned, implemented, quality-checked, and shipped.

---

## Build flow: JARVIS + agent systems

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  JARVIS BUILDS PRODUCTS BY ORCHESTRATING AUTONOMOUS / AGENT SYSTEMS          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Plan          JARVIS (PRD, roadmap, issues)  — products.json, deep work  │
│       │                                                                      │
│  2. Implement     JARVIS + sessions_spawn       — long runs, subagents      │
│       │           repo-knowledge, exec, GitHub                               │
│       │                                                                      │
│  3. Quality       BEAST MODE                    — quality score, janitor,    │
│       │           (CLI or workflow_dispatch)     vibe restore, architecture  │
│       │                                                                      │
│  4. PR / health   Code Roach                    — analyze pr, health, crawl │
│       │           (CLI or workflow_dispatch)     (knowledge base)            │
│       │                                                                      │
│  5. Ship          JARVIS                        — commit, push,              │
│                   workflow_dispatch + platform    workflow_dispatch,         │
│                   CLIs (Vercel, Railway, etc.)    deploy                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

When the user says **“deep work on [product]”**, **“build out [product]”**, or **“full product cycle”**, JARVIS should run this flow and **invoke these systems** where they exist (CLI installed, workflow in repo, or exec available).

---

## Agent systems JARVIS can use

| System | What it does | How JARVIS invokes it | When in build flow |
|--------|----------------|------------------------|---------------------|
| **BEAST MODE** | Quality score, AI Janitor, vibe restore, architecture enforcement, invisible CI | **Exec:** `beast-mode quality score`, `beast-mode janitor enable`, `beast-mode vibe restore`, `beast-mode architecture check`. **Or** `github_workflow_dispatch` on BEAST-MODE repo if it has a workflow that runs quality. | After implement, before ship. Optional: after each milestone. |
| **Code Roach** | PR analysis, codebase health, crawl (knowledge base), pattern learning | **Exec:** `code-roach analyze pr`, `code-roach health`, `code-roach crawl`. **Or** workflow_dispatch on code-roach repo if it has a workflow. | Before/after PR; health check during or after implement. |
| **Echeo** | Capability scan, bounty matching, GitHub issues as bounties | **Exec:** `echeo --path ...`, `echeo --scrape-github ...`, `echeo --match-needs ...`. **Or** repo-knowledge / API if Echeo exposes one. | When “what should I work on?” or matching product to opportunities. |
| **UpshiftAI** | Dependency lineage, ancient deps | **Exec or API** if UpshiftAI CLI/API is available. | When dealing with dependencies or upgrade decisions. |
| **GitHub workflow_dispatch** | Run workers, deploy, CI in any repo | **GitHub skill:** `github_workflow_dispatch(owner, repo, workflow_id, ref)`. | Ship: trigger deploy/build workflow. Quality: trigger BEAST MODE or Code Roach workflow if they run in CI. |
| **sessions_spawn** | Background subagent for long implementation | **Tool:** `sessions_spawn` with task + deliverables + ETA. | Implement: spawn when implementation is long; checkpoint and summarize when done. |
| **JARVIS autonomous build** | Pull, validate skills, build in-repo subprojects | **Script:** `node scripts/jarvis-autonomous-build.js` (scheduled or on-demand). | After push to JARVIS repo; or schedule so JARVIS repo stays green. |

**Repos:** BEAST-MODE, code-roach, echeo, upshift, project-forge (and others in repos.json) may have CLIs, APIs, or GitHub Actions. JARVIS uses **exec** when the CLI is installed on the machine, **github_workflow_dispatch** when the repo has a workflow, and **repo-knowledge** to understand what each system does and how to call it.

---

## Instructions for JARVIS

When doing **deep work** or **building out a product**:

1. **Plan** — Use products.json, PRD, roadmap, issues (JARVIS as PM). Create issues/PRs via GitHub skill.
2. **Implement** — Use repo-knowledge for context, exec for tests/lint, **sessions_spawn** for long implementation runs. Check repairman29 repos for goodies first.
3. **Quality** — Before or after PR: run **BEAST MODE** (e.g. `beast-mode quality score`, or trigger BEAST-MODE workflow if present). Run **Code Roach** (`code-roach analyze pr`, `code-roach health`) when a PR exists or for health checks.
4. **Ship** — Commit, push, then **workflow_dispatch** for deploy/build in that product’s repo; or use platform CLIs (Vercel, Railway, etc.). Verify and report.
5. **Orchestrate** — Prefer invoking these systems (exec or workflow_dispatch) over doing everything in-chat. JARVIS is the conductor; BEAST MODE, Code Roach, Echeo, and CI workers do the specialized work.

If a CLI is not installed or a workflow doesn’t exist, JARVIS can still do planning, implementation via repo-knowledge + exec, and ship via GitHub + platform CLIs; add a note like “Install beast-mode CLI to run quality checks from JARVIS” or “Add a quality workflow to BEAST-MODE repo so I can trigger it.”


## When-to-invoke rules

Use these rules so JARVIS doesn't guess — invoke the right system at the right step. Reference this section from **jarvis/AGENTS.md**.

| Situation | Invoke |
|-----------|--------|
| **Before ship** (after implement, before deploy) | BEAST MODE quality (e.g. `beast-mode quality score` or workflow). |
| **When a PR exists** or after implement | Code Roach (`code-roach analyze pr`, `code-roach health`). |
| **"What should I work on?"** or **bounties** | Echeo (e.g. `echeo --path ...`, `echeo --scrape-github ...`). |
| **Long implementation run** | sessions_spawn with task + deliverables + ETA. |
| **Deploy / build in repo** | workflow_dispatch for that repo's deploy workflow; or platform CLIs (Vercel, Railway, etc.). |

---

## References

- **Deep work:** [jarvis/DEEP_WORK_PRODUCT.md](../jarvis/DEEP_WORK_PRODUCT.md)
- **GitHub skill (workflow_dispatch):** [jarvis/TOOLS.md](../jarvis/TOOLS.md) → GitHub, [skills/github/SKILL.md](../skills/github/SKILL.md)
- **Platform CLIs:** [jarvis/TOOLS.md](../jarvis/TOOLS.md) → Platform CLIs (Maestro)
- **Ecosystem (README):** [README.md](../README.md) → “The Ecosystem: Power Tools for JARVIS”
- **Repos = goodies:** [JARVIS_AND_YOUR_REPOS.md](./JARVIS_AND_YOUR_REPOS.md)
- **Developer supremacy:** [JARVIS_DEVELOPER_SUPREMACY.md](./JARVIS_DEVELOPER_SUPREMACY.md)
