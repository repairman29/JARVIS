# Zendesk Sidekick: Gaps and Closure

*Tracks gaps identified in [ZENDESK_SIDEKICK_USER_STORIES.md](./ZENDESK_SIDEKICK_USER_STORIES.md) and how they were closed or deferred.*

---

## Closed

| Gap | Closure |
|-----|--------|
| **US-4.3 — Search by organization** | No new tool. `zendesk_search_tickets` supports Zendesk query syntax `organization:ID`. Documented in [skills/zendesk/SKILL.md](../skills/zendesk/SKILL.md) and skill.json so the model uses: get org ID via `zendesk_get_organization` or `zendesk_list_organizations`, then `zendesk_search_tickets({ query: "type:ticket organization:123" })`. |
| **US-6.1 — Proactive SLA alert** | Script **scripts/zendesk-sla-check.js** added. Run on a schedule (e.g. cron). Finds open/pending tickets, fetches metrics, reports tickets with no first reply (older than threshold) or high requester wait time. Exit 1 when any at-risk so cron can alert. |
| **US-6.2 — CSAT on tickets; trending / pissed off / anti-patterns** | **CSAT:** Tickets have `satisfaction_rating` (score good/bad, comment, reason). `zendesk_get_ticket` and `zendesk_search_tickets` now return it; search supports `satisfaction_rating:bad` and `satisfaction_rating:good`. So "What's our CSAT?", "Who's pissed off?" work via search + summarize. **Trending:** Search recent tickets, summarize subjects/tags. **Anti-patterns:** Search by tag/keyword + `zendesk_get_ticket_metrics` (reopens, resolution time); Sidekick summarizes. Full CSAT *trends* over time still need Explore or Survey Response API. |

---

## Deferred / Roadmap

| Gap | Reason |
|-----|--------|
| **US-6.2 — CSAT trends over time** | Per-ticket CSAT is supported (see Closed). Aggregated trends (e.g. % good/bad by week) need Zendesk Explore or Survey Response API / incremental export. |
| **US-6.3 — Rollup reports** | Sidekick can run multiple searches and summarize in conversation. For heavy reporting, Zendesk Explore or incremental exports remain the right approach. Optional: add a small wrapper script for one common rollup (e.g. open-by-group) as an example. |
| **US-6.4 — Escalation notify (Slack/email)** | Sidekick can assign and add internal notes. External notify (Slack, email) is out of scope for the Zendesk skill; use Discord/Resend skills or Zendesk triggers. |

---

## How to run the SLA check

```bash
# From repo root; uses ~/.clawdbot/.env
node scripts/zendesk-sla-check.js

# Optional env overrides (minutes):
# ZENDESK_SLA_NO_REPLY_HOURS=2   — flag tickets with no first reply older than N hours (default 2)
# ZENDESK_SLA_WAIT_THRESHOLD=60  — flag tickets with requester wait time > N minutes (default 60)
# ZENDESK_SLA_MAX_TICKETS=50     — max open/pending tickets to check (default 50)
```

Exit code: 0 = no at-risk tickets; 1 = one or more at-risk (suitable for cron alerting).

---

See also: [ZENDESK_SIDEKICK_USER_STORIES.md](./ZENDESK_SIDEKICK_USER_STORIES.md), [ZENDESK_CXO_SIDEKICK_BLUEPRINT.md](./ZENDESK_CXO_SIDEKICK_BLUEPRINT.md), [skills/zendesk/README.md](../skills/zendesk/README.md).
