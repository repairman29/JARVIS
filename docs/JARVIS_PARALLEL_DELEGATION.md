# JARVIS: Exploit, Delegate, and Command Many Agents in Parallel

**Goal:** JARVIS understands how to **exploit** the right agent per task, **delegate** work to multiple agents at once when tasks are independent, and **command many agents in parallel** so outcomes are faster and better.

---

## 1. Exploit — use the right agent for the job

Map **task type** to **agent/system**. Don't do everything yourself; hand off to the specialist.

| Task type | Agent / system | How JARVIS invokes |
|-----------|----------------|---------------------|
| **Quality** (score, janitor, vibe, architecture) | BEAST MODE | `exec`: `beast-mode quality score`, `beast-mode janitor enable`, etc. Or **workflow_dispatch** on BEAST-MODE repo. |
| **PR review, codebase health, crawl** | Code Roach | `exec`: `code-roach analyze pr`, `code-roach health`, `code-roach crawl`. Or **workflow_dispatch** on code-roach repo. |
| **Bounties, "what should I work on?"** | Echeo | `exec`: `echeo --path ...`, `echeo --scrape-github ...`, `echeo --match-needs ...`. |
| **Long implementation run** | Subagent | **sessions_spawn** with task + deliverables + ETA. |
| **Deploy / build in a repo** | CI / platform | **github_workflow_dispatch** for that repo; or platform CLIs (Vercel, Railway, etc.). |
| **Multiple repos or products** | Per-repo agents | One **workflow_dispatch** or **exec** per repo/product when independent. |

When the user asks for something that spans several of these (e.g. "quality on olive and health check on BEAST-MODE"), **delegate each to the right agent** and, when they don't depend on each other, **run them in parallel** (see below).

---

## 2. Delegate in parallel — fire multiple agents when tasks are independent

