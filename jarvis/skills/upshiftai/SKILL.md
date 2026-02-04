# UpshiftAI — Dependency lineage skill

When the user asks to **analyze dependencies**, **check for ancient/legacy packages**, **audit the dependency tree**, or **find outdated or deprecated packages**, use this skill.

## What it does

- Runs UpshiftAI dependency analysis (npm and/or pip) on a project path.
- Surfaces ancient, deprecated, and fork-hint packages.
- Returns a short summary and, if asked, the full report or markdown.

## How to run

From the user's machine, analysis is run via the UpshiftAI CLI. The skill does not execute code; it tells the user the exact commands and how to interpret results.

**If the user has JARVIS repo (or upshift project) locally:**

```bash
# Auto-detect (npm / pip / go)
node /path/to/JARVIS/upshiftai/bin/upshiftai-deps.js analyze /path/to/project [--markdown] [--csv] [--no-registry] [--ecosystem=npm|pip|go]

# Or use the upshift repo if cloned separately
cd /path/to/upshift && node bin/upshiftai-deps.js analyze /path/to/project
```

**If they use npx (once published):**

```bash
npx upshiftai-deps analyze /path/to/project [--markdown] [--no-registry]
```

- `--no-registry`: faster, no network; age/deprecated from registries are omitted (tree and fork hints still work).
- `--markdown`: append a markdown report to the JSON.

## What to tell the user

1. **Summary:** "Your project has X packages; Y are ancient or deprecated; Z have fork-style names."
2. **Worst first:** List the top 5–10 problematic packages (name, version, reason: deprecated / no publish in N months / fork hint).
3. **Suggestions:** If a package has a known replacement (e.g. request → axios, moment → date-fns), mention it. The report can include replacement hints when using CSV or the programmatic API.
4. **Next step:** "Run the command above with --markdown for a full report" or "Use --csv to get a spreadsheet with replacement suggestions."

### Example summary you might say

> "I ran the dependency analyzer on your project. **Summary:** 312 packages total; 4 are ancient or deprecated; 1 has a fork-style name. **Worst:** `request@2.88.2` (deprecated — consider axios or node-fetch), `lodash@4.17.19` (last publish 24+ months ago). Use `--markdown` for the full table or `--csv` for a spreadsheet with replacement suggestions."

## Ecosystems

- **npm:** Looks for `package-lock.json`; reports depth and "why" for each package.
- **pip:** Looks for `requirements.txt` (or `requirements/base.txt`, etc.); reports direct deps (depth 0).
- **go:** Looks for `go.mod`; reports direct and indirect modules (no registry age; fork hints apply). Use `--ecosystem=go` to force.

CLI auto-detects; use `--ecosystem=npm|pip|go` to force. Add `--csv` for CSV output (includes replacement suggestions).

## When to use

- "Are my dependencies up to date?"
- "Find deprecated or old packages"
- "Audit my dependency tree"
- "What's pulling in [package]?"
- "Check for ancient or forked dependencies"

Do **not** run arbitrary shell commands on the user's behalf unless they explicitly ask you to execute the analyzer; prefer giving them the command and summarizing how to read the output.
