# Using Echeo and other agents with local inference

How to run JARVIS, Echeo (bounty matching), and other bots/agents so **inference stays local** (Ollama or other local LLM).

**Quick checklist (in practice):** [1] Install Ollama and pull a model → [2] Set gateway primary to Ollama in `clawdbot.json` → [3] Start gateway, verify chat → [4] Enable exec for your channel → [5] Install Echeo CLI on PATH → [6] Ask JARVIS “what should I work on?” or “bounties”. See **§5 In practice** for step-by-step.

**One-command setup and run:** From the repo root, run `node scripts/setup-and-run-local.js`. This checks Ollama, ensures `~/.clawdbot/clawdbot.json` (Ollama primary) and `~/.clawdbot/.env` (gateway token), optionally warns if echeo/beast-mode/code-roach are missing from PATH, then starts the gateway. Use `--setup-only` to only create/update config and print the run command.

**Auto-start when you open Cursor and keep services healthy:** See [JARVIS_AUTO_START_AND_WATCHDOG.md](JARVIS_AUTO_START_AND_WATCHDOG.md) — Cursor “run on folder open” task, login (LaunchAgent / Task Scheduler), and watchdog (check + restart gateway).

---

## What’s already wired (this repo + Ollama)

| What | Where it’s used | Config / env |
|------|------------------|---------------|
| **Gateway model** | Clawdbot: primary + fallbacks (Ollama, Groq, Together) | `~/.clawdbot/clawdbot.json` — see [RUNBOOK.md](../RUNBOOK.md) Model Info |
| **Repo index embeddings** | `scripts/index-repos.js` — chunks → embeddings → Supabase | `OLLAMA_BASE_URL` (default `http://localhost:11434`); model `nomic-embed-text` (run `ollama pull nomic-embed-text` once) |
| **Repo-knowledge skill** | `skills/repo-knowledge/index.js` — embeddings for search | Same: `OLLAMA_BASE_URL` or env |

