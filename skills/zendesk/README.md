# Zendesk

Zendesk Support: tickets (search, get, update, comments), users and groups (list, create, update, roles, membership), and business hours. JARVIS can search tickets, assign and reply, list or create agents and groups, add/remove agents from groups, and change roles.

## Requirements

- **ZENDESK_SUBDOMAIN** — e.g. `company` for company.zendesk.com
- **ZENDESK_EMAIL** — admin/agent email that owns the API token
- **ZENDESK_API_TOKEN** — from Admin Center → APIs → Zendesk API → Token access

Add these to `~/.clawdbot/.env` (or gateway env) and restart the gateway.

## Quick usage

- **"Search Zendesk for open tickets"** → `zendesk_search_tickets({ query: "type:ticket status:open" })`
- **"Get Zendesk ticket 12345"** → `zendesk_get_ticket({ ticket_id: 12345 })`
- **"Reply to ticket 12345: Thanks, we've processed your refund."** → `zendesk_add_comment({ ticket_id: 12345, body: "Thanks, we've processed your refund.", public: true })`
- **"Show the thread for ticket 5"** → `zendesk_list_ticket_comments({ ticket_id: 5 })`
- **"Assign ticket 5 to agent 123"** → `zendesk_update_ticket({ ticket_id: 5, assignee_id: 123 })`
- **"List our agents"** → `zendesk_list_users({ role: "agent" })`
- **"What are our business hours?"** → `zendesk_list_schedules()`
- **"Create agent Jane, jane@company.com"** → `zendesk_create_user({ name: "Jane", email: "jane@company.com", role: "agent" })`
- **"Make user 5 an admin"** → `zendesk_update_user({ user_id: 5, role: "admin" })`
- **"Create group Billing"** → `zendesk_create_group({ name: "Billing" })`
- **"Who is in group 3?"** → `zendesk_list_group_memberships({ group_id: 3 })`
- **"Add user 10 to group 5"** → `zendesk_add_user_to_group({ user_id: 10, group_id: 5 })`
- **"Remove user 10 from group 5"** → `zendesk_remove_user_from_group({ user_id: 10, group_id: 5 })`
- **"What's the reply time / SLA for ticket 5?"** → `zendesk_get_ticket_metrics({ ticket_id: 5 })`
- **"Who's pissed off?", "Any bad CSAT?"** → `zendesk_search_tickets({ query: "type:ticket satisfaction_rating:bad" })` (results include satisfaction_rating and tags)
- **"What's trending?"** → search recent tickets (e.g. created last 7–30 days), summarize subjects/tags
- **"Any anti-patterns?"** → search by tag/keyword + get_ticket_metrics for reopens/resolution time; summarize
- **"List organizations"** → `zendesk_list_organizations()`
- **"Who's in organization 3?"** → `zendesk_list_organization_users({ organization_id: 3 })`
- **"Find user Jane"** → `zendesk_search_users({ query: "Jane" })`
- **"What custom statuses do we have?"** → `zendesk_list_custom_statuses()`
- **"What ticket fields/forms do we have?"**, **"Trends by form field"** → `zendesk_list_ticket_fields()`, `zendesk_list_ticket_forms()`; tickets return custom_fields (id/value)—resolve id via ticket_fields for trends.
- **"What's in the thread?"**, **"Entities/objects in this ticket"** → `zendesk_list_ticket_comments({ ticket_id })`; use full comment body to infer people, products, order IDs, relationships.
- **"What triggers/automations/macros do we have?"** → `zendesk_list_triggers()`, `zendesk_list_automations()`, `zendesk_list_macros()` (optional `active_only: true`). Use `zendesk_get_trigger`, `zendesk_get_automation`, `zendesk_get_macro` with an ID to see conditions and actions. See [ZENDESK_BOTS_AND_WORKFLOWS.md](../../docs/ZENDESK_BOTS_AND_WORKFLOWS.md).

## Rate limits

Zendesk enforces plan-based limits (e.g. 200–700 requests/minute for Support API). **Update Ticket** (add comment) is limited to **100 requests/minute per account** and **30 updates per ticket per 10 minutes per user**. On 429, the skill reports the **Retry-After** value—wait that many seconds before retrying. See [SKILL.md](./SKILL.md) and [Zendesk rate limits](https://developer.zendesk.com/api-reference/introduction/rate-limits).

## Strategy

This skill is Phase 1 of the [Zendesk CXO Sidekick blueprint](../../docs/ZENDESK_CXO_SIDEKICK_BLUEPRINT.md). Future phases: webhooks, incremental exports, SLA/CSAT metrics, multi-agent orchestration.

See [SKILL.md](./SKILL.md) for full tool reference and query syntax.
