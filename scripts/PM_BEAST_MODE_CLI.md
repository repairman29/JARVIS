# JARVIS as Product Manager for Beast-Mode — CLI Tests

Run JARVIS in **product manager** mode to take over **BEAST MODE** (your BEAST MODE repo) and work with you to build **an app that humans, AI agents, and developers will love using together.**

## Prerequisites

1. **Gateway running** (from repo root):
   ```powershell
   npx clawdbot gateway run
   ```
2. **GitHub skill** with `GITHUB_TOKEN` in `%USERPROFILE%\.clawdbot\.env` (optional but useful for creating issues/PRs and driving work).
3. **Workspace** includes `jarvis/` (AGENTS.md, BEAST_MODE_PM.md, TOOLS.md) so JARVIS has PM instructions and Beast-Mode context.

## Session: beast-mode-pm

Use **session-id `beast-mode-pm`** so JARVIS follows Beast-Mode PM instructions (see `jarvis/AGENTS.md` → "Beast-Mode PM").

### One-off PM prompt

```powershell
npx clawdbot agent --session-id "beast-mode-pm" --message "Take over Beast-Mode as product manager and work with me to build an app that humans, AI agents and developers will love using together." --local
```

### Full CLI test script (3 prompts)

Runs three PM-style prompts in sequence: mission + first step, PRD outline + milestone, next action.

```powershell
powershell -ExecutionPolicy Bypass -File scripts\test-pm-beast-mode.ps1
```

### Keep context in one conversation

Use the **same** `--session-id "beast-mode-pm"` for follow-up messages so JARVIS keeps context:

```powershell
npx clawdbot agent --session-id "beast-mode-pm" --message "Draft the first milestone as a GitHub issue in owner/BEAST-MODE." --local
npx clawdbot agent --session-id "beast-mode-pm" --message "What's our north star metric and 2 KPIs?" --local
```

## What JARVIS will do (PM mode)

- **Frame** work as problem → user → outcome.
- **Produce** PRD outlines, roadmap, milestones, success metrics, launch checklist.
- **Prioritize** with impact vs effort; state what’s deferred.
- **End** each reply with a **next action** (e.g. create issue, draft doc, suggest command).
- **Use GitHub** when useful: list repos, create issues/PRs, trigger workflows (if you have the GitHub skill and PAT).

## References

| What | Where |
|------|--------|
| PM instructions | `jarvis/AGENTS.md` (Product Manager Mode, Beast-Mode PM) |
| Mission & vision | `jarvis/BEAST_MODE_PM.md` |
| Tools (including GitHub) | `jarvis/TOOLS.md` |
| BEAST MODE repo | Your BEAST MODE repo (e.g. owner/BEAST-MODE) |
