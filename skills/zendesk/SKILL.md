# Zendesk — tickets and comments

Use when the user asks about support tickets, Zendesk, or customer requests. **Requires** Zendesk subdomain, email, and API token. Aligns with the [CXO Sidekick blueprint](../../docs/ZENDESK_CXO_SIDEKICK_BLUEPRINT.md) for future orchestration (webhooks, metrics, multi-agent).

---

## Setup

1. In Zendesk **Admin Center** → **Apps and integrations** → **APIs** → **Zendesk API**, enable **Token access** and create an API token.
2. Set in gateway env (e.g. `~/.clawdbot/.env`):
   - **ZENDESK_SUBDOMAIN** — your subdomain only (e.g. `company` for company.zendesk.com).
   - **ZENDESK_EMAIL** — the agent/admin email that owns the token.
   - **ZENDESK_API_TOKEN** — the generated token.
3. Restart the gateway.

---

## When to use

| User says… | Tool | Notes |
|------------|------|--------|
| "Are we connected to Zendesk?" | `zendesk_status` | Check credentials and API. |
| "Show open Zendesk tickets", "Search Zendesk for refund" | `zendesk_search_tickets` | Use query e.g. `type:ticket status:open` or free text. |
| "Open tickets for [Company X]" | `zendesk_search_tickets` | Get org ID with `zendesk_get_organization` or list_organizations, then query `type:ticket organization:ID`. |
| "What's our CSAT?", "Any bad ratings?", "Who's pissed off?" | `zendesk_search_tickets` | Query `type:ticket satisfaction_rating:bad` or `satisfaction_rating:good`. Results include satisfaction_rating (score, comment, reason). Single-ticket CSAT: `zendesk_get_ticket` returns satisfaction_rating. |
| "What's trending?", "What are people asking about?" | `zendesk_search_tickets` | Search recent tickets (e.g. created in last 7–30 days), summarize subjects and tags from results. |
| "Any anti-patterns?", "Repeated issues?" | `zendesk_search_tickets`, `zendesk_get_ticket_metrics` | Search by tag or keyword; use get_ticket_metrics for reopens/long resolution. Summarize patterns from multiple tickets. |
| "Get ticket 12345", "Details for Zendesk ticket #12345" | `zendesk_get_ticket` | Pass `ticket_id`. |
| "Reply to ticket 12345 with...", "Add an internal note to ticket 12345" | `zendesk_add_comment` | Pass `ticket_id`, `body`, and `public` (true = reply, false = note). |
| "Show me the thread for ticket 5", "List comments on ticket 12345" | `zendesk_list_ticket_comments` | Pass `ticket_id`. |
| "Assign ticket 5 to Jane", "Set ticket 5 to pending", "Change priority of ticket 3 to high" | `zendesk_update_ticket` | Pass `ticket_id` and any of: `status`, `priority`, `assignee_id`, `group_id`, `subject`, `type`. |
| "What groups do we have?", "List Zendesk groups" | `zendesk_list_groups` | Optional `limit`. |
| "Who are our agents?", "List Zendesk users" | `zendesk_list_users` | Optional `role` (agent/admin), `limit`. |
| "Get user 12345", "Details for agent Jane" | `zendesk_get_user` | Pass `user_id`. |
| "What are our business hours?", "List support schedules" | `zendesk_list_schedules` | — |
| "Create a new agent", "Add user Jane with email..." | `zendesk_create_user` | `name`, `email` (required), `role` (end-user/agent/admin), optional: `default_group_id`, `organization_id`, `notes`, `suspended`. |
| "Change Jane to admin", "Suspend user 123", "Set default group for user 5" | `zendesk_update_user` | `user_id` (required), any of: `role`, `default_group_id`, `suspended`, `name`, `notes`, `ticket_restriction`. |
| "Create a new group called Billing" | `zendesk_create_group` | `name` (required), optional `description`. |
| "Rename group 3 to Support Tier 2" | `zendesk_update_group` | `group_id` (required), `name` and/or `description`. |
| "Get details for group 5" | `zendesk_get_group` | `group_id` (required). |
| "Who is in group 5?", "List members of Billing group" | `zendesk_list_group_memberships` | `group_id` (required), optional `limit`. |
| "Which groups is user 10 in?" | `zendesk_list_user_group_memberships` | `user_id` (required). |
| "Add user 10 to group 5", "Put Jane in the Billing group" | `zendesk_add_user_to_group` | `user_id`, `group_id` (required), optional `default`. |
| "Remove user 10 from group 5" | `zendesk_remove_user_from_group` | `user_id`, `group_id` (required). |
| "What's the SLA/reply time for ticket 5?" | `zendesk_get_ticket_metrics` | Pass `ticket_id`. |
| "List our organizations", "What companies do we have?" | `zendesk_list_organizations` | Optional `limit`. |
| "Get organization 123", "Details for company X" | `zendesk_get_organization` | Pass `organization_id`. |
| "Who are the users in organization 5?" | `zendesk_list_organization_users` | Pass `organization_id`, optional `limit`. |
| "What custom statuses do we have?" | `zendesk_list_custom_statuses` | — |
| "What ticket fields/forms do we have?", "Trends by form field" | `zendesk_list_ticket_fields`, `zendesk_list_ticket_forms` | List fields (id, title, type, options) and forms (ticket_field_ids). Match ticket custom_fields to field id; aggregate by value for trends. |
| "What's in the thread?", "Entities/objects in this ticket" | `zendesk_list_ticket_comments` | Full comment body text is the source: infer people, products, order IDs, accounts, relationships from the thread. |
| "Find user Jane", "Search for user by email" | `zendesk_search_users` | Pass `query` (name/email/keyword), optional `limit`. |

