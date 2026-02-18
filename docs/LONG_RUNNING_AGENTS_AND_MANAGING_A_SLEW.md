# Long-Running Agents and JARVIS Managing a Slew of Them

**Goal:** Clarify what exists today (long-running JARVIS, subagents, orchestration) and what it would take for JARVIS to **manage a slew** of long-running agents (start, monitor, assign, report).

---

## 1. What you have today

### Long-running JARVIS (one agent, always on)

| Piece | What it does |
|-------|----------------|
| **Gateway** | Long-lived process (LaunchAgent or manual). Listens for chat, API, Discord. Uses the farm (or any LLM) for completions and runs tools. |
| **Autonomous heartbeat** | `jarvis-autonomous-heartbeat.js` — cron (or on-demand) sends one “heartbeat” prompt; JARVIS uses farm + tools and reports HEARTBEAT_OK / HEARTBEAT_REPORT to webhook. |
| **Plan and execute** | `jarvis-autonomous-plan-execute.js` — one run: JARVIS writes a plan, executes it with tools (no human in loop), returns AUTONOMOUS_DONE + summary. Can be scheduled (e.g. daily). |

So you already have **one** long-running “agent” (the gateway + farm) that can do scheduled work (heartbeat, plan-execute). See **docs/JARVIS_AUTONOMOUS_AGENT.md**.

### Subagents (one at a time per tool call)

| Mechanism | What it does |
|-----------|----------------|
| **sessions_spawn** | **Tool** JARVIS can call: “Spawn a background subagent with task + deliverables + ETA.” The subagent runs (e.g. on Ollama or farm); when it finishes, the result is **announced back to the same chat** (Discord, web, CLI). Used for long implementation runs so the main chat doesn’t block. |

So today: **one subagent per `sessions_spawn` call**; result comes back to the same conversation. There is no built-in “list of 10 running subagents” or “agent pool” that JARVIS queries.

### External agents (invoke, then done)

| Mechanism | What it does |
|-----------|----------------|
| **exec** | JARVIS runs a CLI on the gateway machine (e.g. `beast-mode quality score`, `code-roach health`, `echeo --path ...`). Synchronous: JARVIS waits for the command to finish, then continues. |
| **workflow_dispatch** | JARVIS triggers a GitHub Actions workflow in a repo (deploy, quality, BEAST MODE, Code Roach). Fire-and-forget or “trigger and poll for result” depending on how you wire it. |

So JARVIS can **invoke** many different “agents” (BEAST MODE, Code Roach, Echeo, your repos’ workflows), but each invocation is either synchronous (exec) or a one-off trigger (workflow_dispatch). There is no first-class **registry** of “these 5 agent processes are running; here’s status.”

### Pipeline (slew in sequence, not concurrent)

| Script | What it does |
|--------|----------------|
| **run-team-pipeline.js** | Runs a fixed **sequence**: safety net → BEAST MODE quality → Code Roach health → Echeo bounties. One after the other; optional webhook at the end. So “a slew” of agent-like steps, but **sequential**, not “N agents running at once.” |

---

## 2. The gap: “JARVIS manage a slew of long-running agents”

**“Long-running agents”** could mean:

- Processes (or sessions) that run for a long time (minutes to hours) and do work (implementation, quality, crawl, etc.).
- They might be **concurrent** (e.g. 5 running at once) or **many over time** (queue of 20 tasks, 3 workers).

**“JARVIS manage a slew”** could mean:

- JARVIS **starts** several such agents (with different tasks or types).
- JARVIS **sees status**: who is running, who is idle, who just finished, who failed.
- JARVIS **assigns work** (e.g. “agent 1 do BEAST MODE on repo A, agent 2 do Code Roach on repo B”) or at least triggers and then **reports** on the slew.

Today:

- You **do** have one long-running “brain” (gateway + farm) and scheduled autonomous runs (heartbeat, plan-execute).
- You **do** have one-at-a-time subagents via `sessions_spawn` and many invocations of external agents via exec / workflow_dispatch.
- You **don’t** have a single **registry or dashboard** of “these N agents are long-running; here’s their status,” nor a built-in **pool** of concurrent workers that JARVIS “manages.”

So: **ability to have JARVIS manage a slew of long-running agents** = partially there (he can trigger and orchestrate many things), but **not** yet “one place to start N agents and see all their status.”

---

## 3. Options to get “JARVIS manage a slew”

### Option A: Multiple concurrent `sessions_spawn` (if supported)

