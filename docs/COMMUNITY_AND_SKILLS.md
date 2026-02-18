# Community & skills — marketplace, contributors, hero skills

**One place for:** how to contribute skills, where the skill marketplace lives, and hero/premium skills (Notion, Focus Pro, etc.). Part of the product plan theme **Community & skills** (§5).

---

## Contributing skills

- **How to contribute:** [CONTRIBUTING.md](../CONTRIBUTING.md) — skill structure, `skill.json`, natural language design, PR workflow.
- **Skill structure:** `skills/<name>/` with `skill.json`, `index.js`, `SKILL.md`, `README.md`. See CONTRIBUTING § "Creating a New Skill."
- **Repo tools:** [jarvis/TOOLS.md](../jarvis/TOOLS.md) — scripts and when to use them; [REPO_INDEX.md](./REPO_INDEX.md) — where skills live.

### First skill checklist

1. **Pick a skill name** (e.g. `my-skill`) and create `skills/my-skill/`.
2. **Add `skill.json`** — name, version, description, `env` (API keys if needed), `tools` (name, description, parameters). See CONTRIBUTING § "skill.json Template."
3. **Add `index.js`** — export `{ tools }`; each tool is an async function. Return `{ success, message, data? }`. See CONTRIBUTING § "index.js Implementation."
4. **Add `SKILL.md`** — setup, "when to use," tool table with examples, natural language examples. See CONTRIBUTING § "SKILL.md must include."
5. **Add `README.md`** — brief overview, installation, quick usage.
6. **Test** — `node -e "const s = require('./skills/my-skill'); console.log(s.tools)"`; run gateway and try from chat.
7. **PR** — branch, commit, open PR with description. See CONTRIBUTING § "Development Workflow."

---

## Skill marketplace

The **showcase** site and any future marketplace list skills (free and premium). This repo ships the core gateway and skills; the showcase/marketplace defines how skills are listed, packaged, and (if applicable) priced.

- **Showcase:** [repairman29.github.io/JARVIS](https://repairman29.github.io/JARVIS)
- **Premium clarity:** [PREMIUM_CLARITY.md](./PREMIUM_CLARITY.md) — modes, premium skills, Yellow/Hot Rod

Pricing or packaging for premium skills (if any) is defined by the showcase or marketplace, not in this repo.

---

## Hero / premium skills

**Hero skills** are high-impact, often premium skills (e.g. Notion, GitHub++, Focus Pro, Office/email/calendar). They are documented in product and showcase docs; implementation may live in this repo or in separate repos.

| Area | Doc / place |
|------|-------------|
| **Product plan (showcase track)** | [JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) §2 — Showcase / premium |
| **Office / email / calendar** | [JARVIS_OFFICE_EMAIL_CALENDAR.md](./JARVIS_OFFICE_EMAIL_CALENDAR.md) (when present) |
| **Modes & premium** | [PREMIUM_CLARITY.md](./PREMIUM_CLARITY.md) |

Adding or improving a hero skill: follow CONTRIBUTING (skill structure, docs, PR); coordinate with the product plan and showcase if it’s a premium or featured skill.

**Hero skill stubs (planned):** Notion, Focus Pro, GitHub++ — see showcase; Office/email/calendar — [JARVIS_OFFICE_EMAIL_CALENDAR.md](./JARVIS_OFFICE_EMAIL_CALENDAR.md). Implementation in `skills/` or separate repos; document when added.

---

## Summary

| Goal | Doc / place |
|------|-------------|
| **Create or improve a skill** | [CONTRIBUTING.md](../CONTRIBUTING.md), [jarvis/TOOLS.md](../jarvis/TOOLS.md) |
| **See where skills live** | [REPO_INDEX.md](./REPO_INDEX.md) § Skills |
| **Skill marketplace / listing** | Showcase site + product plan |
| **Hero / premium skills** | [JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) §2, [PREMIUM_CLARITY.md](./PREMIUM_CLARITY.md) |

**Done:** Hero skills **skills/focus-pro/** (timer + macOS `say` when session ends) and **skills/notion/** (stub: notion_search; add NOTION_API_KEY and implement). CONTRIBUTING § "Hero skill checklist" documents stub-first and product alignment.

---

## What others are doing (Clawdbot ecosystem)

The broader Clawdbot / OpenClaw community (e.g. [ClawdBotAI](https://clawdbotai.co/skills), [getclawdbot.org](https://getclawdbot.org/docs/api)) uses **50+ to 565+ skills** in similar categories. This helps decide which skills to add or improve next.

| Category | Popular in ecosystem | In this repo |
|----------|----------------------|--------------|
| **Productivity** | Gmail, Google Calendar, Notion, Obsidian | Notion ✅, google-workspace, microsoft-365, quick-notes, reminders |
| **Developer** | GitHub, Sentry, Shell, Docker | github ✅, pr, pull-request, repo-knowledge; no Docker/Sentry |
| **Information** | Web search, Wikipedia, Weather, News | web-search ✅, wikipedia ✅, weather ✅, news ✅ |
| **Media / fun** | Spotify, YouTube, Twitter/X | video-creation, voice-control |
| **Smart home** | Philips Hue, Home Assistant, Apple HomeKit | — |
| **Browser** | Browse, fill forms, screenshots | — (MCP/browser is separate) |

**High-value, low-friction adds** (no or simple API keys, commonly requested):

- **Wikipedia** — definitions and summaries; MediaWiki API, no key. ✅ **skills/wikipedia/**.
- **Weather** — Open-Meteo (free, no key). ✅ **skills/weather/**.
- **News** — RSS headlines (BBC, NPR, Reuters). ✅ **skills/news/**.

**References:** [ClawdBot Skills Library](https://clawdbotai.co/skills), [OpenClaw skills docs](https://docs.clawd.bot/tools/skills), [CONTRIBUTING.md](../CONTRIBUTING.md).
