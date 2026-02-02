# JARVIS Developer Supremacy — Navy Seal Swiss Army Ninja MI6 Hacker Extraordinaire

**Goal:** Make JARVIS so badass that **no other developer is better** than you + JARVIS. JARVIS is the unfair advantage.

---

## North star

**One human + JARVIS = a full team** (PM, Eng, QA, UX, Ops) that knows all your repos, ships on command, and never forgets context. The developer who leans on JARVIS wins on speed, breadth, and depth.

---

## What already makes JARVIS unbeatable

| Lever | What it does | Where it lives |
|-------|----------------|----------------|
| **One-liner super commands** | One sentence → multiple tools (screenshot + copy path, open apps + snap windows, good morning brief) | [JARVIS_BADASSERY.md](../JARVIS_BADASSERY.md), Launcher, Window Manager, workflow-automation |
| **Deep work** | Plan (PRD, roadmap) → develop (issues, PRs, code) → ship (commit, push, deploy) in one flow | [jarvis/DEEP_WORK_PRODUCT.md](../jarvis/DEEP_WORK_PRODUCT.md), products.json `deepWorkAccess` |
| **Repo-knowledge** | Semantic search/summaries across **all repairman29 repos** — JARVIS “knows” your codebase | repo-knowledge skill, `node scripts/index-repos.js`, [jarvis/TOOLS.md](../jarvis/TOOLS.md) → Repo Knowledge |
| **Goodies first** | Before building from scratch, JARVIS checks repairman29 repos for existing implementations | [JARVIS_AND_YOUR_REPOS.md](./JARVIS_AND_YOUR_REPOS.md), [jarvis/AGENTS.md](../jarvis/AGENTS.md) |
| **Ship access** | Commit, push, deploy, workflow_dispatch for products with `shipAccess: true` | products.json, [JARVIS_FULL_ACCESS_ONE_PRODUCT.md](./JARVIS_FULL_ACCESS_ONE_PRODUCT.md) |
| **Platform CLIs (maestro)** | Vercel, Railway, Stripe, Fly, Cursor — one command, then report | [jarvis/TOOLS.md](../jarvis/TOOLS.md) → Platform CLIs |
| **Triad / swarm** | One pass = PM + Eng + QA (+ UX, Ops). PRD outline, issues, test plan in one go | [jarvis/PO_SWARMS.md](../jarvis/PO_SWARMS.md) |
| **BEAST-MODE PM** | JARVIS as product manager for BEAST-MODE: quality, architecture, invisible CI | [jarvis/BEAST_MODE_PM.md](../jarvis/BEAST_MODE_PM.md) |
| **Background agents** | Long tasks (refactors, multi-step builds) run in background; checkpoints + final summary | sessions_spawn, [REPAIRMAN29_OPERATIONS.md](./REPAIRMAN29_OPERATIONS.md) |
| **Autonomous build** | Scheduled pull, validate, build so the repo stays green without you | `node scripts/jarvis-autonomous-build.js`, [REPAIRMAN29_OPERATIONS.md](./REPAIRMAN29_OPERATIONS.md) |
| **Hot Rod mode** | Best model first (Claude, GPT-4o) when you need maximum reasoning | [GETTING_STARTED_MODES.md](../GETTING_STARTED_MODES.md) |
| **Workflows** | Repeatable combos: “morning routine,” “deploy and notify,” “PR + deploy” | workflow-automation skill, create_workflow + execute_workflow |
| **Agent orchestration** | JARVIS uses BEAST MODE, Code Roach, Echeo, workflow_dispatch, sessions_spawn to build products | [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md), jarvis/AGENTS.md |

---

## Tactical playbook: be the best developer

1. **Use JARVIS for every next action.** Don’t “go build it yourself” — ask JARVIS to plan, break into issues, implement, or ship. One human deciding *what*; JARVIS doing *how*.
2. **Keep repo-knowledge fresh.** Run `node scripts/index-repos.js` when you add repos or after big changes. JARVIS is only as good as the index for cross-repo search/summaries.
3. **Deep work one product at a time.** “Deep work on [product]” = full cycle. Set `deepWorkAccess: true` (and `shipAccess: true` if JARVIS should deploy) in products.json for that product.
4. **Triad/swarm for big bets.** “Run a triad on Beast-Mode” → PRD outline + issues + test plan in one pass. Add UX/Ops for swarms.
5. **Ship via JARVIS.** Commit, push, deploy, workflow_dispatch — all through JARVIS when shipAccess is on. Use platform CLIs (Vercel, Railway, etc.) through JARVIS so one place does “deploy and verify.”
6. **Hot Rod when it matters.** Complex design, security review, or multi-repo refactor → use Hot Rod (best model) so quality and reasoning are maxed.
7. **Check repairman29 repos first.** Before writing new code, JARVIS should repo_search / repo_summary. Reuse goodies; don’t redo.
8. **Use autonomous systems to build.** When building a product, JARVIS invokes BEAST MODE (quality), Code Roach (PR/health), Echeo (bounties when relevant), and workflow_dispatch so agents and CI do the work. See [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md).

---

## Gaps to close (actionable)

| Gap | Action |
|-----|--------|
| **Stale repo index** | Schedule or run `index-repos.js` regularly; run `jarvis-safety-net.js --repair` to warn. |
| **products.json missing deepWorkAccess/shipAccess** | Add `deepWorkAccess: true` / `shipAccess: true` for products JARVIS should plan+build+ship. |
| **No “security / perf” pass** | Optional: add a small skill or workflow that runs security lint / perf check (e.g. npm audit, lighthouse) and reports. |
| **Human forgets to ask JARVIS** | Make “what’s the next action?” a habit: JARVIS always ends with one; you execute via JARVIS. |
| **Single-repo mindset** | Prefer repo-knowledge and products.json so JARVIS thinks cross-repo and top-down. |

---

## One-line mantra

**“If it’s worth doing, JARVIS does it with me — plan, code, ship, ops. No other developer has this stack.”**

---

## References

- **Agent orchestration:** [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md) — JARVIS using BEAST MODE, Code Roach, Echeo, workflow_dispatch to build products.
- **Product plan:** [JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md)
- **Deep work:** [jarvis/DEEP_WORK_PRODUCT.md](../jarvis/DEEP_WORK_PRODUCT.md)
- **Ops / ship:** [REPAIRMAN29_OPERATIONS.md](./REPAIRMAN29_OPERATIONS.md), [JARVIS_FULL_ACCESS_ONE_PRODUCT.md](./JARVIS_FULL_ACCESS_ONE_PRODUCT.md)
- **Badassery (super commands, workspaces, daily brief):** [JARVIS_BADASSERY.md](../JARVIS_BADASSERY.md)
- **Repos = goodies:** [JARVIS_AND_YOUR_REPOS.md](./JARVIS_AND_YOUR_REPOS.md)
- **Tools & agents:** [jarvis/TOOLS.md](../jarvis/TOOLS.md), [jarvis/AGENTS.md](../jarvis/AGENTS.md)
