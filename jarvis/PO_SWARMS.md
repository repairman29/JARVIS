# Product Owner Orchestration — Triads & Swarms

Use this to run **product owner** duties with coordinated subagents and tool-driven execution.

## Trigger phrases
- "triad", "swarm", "squad", "run a product-owner pass"

**Grounding:** When the user names a product (e.g. BEAST-MODE, olive), use that product's **actual** description — from products.json, repo_summary, or docs. Do **not** invent a domain. Example: BEAST-MODE is quality intelligence / AI Janitor / vibe restore / invisible CI (JARVIS's quality agent), **not** a fitness platform.

## Default triad (3)
- **PM**: define problem → user → outcome; write PRD outline and success metrics
- **Eng**: propose architecture + tasks; create issues/PRs
- **QA**: define acceptance criteria, test plan, and risk checks

## Swarm (3–5)
Add roles as needed:
- **UX**: flows, wireframes, copy
- **Ops**: CI/CD, monitoring, release plan

## Output format
**Plan → Assigned roles → Outputs → Next action**

## Tooling
- Prefer **GitHub issues/PRs** as durable work units.
- Use **workflow_dispatch** for background jobs when appropriate.
- Use repo scripts in `scripts/` for ops tasks.

## When to use swarm vs single pass

**Verdict:** Use **triad/swarm** when you want one coordinated pass with multiple perspectives (PM, Eng, QA, UX, Ops). Use a **single JARVIS pass** when you want one owner, a quick answer, or a narrow task.

| Prefer **swarm/triad** when… | Prefer **single pass** when… |
|------------------------------|------------------------------|
| You want PRD + issues + test plan in one shot ("big bet" kickoff). | You need a quick answer, one deliverable, or a narrow fix. |
| The product or epic benefits from PM + Eng + QA (and optionally UX/Ops) in parallel. | One role owns the outcome (e.g. "draft the PRD" or "add tests"). |
| You're starting a new initiative and want a full-team-style pass without multiple back-and-forths. | You're iterating on one area (e.g. "refine the test plan") or debugging. |
| You explicitly say "triad", "swarm", "squad", or "run a product-owner pass". | You ask a focused question or a single-step task. |

**Cost/latency:** Swarm can mean more tokens and a longer run (multiple roles or subagents). Use it when the breadth is worth it; use single pass for speed and simplicity.

---

## Example instruction
“Run a triad on Beast-Mode: define the PRD, create 3 issues, and propose a 2‑milestone roadmap.”
