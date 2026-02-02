# Premium clarity — modes, skills, and how to get more

**One place for:** what Blue / Yellow / Hot Rod are, how to get Yellow or Hot Rod, and where premium skills live.

---

## Modes (Blue → Yellow → Hot Rod)

| Mode | Cost | Primary | When to use |
|------|------|---------|-------------|
| **Blue** | $0 | Groq 8B (free) | Default. Groq 70B → OpenRouter → Together fallbacks. |
| **Yellow** | Free tier, then paid | Same as Blue | Add OpenAI/Anthropic as fallbacks when others are rate-limited. |
| **Hot Rod** | Pay-per-use | Claude, GPT-4o, etc. | Best model first; free fallbacks only when paid fails. |

**How to get Yellow or Hot Rod:** Add the right API keys to `.env` or Supabase Vault, then set primary/fallbacks in `clawdbot.json`. Same repo — no separate “premium” build.

- **Full steps:** [GETTING_STARTED_MODES.md](../GETTING_STARTED_MODES.md)
- **Secrets:** Prefer Vault; see [VAULT_MIGRATION.md](./VAULT_MIGRATION.md). Start gateway with `node scripts/start-gateway-with-vault.js`.

---

## Premium skills (showcase)

Premium or “hero” skills (e.g. Notion, GitHub++, Focus Pro, Office/email/calendar) are documented and surfaced on the **showcase** site and in product docs. This repo ships the core gateway and skills; the showcase lists which skills are premium and how they’re packaged.

- **Showcase:** [repairman29.github.io/JARVIS](https://repairman29.github.io/JARVIS)
- **Product plan (tracks):** [JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) §2 – Showcase / premium
- **Windows/Office:** [JARVIS_OFFICE_EMAIL_CALENDAR.md](./JARVIS_OFFICE_EMAIL_CALENDAR.md) (when present)

Pricing or packaging for premium skills (if any) is defined by the showcase or marketplace, not in this repo.

---

## Summary

| Goal | Doc / place |
|------|-------------|
| Run free (Blue) | [GETTING_STARTED_MODES.md](../GETTING_STARTED_MODES.md), [scripts/FREE_TIER_FALLBACKS.md](../scripts/FREE_TIER_FALLBACKS.md) |
| Add premium fallbacks (Yellow) or paid primary (Hot Rod) | [GETTING_STARTED_MODES.md](../GETTING_STARTED_MODES.md) — add keys + config |
| See premium skills and packaging | Showcase site + [JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) |