---

## Tool reference

| Tool | Description | Parameters |
|------|-------------|------------|
| `zendesk_status` | Check Zendesk connection. | — |
| `zendesk_account_settings` | Account config (timezone, features). | — |
| `zendesk_search_tickets` | Search tickets (query syntax or keyword). Returns satisfaction_rating, tags, custom_fields when present. | `query` (required), `sort_by`, `sort_order`, `limit` |
| `zendesk_get_ticket` | Get one ticket by ID; includes satisfaction_rating (CSAT), tags, custom_fields (id/value), ticket_form_id. | `ticket_id` (required) |
| `zendesk_add_comment` | Add a public reply or internal note. | `ticket_id`, `body` (required), `public` (default true) |
| `zendesk_list_ticket_comments` | List comments on a ticket (thread). | `ticket_id` (required) |
| `zendesk_update_ticket` | Update status, priority, assignee, group, subject, type. | `ticket_id` (required), optional: `status`, `priority`, `assignee_id`, `group_id`, `subject`, `type` |
| `zendesk_list_groups` | List support groups. | `limit` (optional) |
| `zendesk_list_users` | List users (optional role filter). | `role` (agent/admin), `limit` (optional) |
| `zendesk_get_user` | Get user by ID. | `user_id` (required) |
| `zendesk_list_schedules` | List business hours schedules. | — |
| `zendesk_create_user` | Create user (end-user, agent, admin). | `name`, `email` (required), `role`, `default_group_id`, `organization_id`, `notes`, `suspended` |
| `zendesk_update_user` | Update user role, group, suspended, name, notes, ticket_restriction. | `user_id` (required), optional: `role`, `default_group_id`, `suspended`, `name`, `notes`, `ticket_restriction` |
| `zendesk_create_group` | Create support group. | `name` (required), `description` |
| `zendesk_update_group` | Update group name/description. | `group_id` (required), `name`, `description` |
| `zendesk_get_group` | Get group by ID. | `group_id` (required) |
| `zendesk_list_group_memberships` | List members of a group. | `group_id` (required), `limit` |
| `zendesk_list_user_group_memberships` | List groups a user is in. | `user_id` (required) |
| `zendesk_add_user_to_group` | Add agent to group. | `user_id`, `group_id` (required), `default` |
| `zendesk_remove_user_from_group` | Remove agent from group. | `user_id`, `group_id` (required) |
| `zendesk_get_ticket_metrics` | Ticket SLA metrics (reply time, resolution time, etc.). | `ticket_id` (required) |
| `zendesk_list_organizations` | List organizations (companies). | `limit` (optional) |
| `zendesk_get_organization` | Get organization by ID. | `organization_id` (required) |
| `zendesk_list_organization_users` | List users in an organization. | `organization_id` (required), `limit` (optional) |
| `zendesk_list_custom_statuses` | List custom ticket statuses. | — |
| `zendesk_list_ticket_fields` | List ticket fields (id, title, type, options). Use to interpret custom_fields and analyze trends by field. | — |
| `zendesk_list_ticket_forms` | List ticket forms (id, name, ticket_field_ids). Use with ticket_fields to know form structure. | — |
| `zendesk_search_users` | Search users by name/email/keyword. | `query` (required), `limit` (optional) |
| `zendesk_list_triggers` | List ticket triggers (run on create/update when conditions match). | `active_only`, `limit` (optional) |
| `zendesk_get_trigger` | Get one trigger by ID (conditions and actions). | `trigger_id` (required) |
| `zendesk_list_automations` | List automations (time-based rules; checked periodically). | `active_only`, `limit` (optional) |
| `zendesk_get_automation` | Get one automation by ID (conditions and actions). | `automation_id` (required) |
| `zendesk_list_macros` | List macros (agent-applied procedures). | `active_only`, `limit` (optional) |
| `zendesk_get_macro` | Get one macro by ID (actions it applies). | `macro_id` (required) |