No `clawdbot.json` is committed; each machine uses its own `~/.clawdbot/` (or `%USERPROFILE%\.clawdbot\` on Windows). So if Ollama is already installed and the gateway is pointed at it, you’re set for local inference for JARVIS and for the indexer/skill above.

---

## Where our tools run (Echeo, BEAST MODE, Code Roach)

We **own** these tools (repos: echeo, BEAST-MODE, code-roach in [repos.json](../repos.json) / [products.json](../products.json)). JARVIS invokes them via **exec** — so they run **on the same machine where the gateway runs**.

| Tool | Command | Where it runs |
|------|---------|----------------|
| **Echeo** | `echeo --path ...`, `echeo --scrape-github ...`, `echeo --match-needs ...` | Same machine as gateway (install CLI on PATH) |
| **BEAST MODE** | `beast-mode quality score`, `beast-mode janitor enable`, etc. | Same machine as gateway (install CLI on PATH) |
| **Code Roach** | `code-roach analyze pr`, `code-roach health`, `code-roach crawl` | Same machine as gateway (install CLI on PATH) |

So: **run them somewhere** = run the gateway on the machine where you want these to execute, then install each CLI there so JARVIS can exec them. Alternative: if a repo has a GitHub Action, JARVIS can trigger it via **workflow_dispatch** (no CLI on that machine needed; the job runs in GitHub).

**Summary:** One machine (your dev box, ROG Ally, or a server) runs: Ollama + gateway + (optional) echeo/beast-mode/code-roach CLIs. JARVIS (Ollama or cloud model) decides when to call which tool; exec runs the CLI on that same machine.

---

## Two layers

| Layer | What runs | Where inference happens |
|-------|-----------|-------------------------|
| **JARVIS (conductor)** | Clawdbot gateway + chat | Your config: Ollama, Groq, Together, etc. |
| **Agents (tools)** | Echeo, BEAST MODE, Code Roach, `sessions_spawn` | Depends on each tool and gateway config |

To use **local inference** end-to-end you need: (1) the **gateway** pointed at Ollama for JARVIS’s chat and decisions, and (2) any **agent that uses an LLM** (Echeo, BEAST MODE, Code Roach, or subagents) also pointed at Ollama where applicable.

---

## 1. JARVIS (gateway) on local inference

JARVIS’s replies and tool-calling decisions come from whatever model the **Clawdbot gateway** uses.

- **Primary model = Ollama:** In `~/.clawdbot/clawdbot.json` set the primary model to an Ollama model (e.g. `ollama/llama3.1` or `ollama/llama3.1:8b`). Start the gateway. All in-chat reasoning and “should I call Echeo?” decisions are then local.
- **Subagents (sessions_spawn):** Background subagents can be configured to use a different model. Set the **subagent model** to an Ollama model so long-running spawns (e.g. “fuller pass,” deep work) also run locally. See [JARVIS_ROG_ED.md — Model split](JARVIS_ROG_ED.md) and [ROG_ALLY_SETUP.md](ROG_ALLY_SETUP.md).

So: **JARVIS + local inference** = gateway primary (and optionally subagent) set to Ollama. No change to Echeo/BEAST/Code Roach yet; they’re just invoked via **exec** when JARVIS decides.

---

## 2. Echeo (bounty hunter) and other agents

**Echeo** is the “resonant engine”: capability scan, bounty matching, GitHub issues as bounties. JARVIS invokes it via **exec** when you ask “what should I work on?” or “bounties” (see [JARVIS_AGENT_ORCHESTRATION.md](JARVIS_AGENT_ORCHESTRATION.md)):

```bash
echeo --path ~/project              # Scan capabilities
echeo --scrape-github owner/repo    # Find bounties
echeo --match-needs bounties.json   # Match skills
```

- **If the Echeo CLI is pure logic (no LLM):** Install it, put it on PATH; JARVIS runs it via exec. Inference is only in JARVIS (gateway), so with gateway → Ollama you’re already local.
- **If the Echeo CLI (or app) uses an LLM internally:** Then Echeo’s repo (e.g. [repairman29/echeo](https://github.com/repairman29/echeo)) must support an **Ollama (or OpenAI-compatible local) backend**. You’d set Echeo’s config or env to use `OLLAMA_BASE_URL` / local API so its own reasoning runs locally. That’s configured **inside the Echeo repo**, not in CLAWDBOT.

Same idea for **BEAST MODE** and **Code Roach**: JARVIS calls them via exec (or workflow_dispatch). If those tools use an LLM, their repos need to support Ollama/local inference and you configure it there.

**Summary:** JARVIS (gateway) + Ollama = local conductor. Echeo/BEAST/Code Roach = run as subprocesses; to make *their* inference local, each tool’s repo must support and be configured for Ollama (or LocalAI, etc.).

---

## 3. sessions_spawn (background subagents)

**sessions_spawn** is a gateway feature: JARVIS spawns a background subagent for long tasks; when it finishes, the result is announced back to the same chat. In this repo’s docs, that subagent runs on **Ollama** when so configured (e.g. `agents.defaults.subagents.model` → `ollama/llama3.1`). So you can already use “bounty hunter”–style workflows (JARVIS decides to run Echeo or a long research task) with local inference by:

1. Setting gateway primary (and subagent model) to Ollama.
2. Installing and using the Echeo CLI (and optionally configuring Echeo for Ollama if it uses an LLM).
3. Letting JARVIS call Echeo via exec and long runs via sessions_spawn.

---

## 4. Practical setup (all local)

1. **Ollama**  
   Install [Ollama](https://ollama.com), then e.g. `ollama pull llama3.1:8b` (and `ollama pull nomic-embed-text` if you use repo indexing).

2. **Gateway → Ollama**  
   In `~/.clawdbot/clawdbot.json` set the primary model to `ollama/llama3.1` (or the model you pulled). Optionally set the subagent model to the same or another Ollama model. Restart the gateway.

3. **Echeo CLI**  
   Install the Echeo CLI so it’s on PATH. JARVIS can then run `echeo --path ...`, `echeo --scrape-github ...`, etc. If Echeo has its own LLM step, configure it in the Echeo repo to use Ollama.

4. **BEAST MODE / Code Roach (optional)**  
   Same pattern: install CLIs; if they use an LLM, set their backends to Ollama in their respective repos.

5. **Repo index (optional)**  
   For repo-knowledge (e.g. “search all repos for X”), the indexer can use Ollama for embeddings: `nomic-embed-text` (see [jarvis/TOOLS.md](../jarvis/TOOLS.md), [RUNBOOK.md](../RUNBOOK.md)).

---

## 5. In practice: step-by-step

Do these in order so JARVIS + Echeo (or other agents) run with local inference and exec works.

### 5.1 Install Ollama and pull a model

```bash
# Install from https://ollama.com, then:
ollama pull llama3.1:8b
# Optional: for repo index embeddings
ollama pull nomic-embed-text
```

On Windows use the same commands in PowerShell (or the Ollama app). See [ROG_ALLY_SETUP.md — Local model](ROG_ALLY_SETUP.md#local-model-quick-test) for VRAM vs model size.

### 5.2 Point the gateway at Ollama

Edit `~/.clawdbot/clawdbot.json` (Windows: `%USERPROFILE%\.clawdbot\clawdbot.json`). Set the primary model to an Ollama model you pulled:

```json
{
  "gateway": { "mode": "local" },
  "agents": {
    "defaults": {
      "model": {
        "primary": "ollama/llama3.1:8b"
      },
      "workspace": "~/jarvis"
    }
  }
}
```

If the gateway reports "Unknown model: ollama/llama3.1:8b", add an explicit Ollama provider and ensure the gateway can reach Ollama (see [Clawdbot Ollama docs](https://docs.clawd.bot/providers/ollama)). Example:

```json
"models": {
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "contextWindow": 16384
    }
  }
}
```

Optional: use Ollama only for **background** subagents and keep chat on a cloud model:

```json
"model": {
  "primary": "groq/llama-3.1-8b-instant",
  "subagents": { "model": "ollama/llama3.1:8b" }
}
```

Put `GROQ_API_KEY` in `~/.clawdbot/.env`. Restart the gateway after any config change.

### 5.3 Start the gateway and verify chat

```bash
# From repo or anywhere with clawdbot on PATH
npx clawdbot gateway run
```

Leave it running. In another terminal:

```bash
npx clawdbot agent --session-id "local" --message "Hello, who are you?" --local
```

If you get a reply, JARVIS is using your configured model (Ollama if primary is set to it). If not: confirm Ollama is running (`ollama list`), the model name in config matches what you pulled, and the gateway restarted.

### 5.4 Enable exec so JARVIS can run Echeo (and other CLIs)

JARVIS invokes Echeo via **exec** (run a CLI on your machine). The gateway must allow exec for your channel.

- **CLI (`--local`):** Exec is usually allowed for local agent calls; no extra config.
- **Discord / web:** In `clawdbot.json`, under `tools.elevated.allowFrom` (or your gateway’s exec-allowlist), add the Discord user ID or channel so that channel can trigger exec. See your Clawdbot/gateway docs for the exact key (e.g. `tools.elevated.allowFrom.discord`).

After exec is allowed, JARVIS can run `echeo --path ...` when you ask “what should I work on?” or “bounties” (per [JARVIS_AGENT_ORCHESTRATION.md](JARVIS_AGENT_ORCHESTRATION.md)).

### 5.5 Install the Echeo CLI (so JARVIS can exec it)

Echeo is a separate repo. Install so the `echeo` command is on PATH:

- **From source:** Clone [repairman29/echeo](https://github.com/repairman29/echeo), then `npm install` and `npm link` (or add the bin to PATH).
- **If published:** `npm install -g echeo` (or your org’s package name).

Verify:

```bash
echeo --help
# or
echeo --path . --help
```

If Echeo uses an LLM internally, set its config or env (e.g. `OLLAMA_BASE_URL`, or its own config file) to point at Ollama so Echeo’s inference is also local.

### 5.6 End-to-end check

1. Gateway running, primary = Ollama (or subagent = Ollama).
2. `echeo` on PATH and working.
3. Exec allowed for your channel (e.g. `--local` or Discord allowlist).

Then ask JARVIS (CLI or Discord):

- *“What should I work on?”* — JARVIS should consider invoking Echeo (e.g. `echeo --path ~/project` or `echeo --scrape-github owner/repo`).
- *“Run echeo on this repo”* — If exec is allowed, JARVIS can run the CLI and summarize the result.

If JARVIS doesn’t call Echeo: confirm AGENTS.md and TOOLS.md (in the workspace JARVIS uses) mention Echeo and “what should I work on?” / bounties, and that the gateway workspace points at that repo (e.g. `~/jarvis` or the CLAWDBOT repo with jarvis/ in it). See [JARVIS_AGENT_ORCHESTRATION.md](JARVIS_AGENT_ORCHESTRATION.md).

### 5.7 Optional: repo index (for repo-knowledge + Echeo context)

For “search all repos” and richer context, index repos and use local embeddings:

```bash
# GITHUB_TOKEN in ~/.clawdbot/.env
node scripts/index-repos.js --repo JARVIS --limit 1
```

Embeddings use Ollama’s `nomic-embed-text` when so configured (see [jarvis/TOOLS.md](../jarvis/TOOLS.md), [RUNBOOK.md](../RUNBOOK.md)).

---

## 6. References

| Topic | Doc |
|-------|-----|
| Gateway model config, Ollama | [RUNBOOK.md](../RUNBOOK.md), [ROG_ALLY_SETUP.md](../ROG_ALLY_SETUP.md) |
| Custom tools table (echeo, beast-mode, code-roach) | [RUNBOOK.md](../RUNBOOK.md) — “Custom Tools” |
| When JARVIS calls Echeo / BEAST / Code Roach | [JARVIS_AGENT_ORCHESTRATION.md](JARVIS_AGENT_ORCHESTRATION.md) |
| Subagents (sessions_spawn) on Ollama | [jarvis/AGENTS.md](../jarvis/AGENTS.md), [JARVIS_ROG_ED.md](../JARVIS_ROG_ED.md) |
| Repo index + embeddings | [jarvis/TOOLS.md](../jarvis/TOOLS.md) (index-repos.js, nomic-embed-text) |
| Exec / elevated tools | [jarvis/TOOLS.md](../jarvis/TOOLS.md) — “Config: Elevated/exec allowlist” |

---

**TL;DR:** Point the Clawdbot gateway at Ollama so JARVIS (and, if configured, sessions_spawn) uses local inference. Echeo and other agents are invoked via exec; to have *them* use local inference, each tool’s repo must support Ollama (or another local API) and you configure it there. The conductor is local; the rest is one config per tool.