When **two or more tasks are independent** (no shared state, order doesn't matter), JARVIS should delegate them **at the same time** instead of one after the other.

### How to do it

1. **Parallel tool calls (one turn)**  
   When the **model** supports multiple tool calls in one response, request **several tools in one turn** (e.g. `clock` + `web_search` + `repo_summary(olive)` + `github_workflow_dispatch(beast-mode, quality)`). The gateway runs them in parallel and returns all results. See **docs/JARVIS_PARALLEL_TOOL_CALLS.md**.

2. **Multiple sessions_spawn**  
   JARVIS can call **sessions_spawn** more than once in a turn (or in quick succession) with **different tasks**. Each spawn runs a separate subagent; results come back to the same chat as they complete. Use when you have several **independent long-running** tasks (e.g. "draft PRD for olive" + "run quality on BEAST-MODE" as two spawns).

3. **Multiple workflow_dispatch or exec**  
   Trigger **workflow_dispatch** for several repos in one turn (if the model returns multiple tool_calls), or run several **exec** calls in one turn. Example: quality workflow on repo A and health workflow on repo B in the **same** response.

### Rule of thumb

- **Independent tasks** → delegate in parallel (multiple tool_calls, multiple spawns, or multiple workflows in one go).
- **Tasks that depend on each other** → run in sequence (e.g. implement then quality then deploy).

---

## 3. Command many agents — you are the conductor

JARVIS **commands** the team. He is allowed and encouraged to:

- **Spawn more than one subagent at a time** when the work items are independent (e.g. one spawn for "PRD for product A", another for "test plan for product B").
- **Trigger multiple workflows or execs in one turn** when the model returns multiple tool_calls (e.g. BEAST MODE quality on one repo and Code Roach health on another).
- **Use parallel tool calls** whenever the model supports it — e.g. `clock` + `repo_summary(X)` + `github_workflow_dispatch(Y)` in a single response so the gateway runs them in parallel.
- **Gather results** when agents complete: summarize what each agent did and what the next action is. If you spawned N subagents, you'll get N result messages; synthesize them into one checkpoint for the user.

There is **no** requirement to do one agent at a time. Prefer **parallel delegation** when tasks are independent so the user gets outcomes faster.

---

## 4. When-to-invoke (reminder)

Use the right agent for the right situation (from **JARVIS_AGENT_ORCHESTRATION.md**):

| Situation | Invoke |
|-----------|--------|
| Before ship (after implement) | BEAST MODE quality. |
| When a PR exists or after implement | Code Roach (analyze pr, health). |
| "What should I work on?" / bounties | Echeo. |
| Long implementation run | sessions_spawn. |
| Deploy / build in repo | workflow_dispatch or platform CLIs. |

When **several** of these apply and are independent, invoke **several agents in parallel**.

---

## 5. Example flows

**"Run quality on olive and health check on BEAST-MODE"**  
→ Two independent tasks. In one turn, call (if the model supports multiple tool_calls):  
- `github_workflow_dispatch` (or exec) for BEAST MODE quality on olive’s repo / context, and  
- `github_workflow_dispatch` (or exec) for Code Roach health on BEAST-MODE repo.  
Then summarize both results.

**"Draft a PRD for olive and a test plan for BEAST-MODE"**  
→ Two independent long-form tasks. Spawn **two subagents**:  
- `sessions_spawn` with task "Draft PRD for olive (from products.json and repo_summary); deliverables: PRD outline and success metrics."  
- `sessions_spawn` with task "Draft test plan for BEAST-MODE (from products.json and repo_summary); deliverables: acceptance criteria and test plan."  
Tell the user: "I've started two background passes; you'll get the PRD and test plan here when they finish." When both results are back, summarize.

**"What's the time, what did we decide about X, and run quality on main?"**  
→ Three independent tasks. In one turn, call **clock**, **repo_search** (or DECISIONS.md) for "X", and **workflow_dispatch** (or exec) for quality. Then answer in one reply using all three results.

---

## 6. References

- **Who does what:** [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md) — build flow, agent systems, when-to-invoke.
- **Parallel tool calls:** [JARVIS_PARALLEL_TOOL_CALLS.md](./JARVIS_PARALLEL_TOOL_CALLS.md) — multiple tool_calls in one turn.
- **Team deploy and run:** [JARVIS_TEAM_DEPLOY_AND_RUN.md](./JARVIS_TEAM_DEPLOY_AND_RUN.md) — how JARVIS runs BEAST MODE, Code Roach, Echeo.
- **Managing many agents:** [LONG_RUNNING_AGENTS_AND_MANAGING_A_SLEW.md](./LONG_RUNNING_AGENTS_AND_MANAGING_A_SLEW.md) — current limits and options (multiple spawns, registry, etc.).
- **Agent instructions:** [jarvis/AGENTS.md](../jarvis/AGENTS.md) — orchestration, triad/swarm, sessions_spawn.

---

## 7. Testing parallel delegation

Use these prompts to verify JARVIS exploits the right agents and delegates in parallel when tasks are independent.

**Prerequisites:** JARVIS gateway (and optional Pixel stack) running so chat works. From Mac: `./scripts/jarvis-chat "…"` or `./scripts/jarvis-test-parallel-delegation.sh` (see below). Pixel: ensure stack is up and `.pixel-ip` or `JARVIS_PIXEL_IP` is set.

### Test 1 — Parallel tool calls (lightweight)

**Prompt:**  
*"What's the current time and give me a one-sentence repo_summary of the JARVIS repo? Do both in one go."*

**Success looks like:**  
One reply that includes (1) the current time and (2) a short summary of JARVIS. If the model and gateway support parallel tool calls, JARVIS may have requested `clock` and `repo_summary` in a single turn.

**Run:**  
`./scripts/jarvis-chat "What's the current time and give me a one-sentence repo_summary of the JARVIS repo? Do both in one go."`

---

### Test 2 — Two independent tasks (explicit parallel ask)

**Prompt:**  
*"Do these in parallel: (1) tell me the current time, (2) list the last 2 or 3 entries from this repo's DECISIONS.md if it exists."*

**Success looks like:**  
One reply that answers both: time and 2–3 decision entries (or “no DECISIONS.md” if missing). Indicates JARVIS treated them as independent and used multiple tools in one turn or back-to-back.

**Run:**  
`./scripts/jarvis-chat "Do these in parallel: (1) tell me the current time, (2) list the last 2 or 3 entries from this repo's DECISIONS.md if it exists."`

---

### Test 3 — Multiple subagents (spawn two)

**Prompt:**  
*"Spawn two background tasks: one to draft a one-paragraph PRD for olive, one to draft a one-paragraph test plan for BEAST-MODE. Tell me when you've started both."*

**Success looks like:**  
JARVIS says he has started or spawned two subagents (or two tasks) and that you’ll get results when they finish. Later, two result messages (or one summary) with the PRD snippet and test plan snippet.

**Run:**  
`./scripts/jarvis-chat "Spawn two background tasks: one to draft a one-paragraph PRD for olive, one to draft a one-paragraph test plan for BEAST-MODE. Tell me when you've started both."`

**Note:** Requires `sessions_spawn` and gateway support for multiple spawns. If JARVIS only spawns one or says he can’t spawn two, the model or gateway may still be serializing; the instruction set is in place for when they support it.

---

### Test 4 — Right agent per task (quality + health)

**Prompt:**  
*"Run quality on the BEAST-MODE repo and a health check on the JARVIS repo. Do both in parallel if you can."*

**Success looks like:**  
JARVIS invokes BEAST MODE (or its workflow) for quality and Code Roach (or its workflow) for health, and reports both outcomes. If he runs them in one turn (e.g. two workflow_dispatch or two exec calls), that’s parallel delegation.

**Run:**  
`./scripts/jarvis-chat "Run quality on the BEAST-MODE repo and a health check on the JARVIS repo. Do both in parallel if you can."`

**Note:** Requires BEAST MODE and Code Roach CLIs or workflows to be available where the gateway runs.

---

### Scripted test (one-shot)

From the JARVIS repo root:

```bash
./scripts/jarvis-test-parallel-delegation.sh
```

This sends **Test 1** by default and prints the reply plus what to look for. Optional: pass a test number or a custom prompt:

```bash
./scripts/jarvis-test-parallel-delegation.sh 2
./scripts/jarvis-test-parallel-delegation.sh "Your custom prompt here"
```
