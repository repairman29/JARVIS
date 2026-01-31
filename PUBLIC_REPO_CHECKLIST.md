# Public Repo Checklist — JARVIS ROG Ed.

Use this checklist when creating and publishing the **Ally JARVIS ROG Ed.** public repository.

---

## Before you create the repo

### 1. Sanitize user-specific content

- [ ] **Paths:** No hardcoded `c:\Users\jeffa\...` or other usernames. Use placeholders like “the JARVIS repo folder” or `%USERPROFILE%` where appropriate.
- [ ] **Docs:** `scripts/DISCORD_ROG_ED.md` and `scripts/SKILLS_ROG_ED.md` use generic paths (see below if not done).
- [ ] **Secrets:** No API keys, tokens, or credentials anywhere. `.env` and `.clawdbot/` are in `.gitignore`.

### 2. Documentation

- [ ] **README:** Use [README_ROG_ED.md](README_ROG_ED.md) as the main **README.md** for the new repo (copy or rename).
- [ ] **Index:** [DOCUMENTATION.md](DOCUMENTATION.md) indexes all docs; update repo URL in DOCUMENTATION.md if needed.
- [ ] **License:** [LICENSE](LICENSE) is present and correct (MIT).

### 3. Environment

- [ ] **.env.example** exists and lists only non-secret placeholders (gateway token, Groq key, optional Discord, etc.). No real values.

### 4. .gitignore

- [ ] `.env`, `.env.*`, `.clawdbot/`, `node_modules/`, logs, and other sensitive or generated paths are ignored.
- [ ] No personal or business-only paths committed (e.g. `private_strategy/`, `EBAY_*.md` if you don’t want them public).

---

## What to include in the public repo

### Include

- **Root:** README (ROG Ed.), LICENSE, CONTRIBUTING.md, .env.example, .gitignore, DOCUMENTATION.md, PUBLIC_REPO_CHECKLIST.md (optional).
- **ROG Ed. docs:** JARVIS_ROG_ED.md, ROG_ALLY_SETUP.md, JARVIS_WINDOWS_EPIC.md, JARVIS_ROG_ED_EXPERIENCE.md, JARVIS_ROADMAP.md, JARVIS_BADASSERY.md.
- **Scripts:** scripts/start-jarvis-ally.bat, scripts/start-jarvis-ally-background.bat, scripts/add-jarvis-to-startup.ps1, scripts/add-discord-alias.js, scripts/create-jarvis-shortcut.ps1, scripts/DISCORD_ROG_ED.md, scripts/SKILLS_ROG_ED.md.
- **Workspace:** jarvis/ (IDENTITY.md, SOUL.md, AGENTS.md, TOOLS.md, USER.md, HEARTBEAT.md, README.md, jarvis/skills/).
- **Skills:** skills/ (launcher, calculator, file-search, clipboard-history, snippets, quick-notes, performance-monitor, skill-marketplace, window-manager, workflow-automation, voice-control; include kroger only if you want it public).
- **Other docs:** DISCORD_SETUP.md, DEVELOPER_GUIDE.md, RUNBOOK.md (if not internal-only).

### Optional (decide per repo)

- **upshiftai/, services/, showcase.html, index.html, docs/site/** — Include only if you want the public repo to contain the full JARVIS site/ecosystem.
- **Kroger skill** — Keep if you want public grocery integration; otherwise remove or document as optional/private.

### Exclude (do not publish)

- Any `.env` or real secrets.
- `%USERPROFILE%\.clawdbot\` contents.
- User-specific paths or machine names in docs (sanitize first).
- Internal-only runbooks or private strategy docs.

---

## Creating the new repo

### Option A: New repo from this folder

1. Create a new repository on GitHub (e.g. `jarvis-rog-ed` or `JARVIS-ROG-Ed`).
2. Copy or clone this project into a new directory.
3. Replace **README.md** with the content of **README_ROG_ED.md** (or rename README_ROG_ED.md to README.md).
4. Run through the “Before you create the repo” checks above.
5. `git init`, add, commit, add remote, push.

### Option B: Subtree or filter-branch

If this lives inside a larger JARVIS repo, you can create a new repo with only ROG Ed.–relevant paths using `git subtree split` or `git filter-repo` (advanced). Prefer Option A if the ROG Ed. tree is already self-contained.

---

## After publish

- [ ] Set repo description and topics (e.g. `jarvis`, `rog-ally`, `windows`, `clawdbot`, `ai-assistant`).
- [ ] Add a link to the main JARVIS project in README or “About” if applicable.
- [ ] Pin **ROG_ALLY_SETUP.md** or **JARVIS_ROG_ED.md** in the repo description or README for first-time users.
- [ ] Optionally add a **Discord** or **Discussions** link for community.

---

## Quick path fixes (if not already done)

- **scripts/DISCORD_ROG_ED.md:** Replace `c:\Users\jeffa\JARVIS\JARVIS` with “the JARVIS repo folder” or “from the repo root:”.
- **scripts/SKILLS_ROG_ED.md:** Replace absolute Windows paths in the `extraDirs` example with `<path-to-repo>\jarvis\skills` and `<path-to-repo>\skills` or similar placeholders.

---

*Use this checklist once per release; update it as the project evolves.*