---

## Bots, procedures, and AI workflows

- **Triggers** run automatically when a ticket is created or updated and conditions are met (e.g. notify customer when status changes to Solved).
- **Automations** run on a schedule (conditions checked periodically, e.g. hourly); e.g. “notify agent when ticket is open 24+ hours.”
- **Macros** are applied manually by agents (e.g. “Close and send standard reply”).
- **AI agents / Answer Bot** in Zendesk are a separate product (Guide + AI add-ons); configuration and conversation APIs are outside the Support API. See [ZENDESK_BOTS_AND_WORKFLOWS.md](../../docs/ZENDESK_BOTS_AND_WORKFLOWS.md) for how these pieces fit together and what the Sidekick can manage today (read-only triggers, automations, macros).

---

## Trends from ticket forms and fields

- **Ticket fields** (`zendesk_list_ticket_fields`) define what each custom field id means (title, type, dropdown options). **Ticket forms** (`zendesk_list_ticket_forms`) list which field IDs appear on each form.
- **Tickets** return `custom_fields` as `[{ id, value }]` and optionally `ticket_form_id`. Resolve id → title/options via list_ticket_fields; then aggregate (e.g. "how many tickets have field X = Refund?") for trends and issues by form/field.
- Search results include `custom_fields` when the Search API returns them, so you can trend over search result sets.

---

## Comment scanning: entities, objects, relationships

- **Full thread** is from `zendesk_list_ticket_comments`: each comment has `body` (plain text or HTML), `public`, `created_at`, `author_id`. Use this as the source for understanding what the ticket is about.
- **Entities and objects:** From the comment text, infer e.g. person names, company/account names, product names, order IDs, case numbers, contract refs. The Sidekick has no separate NER tool; it uses the model’s reading of the thread to identify and summarize these.
- **Relationships:** e.g. "Customer X mentioned Order #123 and Account Y." Summarize in conversation; for structured extraction at scale (many tickets), use an export + external NER/LLM pipeline and feed results back as needed.

---

## Query syntax (search)

- `type:ticket` — restrict to tickets (added automatically if omitted).
- `status:open`, `status:pending`, `status:solved`, `status:closed`
- **`organization:ID`** — tickets for an organization (e.g. `type:ticket organization:123`). Get org ID from `zendesk_get_organization` or `zendesk_list_organizations` when the user asks for "tickets for [Company X]".
- **`satisfaction_rating:bad`**, **`satisfaction_rating:good`** — CSAT filter (legacy CSAT; score good/bad). Use for "who's pissed off?", "any bad ratings?", "show me unhappy customers."
- **`tags:tag_name`** — tickets with a specific tag (e.g. `type:ticket tags:billing`).
- `created>2025-01-01`, `updated<2025-12-31`
- Free text searches subject and description.

---

## Rate limits

- **Support API (search, get ticket, etc.):** Plan-dependent — e.g. **200** (Team), **400** (Growth/Pro), **700** (Enterprise), **2500** (Enterprise Plus or High Volume add-on) requests per minute. Help Center and Support limits are separate.
- **Update Ticket** (used by `zendesk_add_comment`): **100 requests per minute per account** (300 with High Volume); also **30 updates per ticket per 10 minutes per user**.
- On **429 Too Many Requests**, the API returns a **Retry-After** header (seconds to wait). The skill surfaces this in the error message; avoid bursting many comment updates in a short period.
- [Zendesk rate limits](https://developer.zendesk.com/api-reference/introduction/rate-limits)

---

## Roadmap (from blueprint)

- Webhooks for real-time events; incremental exports for reporting; SLA/ticket metrics; CSAT retrieval; MCP or supervisor-style multi-agent. See **docs/ZENDESK_CXO_SIDEKICK_BLUEPRINT.md**.
