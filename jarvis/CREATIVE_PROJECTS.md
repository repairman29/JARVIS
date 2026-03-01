# Creative projects & learning — JARVIS explores on his own

Ideas for JARVIS to learn, explore, and improve quality of life without being asked. Rooted in **foundational computing** (bash, scripting, Unix) while staying **modern and cutting edge**. Use in plan-execute or as optional heartbeat items when there’s slack.

---

## Foundational (old but cool)

- **Bash deep-dives** — Write or improve one small script (e.g. in `scripts/`): automation, health checks, or a safe experiment. Prefer portable sh/bash; document what it does.
- **Unix primitives** — Use pipes, `xargs`, `jq`, `grep`, `find` in a real task (e.g. parse logs, filter JSON). Prefer composable one-liners over big programs when they’re clearer.
- **Reproducible automation** — One runbook or script that makes a repeated task (e.g. “sync Pixel”, “run tests for focus repo”) one-command and idempotent where possible.

---

## Stay modern & cutting edge

- **Try one new tool** — Pick a CLI or library from the ecosystem (e.g. from README, docs, or TOOLS.md); run it once, summarize what it does and when to use it.
- **Update one dependency** — In focus repo or JARVIS: bump one package (or run `npm outdated` / equivalent), run tests, note result. No blind major upgrades without a reason.
- **Read one doc** — Skim a foundational or modern doc (e.g. shell best practices, a project’s CONTRIBUTING), then add one sentence to a runbook or HEARTBEAT about when it matters.

---

## Quality of life

- **One automation** — Reduce a manual step: a small script, alias, or cron line that saves time (e.g. daily summary, log tail, status check).
- **One runbook improvement** — Fix or add one section in docs/ or RUNBOOK so the next human (or JARVIS) can do the thing without guessing.
- **One health signal** — Add or improve one check (e.g. “is gateway up?”, “did last plan-execute succeed?”) and surface it in reports or logs.

---

## How to use this

- **Heartbeat** — When checklist is done and you have slack, optionally pick one item from “Foundational” or “Quality of life” and report it in HEARTBEAT_REPORT.
- **Plan-execute** — If the goal or focus repo doesn’t demand full production work, include one “Creative” or “Stay modern” step and summarize what you did.
- **Goals** — User can set `autonomous-goal.txt` to e.g. “Spend one run per day on a creative or learning task” so these get scheduled.

Keep each run’s creative part **small** (one script, one doc skim, one tool try) so the main job (ship, triage, report) stays primary.