- JARVIS calls `sessions_spawn` several times with different tasks (e.g. “Task A: BEAST MODE on repo X”, “Task B: implement feature Y”, “Task C: Code Roach health on repo Z”).
- Each subagent runs in the background; when each finishes, result comes back to the same chat (or a designated channel).
- **Pros:** Uses existing tool; no new service. **Cons:** No central “list of running agents”; you infer “slew” from multiple spawns and their callback messages. Depends on gateway/clawdbot supporting concurrent spawns and not deduplicating or serializing them.

### Option B: Agent registry + simple process manager

- Add a **small service or JARVIS skill**: “Agent registry” that holds a list of **agent types** (e.g. BEAST_MODE_QUALITY, CODE_ROACH_HEALTH, SESSION_SPAWN_IMPL) and **running instances** (id, type, started_at, status: running/finished/failed, result_url or summary).
- When JARVIS (or a script) starts a long-running agent (e.g. exec `beast-mode quality score` in background, or spawn a subagent), it **registers** it in this service. When it finishes (or fails), something (script, webhook, or the agent itself) **updates** the registry.
- JARVIS gets a tool: e.g. `agent_registry_list` / `agent_registry_status` to **see the slew** (who’s running, who’s done). Optionally `agent_registry_start(type, params)` to start one and register it.
- **Pros:** One place to “manage” and “see” the slew; JARVIS can reason over it. **Cons:** Requires implementing the registry (e.g. JSON file, SQLite, or Supabase table) and wiring exec/spawn/workflows to update it.

### Option C: Queue + worker pool

- A **queue** (e.g. Redis, Supabase table, or file-based) holds **tasks** (e.g. “run BEAST MODE on repo X”, “run Code Roach health on repo Y”).
- A **pool of workers** (e.g. 3–5 processes or cron jobs) pulls tasks from the queue, runs them (exec or spawn), and pushes **result + status** back.
- JARVIS (or a script) **enqueues** work (“add 10 tasks”); JARVIS (or a dashboard) **queries** queue + worker status to “manage the slew.”
- **Pros:** Clear model for “many tasks, N workers,” scales to real slew. **Cons:** More moving parts (queue, workers, possibly a small API for status).

### Option D: Lightweight “pipeline status” (extend what you have)

- **run-team-pipeline.js** (and similar scripts) already run a **slew in sequence**. Add a simple **status artifact**: e.g. a file or Supabase row that each step updates (step name, started_at, finished_at, success/fail, one-line summary).
- JARVIS (or a tiny dashboard) **reads** that artifact to see “last run of the slew: step 1 ok, step 2 ok, step 3 failed.” Optionally, JARVIS can **start** the pipeline via exec and then **report** from that artifact.
- **Pros:** Minimal change; reuses existing “slew in sequence.” **Cons:** Not concurrent agents; it’s “one pipeline run” at a time, with a clear status.

---

## 4. Recommendation (short term vs. longer term)

- **Short term:**  
  - Use **existing** long-running JARVIS (gateway + farm + autonomous heartbeat / plan-execute) and **run-team-pipeline.js** for a “slew” of agent-like steps in sequence; add a **pipeline status file** (or one table) so JARVIS can “see” and report on the last run (Option D).  
  - If the gateway allows it, **experiment with multiple `sessions_spawn`** calls to get several subagents in flight and have JARVIS “manage” them via the resulting messages (Option A).

- **Longer term:**  
  - If you want “JARVIS manages a slew” in the sense of **concurrent agents + status**, add an **agent registry** (Option B) or a **queue + worker pool** (Option C) and expose status (and optionally start) via a JARVIS tool or a small API.

---

## 5. Summary

| Question | Answer |
|----------|--------|
| Do we have **long-running agents**? | Yes: (1) JARVIS gateway + farm as one long-running agent, (2) autonomous heartbeat and plan-execute on a schedule, (3) one-at-a-time subagents via `sessions_spawn`, (4) external agents invoked via exec / workflow_dispatch. |
| Can JARVIS **manage a slew** of them today? | He can **trigger** many agents (exec, workflow_dispatch, pipeline script) and **orchestrate** who does what (see JARVIS_AGENT_ORCHESTRATION.md). He does **not** yet have a single place to **list and monitor** N concurrent long-running agents. |
| How to get “manage a slew”? | Option A: multiple concurrent `sessions_spawn` + infer from chat. Option B: agent registry + status tool. Option C: queue + worker pool. Option D: pipeline status artifact for the existing sequential slew. |

This doc can live next to **JARVIS_AGENT_ORCHESTRATION.md** and **JARVIS_TEAM_DEPLOY_AND_RUN.md** as the “long-running agents and managing a slew” reference.
