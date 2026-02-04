# Zendesk: Bots, Procedures, and AI Workflows

How Zendesk’s “business rules” and bot/AI features fit together, and what the JARVIS Zendesk skill can do today.

---

## What the Sidekick can manage (read-only)

| Mechanism | What it is | Sidekick tools | Notes |
|-----------|------------|----------------|--------|
| **Triggers** | Rules that run when a ticket is **created or updated** and conditions match (e.g. notify customer when status → Solved). | `zendesk_list_triggers`, `zendesk_get_trigger` | List all or active only; get one by ID to see conditions and actions. |
| **Automations** | Rules whose conditions are **checked on a schedule** (e.g. hourly); e.g. “notify agent when ticket open 24+ hours.” | `zendesk_list_automations`, `zendesk_get_automation` | Same pattern: list/get with full conditions and actions. |
| **Macros** | **Agent-applied** procedures (e.g. “Close and send standard reply”). Not automatic. | `zendesk_list_macros`, `zendesk_get_macro` | List/get; actions show what the macro does when applied. |

All six tools are **read-only**: list and get details. Create/update/delete of triggers, automations, and macros is not implemented in the skill (can be added later via Zendesk Support API if needed).

---

## How they relate

- **Trigger** = event-driven (on ticket create/update).
- **Automation** = time-driven (periodic check).
- **Macro** = human-driven (agent clicks “Apply macro”).

Together these cover most “procedures” and “workflows” that live in Zendesk Support. They do **not** include:

- **Answer Bot / AI agents** — different product surface (Guide, Web Widget, AI add-ons).
- **Object triggers** — trigger on other objects (e.g. user, organization); separate API.
- **Integrations / apps** — built in Admin Center or via apps framework.

---

## AI agents and Answer Bot (out of scope for current skill)

Zendesk’s **AI agents** (including what was Answer Bot) provide:

- Bot conversations in the Web Widget or messaging.
- Article recommendations, deflection, handoff to humans.
- **Advanced AI agents** (add-on): custom flows, integrations, API calls, webhooks.

Those are configured and operated via:

- **Guide** (Help Center) and **Answer Bot / AI** settings in Admin Center.
- **Answer Bot API** (article recommendations, etc.) and **AI Agents** documentation (separate from Support API).

The JARVIS Zendesk skill uses the **Support API** only. It can:

- List and inspect **triggers, automations, and macros** (what runs or what agents can apply).
- **Not** list or configure AI agents, bot flows, or Answer Bot from this skill.

For “what bots/AI workflows do we have?” in Zendesk today, the Sidekick can answer in terms of **triggers, automations, and macros**. For actual AI agent/bot configuration, use Admin Center or the relevant Zendesk product docs/APIs.

---

## Quick reference: when to use which tool

| User asks… | Use |
|------------|-----|
| “What triggers do we have?” / “What runs when we update a ticket?” | `zendesk_list_triggers` (optional `active_only: true`), then `zendesk_get_trigger` for details. |
| “What automations are set up?” / “Any time-based rules?” | `zendesk_list_automations`, `zendesk_get_automation`. |
| “What macros do agents have?” / “List our procedures” | `zendesk_list_macros`, `zendesk_get_macro`. |
| “What does trigger/automation/macro 123 do?” | `zendesk_get_trigger({ trigger_id: 123 })` (or get_automation / get_macro with the right ID). |

---

## See also

- [ZENDESK_CXO_SIDEKICK_BLUEPRINT.md](./ZENDESK_CXO_SIDEKICK_BLUEPRINT.md) — Zendesk skill roadmap.
- [ZENDESK_SIDEKICK_USER_STORIES.md](./ZENDESK_SIDEKICK_USER_STORIES.md) — User stories and tool coverage.
- [skills/zendesk/SKILL.md](../skills/zendesk/SKILL.md) — Full Zendesk tool reference.
- Zendesk developer docs: [Triggers](https://developer.zendesk.com/api-reference/ticketing/business-rules/triggers/), [Automations](https://developer.zendesk.com/api-reference/ticketing/business-rules/automations/), [Macros](https://developer.zendesk.com/api-reference/ticketing/business-rules/macros/).
