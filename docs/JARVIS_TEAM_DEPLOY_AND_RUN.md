# JARVIS's Team — Deploy and Run His Own AI Agents

**Goal:** JARVIS deploys and runs a **team of AI agents** (BEAST-MODE, Code Roach, Echeo, bot orchestration in your other repos). He's the **conductor**; they do quality, PR review, bounties, and specialized work. This doc is how to make that real.

---

## The team (agent systems JARVIS can use)

| Agent / system | What it does | How JARVIS runs it |
|----------------|--------------|--------------------|
| **BEAST-MODE** | Quality score, AI Janitor, vibe restore, architecture checks, invisible CI | **Exec:** `beast-mode quality score`, `beast-mode janitor enable`, `beast-mode vibe restore`, `beast-mode architecture check`. **Or** `github_workflow_dispatch` on BEAST-MODE repo if it has a quality workflow. |
| **Code Roach** | PR analysis, codebase health, crawl (knowledge base) | **Exec:** `code-roach analyze pr`, `code-roach health`, `code-roach crawl`. **Or** workflow_dispatch on code-roach repo. |
| **Echeo** | Capability scan, bounty matching, GitHub issues as bounties | **Exec:** `echeo --path ...`, `echeo --scrape-github ...`, `echeo --match-needs ...`. |
| **Your other repos** | Bot orchestration, workers, custom agents | **workflow_dispatch** to trigger their GitHub Actions; **exec** if they expose a CLI; **repo-knowledge** to understand what they do. |
| **sessions_spawn** | JARVIS's own subagents (long implementation runs) | **Tool:** JARVIS spawns a background subagent with task + deliverables; result comes back to the same chat. |

Full flow and when-to-invoke: **docs/JARVIS_AGENT_ORCHESTRATION.md**.

---

## How to let JARVIS deploy and run his team

### 1. Register agent repos and products

- **repos.json** — Add every repo that hosts an agent or bot (BEAST-MODE, code-roach, echeo, and any other orchestration repo). JARVIS uses this for indexing and for `github_workflow_dispatch`.
- **products.json** — Add products for each agent system you want JARVIS to "work top down" on. Put **BEAST-MODE** (and others) in the list; use **deepWorkAccess** where JARVIS should do full-cycle work. Order = priority.

BEAST-MODE is already in both (see repo root). Add code-roach, echeo, or other agent repos the same way if they're not there.

### 2. Install CLIs where the gateway runs

JARVIS invokes agents via **exec** when the CLI is on PATH:

- **BEAST-MODE:** Install the beast-mode CLI so `beast-mode quality score`, `beast-mode janitor enable`, etc. run on the same machine as the gateway.
- **Code Roach:** Install so `code-roach analyze pr`, `code-roach health`, `code-roach crawl` work.
- **Echeo:** Install so `echeo --path ...`, `echeo --scrape-github ...` work.

If a CLI isn't installed, JARVIS can still **trigger workflows** in that repo via GitHub (see below).

### 3. GitHub workflows in agent repos

So JARVIS can **deploy and run** agents without needing the CLI on the gateway machine:

- **BEAST-MODE:** Add a GitHub Actions workflow (e.g. `quality.yml`) that runs quality score, janitor, vibe restore. JARVIS calls **github_workflow_dispatch** (owner, repo, workflow_id, ref) to trigger it.
- **Code Roach / Echeo / others:** Same idea — add a workflow that runs the agent (or deploy step). JARVIS triggers it via **workflow_dispatch**.

Then JARVIS "deploys and runs" the team by dispatching the right workflows and summarizing results.

### 4. GitHub token and elevated exec

- **GITHUB_TOKEN** in `~/.clawdbot/.env` or Vault (repo scope) so JARVIS can list repos, create issues/PRs, and **workflow_dispatch**.
- **Elevated exec** allowed for the channel (e.g. Discord) so JARVIS can run `beast-mode`, `code-roach`, `echeo` when you ask. Your Discord ID in the allowlist: `node scripts/enable-gateway-restart.js YOUR_DISCORD_USER_ID` (and gateway.commands.restart = true).

### 5. Index agent repos (optional but powerful)

Run **repo index** so JARVIS can use **repo_summary** and **repo_search** on BEAST-MODE and other agent repos:

```bash
node scripts/index-repos.js
# or per-repo: node scripts/index-repos.js --repo BEAST-MODE --limit 1
```

Then JARVIS can reason over their code and docs when orchestrating.

### 6. Tell JARVIS to use the team

- **"Deep work on BEAST-MODE"** / **"Full product cycle for [product]"** — JARVIS plans, implements, runs **BEAST MODE** (quality) before ship, uses **sessions_spawn** for long runs, **workflow_dispatch** to deploy.
- **"Run the quality pipeline"** / **"Run Beast-Mode on this repo"** — JARVIS runs `beast-mode quality score` (or triggers BEAST-MODE workflow).
- **"What should I work on?"** — JARVIS can use Echeo (bounty matching) and products.json order.
- **"Deploy and run your team"** — JARVIS triggers workflows for each agent repo (quality, health, etc.) and reports back.

Orchestration rules and when-to-invoke table: **docs/JARVIS_AGENT_ORCHESTRATION.md**. Agent instructions: **jarvis/AGENTS.md** (§ Agent orchestration).

---

## One-page checklist

| Step | Action |
|------|--------|
| 1 | Add BEAST-MODE (and other agent repos) to **repos.json** and **products.json** (done for BEAST-MODE). |
| 2 | Install **beast-mode**, **code-roach**, **echeo** CLIs on the machine where the gateway runs (or rely on workflow_dispatch). |
| 3 | Add **GitHub Actions workflows** in BEAST-MODE / code-roach / etc. that run the agent; JARVIS triggers via **workflow_dispatch**. |
| 4 | Set **GITHUB_TOKEN** (Vault or .env); allow **elevated exec** (Discord allowlist) so JARVIS can run CLIs and restart gateway. |
| 5 | Run **index-repos.js** so JARVIS has repo-knowledge for agent repos. |
| 6 | Say **"deep work on BEAST-MODE"** or **"deploy and run your team"** — JARVIS orchestrates and invokes the agents. |

---

## References

- **Orchestration flow:** [JARVIS_AGENT_ORCHESTRATION.md](./JARVIS_AGENT_ORCHESTRATION.md)
- **Deep work / ship access:** [jarvis/DEEP_WORK_PRODUCT.md](../jarvis/DEEP_WORK_PRODUCT.md), [JARVIS_FULL_ACCESS_ONE_PRODUCT.md](./JARVIS_FULL_ACCESS_ONE_PRODUCT.md)
- **Products and repos:** [PRODUCTS.md](../PRODUCTS.md), [JARVIS_AND_YOUR_REPOS.md](./JARVIS_AND_YOUR_REPOS.md)
- **GitHub skill (workflow_dispatch):** [jarvis/TOOLS.md](../jarvis/TOOLS.md) → GitHub
