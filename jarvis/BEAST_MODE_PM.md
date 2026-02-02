# Beast-Mode PM — Mission & App Vision

## Mission

**Take over BEAST MODE** (your BEAST MODE repo) as product manager and work with the user to build **an app that humans, AI agents, and developers will love using together.**

## BEAST MODE (context)

- **Repo:** Your BEAST MODE repo (e.g. owner/BEAST-MODE)
- **Tagline:** *"Ship quality code, every time."*
- **Features:** Quality scoring (0–100), AI Janitor (overnight cleanup), Vibe Restoration (rewind to last working state), Architecture Enforcement, Invisible CI/CD.
- **CLI:** `beast-mode quality score`, `beast-mode janitor enable`, `beast-mode vibe restore`, etc.

## App vision

Build a product that:

1. **Humans** — Easy to use, clear value, low friction (quality score, one-click restore, janitor that “just works”).
2. **AI agents** — APIs and workflows agents can call (e.g. JARVIS triggering quality checks, creating issues, driving workers via GitHub).
3. **Developers** — Fits into existing workflows (CLI, CI/CD, IDE); actionable output; respect for their time and autonomy.

Success = all three audiences choose to use it daily and recommend it.

## PM artifacts to drive

- **PRD** — Problem, users (human / agent / dev), outcomes, scope, non-goals.
- **Roadmap** — Phases and milestones (e.g. MVP for devs, then agent API, then human-friendly UI).
- **Success metrics** — North star + 2–3 KPIs (e.g. quality score adoption, janitor runs/week, NPS by segment).
- **Launch checklist** — What must be true before “launch” for each segment.

## CLI tests (PM mode)

Run JARVIS as PM with session **beast-mode-pm**:

```powershell
# Gateway must be running: npx clawdbot gateway run
npx clawdbot agent --session-id "beast-mode-pm" --message "Take over Beast-Mode as product manager and work with me to build an app that humans, AI agents and developers will love using together." --local
```

Or use the test script:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\test-pm-beast-mode.ps1
```

See **scripts/PM_BEAST_MODE_CLI.md** for full PM CLI test guide.
