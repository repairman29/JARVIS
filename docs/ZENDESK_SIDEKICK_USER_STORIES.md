# Zendesk Sidekick: User Stories (C-Suite & Business Owners)

*Outcome-focused user stories from executives and business owners for what the Sidekick should be able to do. Used to align the [Zendesk skill](../../skills/zendesk/) and [CXO Blueprint](./ZENDESK_CXO_SIDEKICK_BLUEPRINT.md) with real use cases.*

**How to use:** Prioritize stories for sprints; map new tools to unmet stories; validate with actual C-suite/VP Support users.

**Zendesk is for everything** — support, bugs, feature requests, feedback, billing, onboarding, internal ops, partnerships, and more. Stories below reflect that breadth.

---

## Personas

| Persona | Primary concern | Typical questions |
|--------|------------------|--------------------|
| **CEO** | Customer experience, risk, strategic visibility | "How is support doing?" "Any escalations?" "Are we set up for scale?" |
| **COO** | Operations, capacity, efficiency, SLAs | "Are we hitting SLAs?" "Where's the bottleneck?" "Do we have enough agents?" |
| **CCO / VP Support** | Day-to-day health, team structure, quality | "Show me open tickets." "Who's in which group?" "What's our reply time?" |
| **Head of CS / Account Management** | Customer health, VIP treatment, org-level view | "What's going on with [Company X]?" "Any at-risk accounts?" |
| **Support Manager / Team Lead** | Assignments, coverage, replies, escalations | "Assign this to Jane." "What did we tell the customer?" "List my group's tickets." |
| **Product Manager** | Product feedback, bugs, feature requests, entity/product view | "All tickets about [product/feature]." "What are people saying about X?" "Tickets for this release." |
| **Engineering / Dev** | Bug reports, repro steps, scope of issues | "Tickets tagged bug." "Open issues for [component]." "What's blocking?" |
| **Marketing / Growth** | Campaign feedback, NPS, voice of customer | "Feedback about the launch." "Unhappy customers this week." "Mentions of [campaign]." |
| **Finance / Billing** | Billing disputes, refunds, payment issues | "Open billing tickets." "Refund requests this month." "Tickets for org [X] about billing." |
| **Ops / Internal** | Internal requests, IT, facilities, vendor tickets | "Tickets from [internal org]." "Open IT requests." |

---

## 1. Visibility & health (CEO / COO / CCO)

### US-1.1 — Snapshot of support health
**As a** CEO or COO,  
**I want** to ask the Sidekick for a quick picture of support (e.g. "How is support doing?"),  
**so that** I get a brief, accurate summary without opening Zendesk or a dashboard.

- **Sidekick can:** Use `zendesk_status`, `zendesk_account_settings`, `zendesk_search_tickets` (e.g. open/pending counts), and optionally `zendesk_get_ticket_metrics` for a sample ticket to describe health in plain language.
- **Tools:** status, account_settings, search_tickets, get_ticket_metrics.

### US-1.2 — SLA and performance for a specific ticket
**As a** COO or VP Support,  
**I want** to ask "What's the SLA status for ticket #12345?" or "How long did we take to reply?",  
**so that** I can quickly check performance or handle an escalation.

- **Sidekick can:** Use `zendesk_get_ticket_metrics` and return reply time, resolution time, requester wait (business/calendar).
- **Tools:** get_ticket_metrics.

### US-1.3 — Understand our support configuration
**As a** COO or new VP Support,  
**I want** to ask "What's our Zendesk set up for?" (timezone, business hours, features),  
**so that** I know how we're configured for SLAs and capacity planning.

- **Sidekick can:** Use `zendesk_account_settings` and `zendesk_list_schedules`.
- **Tools:** account_settings, list_schedules.

---

## 2. Tickets: find, read, act (CCO / Manager / Lead)

### US-2.1 — Find and list tickets
**As a** VP Support or Team Lead,  
**I want** to say "Show me open tickets" or "Recent high-priority tickets" or "Tickets from [Company X]",  
**so that** I can triage or report without building Zendesk views.

- **Sidekick can:** Use `zendesk_search_tickets` with query (status, priority, org, date, keyword).
- **Tools:** search_tickets.

### US-2.2 — Read a ticket and its thread
**As a** Support Manager,  
**I want** to ask "What's going on with ticket #12345?" and see the full thread,  
**so that** I can catch up before escalating or replying.

- **Sidekick can:** Use `zendesk_get_ticket` and `zendesk_list_ticket_comments`.
- **Tools:** get_ticket, list_ticket_comments.

### US-2.3 — Reply or add an internal note
**As a** Team Lead,  
**I want** to say "Reply to ticket 12345 with: [message]" or "Add an internal note to 12345: [note]",  
**so that** I can respond or document without switching to the Zendesk UI.

- **Sidekick can:** Use `zendesk_add_comment` (public reply or internal).
- **Tools:** add_comment.

### US-2.4 — Assign, reassign, or change status/priority
**As a** Support Manager,  
**I want** to say "Assign ticket 5 to Jane" or "Set ticket 5 to pending" or "Move ticket 5 to the Billing group",  
**so that** workload and routing stay correct.

- **Sidekick can:** Use `zendesk_update_ticket` (assignee_id, group_id, status, priority). Use `zendesk_search_users` or `zendesk_list_users` to resolve "Jane" to an ID if needed.
- **Tools:** update_ticket, search_users, list_users.

---

## 3. People: agents, roles, groups (CCO / Manager)

### US-3.1 — See who’s on the team and their role
**As a** VP Support,  
**I want** to ask "Who are our agents?" or "List admins",  
**so that** I know who can do what and who to assign.

- **Sidekick can:** Use `zendesk_list_users` (role filter: agent/admin).
- **Tools:** list_users.

### US-3.2 — Find a user by name or email
**As a** Manager,  
**I want** to say "Find user Jane" or "Who is jane@company.com?",  
**so that** I can get a user ID to assign tickets or manage groups.

- **Sidekick can:** Use `zendesk_search_users` with query.
- **Tools:** search_users.

### US-3.3 — See group structure and who’s in each group
**As a** VP Support,  
**I want** to ask "What groups do we have?" and "Who is in the Billing group?",  
**so that** I understand structure and coverage.

- **Sidekick can:** Use `zendesk_list_groups` and `zendesk_list_group_memberships`.
- **Tools:** list_groups, list_group_memberships.

### US-3.4 — Add or remove agents from groups
**As a** VP Support,  
**I want** to say "Add Jane to the Billing group" or "Remove Bob from Tier 2",  
**so that** we can adjust coverage without going into Admin.

- **Sidekick can:** Use `zendesk_add_user_to_group` and `zendesk_remove_user_from_group` (resolve names via search_users if needed).
- **Tools:** add_user_to_group, remove_user_from_group.

### US-3.5 — Create or update agents and roles
**As a** VP Support or COO,  
**I want** to say "Create a new agent: Jane, jane@company.com" or "Make user 5 an admin" or "Suspend user 3",  
**so that** onboarding and role changes don’t require a separate admin session.

- **Sidekick can:** Use `zendesk_create_user` and `zendesk_update_user` (role, suspended, default_group_id, etc.).
- **Tools:** create_user, update_user.

### US-3.6 — Create or rename groups
**As a** VP Support,  
**I want** to say "Create a group called Tier 2" or "Rename group 3 to VIP Support",  
**so that** we can restructure teams without leaving the conversation.

- **Sidekick can:** Use `zendesk_create_group` and `zendesk_update_group`.
- **Tools:** create_group, update_group.

---

## 4. Customers & organizations (Head of CS / CCO)

### US-4.1 — See which organizations we have
**As a** Head of Customer Success,  
**I want** to ask "What organizations do we have?" or "List our companies",  
**so that** I can reference accounts in conversation or reporting.

- **Sidekick can:** Use `zendesk_list_organizations`.
- **Tools:** list_organizations.

### US-4.2 — Get details and contacts for an organization
**As a** Head of CS or Account Manager,  
**I want** to ask "What’s the deal with [Company X]?" or "Who are the contacts for org 123?",  
**so that** I can see org details and users for that company.

- **Sidekick can:** Use `zendesk_get_organization` and `zendesk_list_organization_users`. Resolve "Company X" to an ID via list_organizations if needed.
- **Tools:** get_organization, list_organization_users, list_organizations.

### US-4.3 — See tickets or activity for an organization
**As a** Head of CS,  
**I want** to ask "Any open tickets for [Company X]?",  
**so that** I can assess account health or prep for a QBR.

- **Sidekick can:** Use `zendesk_get_organization` to get org id (if name given), then `zendesk_search_tickets` with query `type:ticket organization:123`.
- **Tools:** search_tickets, get_organization, list_organization_users. **Closed:** Org search syntax documented in [SKILL.md](../../skills/zendesk/SKILL.md) and skill.json; see [ZENDESK_SIDEKICK_GAPS_CLOSURE.md](./ZENDESK_SIDEKICK_GAPS_CLOSURE.md).

---

## 5. Configuration & workflow (COO / VP Support)

### US-5.1 — Know what ticket statuses we use
**As a** VP Support,  
**I want** to ask "What custom statuses do we have?",  
**so that** I use the right wording when asking the Sidekick to update tickets or when training the team.

- **Sidekick can:** Use `zendesk_list_custom_statuses`.
- **Tools:** list_custom_statuses.

### US-5.2 — Know our business hours
**As a** COO or VP Support,  
**I want** to ask "What are our support hours?" or "When are we open?",  
**so that** I can align SLAs or communicate to customers.

- **Sidekick can:** Use `zendesk_list_schedules` (and account timezone from account_settings).
- **Tools:** list_schedules, account_settings.

---

## 6. Stretch / roadmap (not fully covered today)

### US-6.1 — Proactive alert on SLA risk or breach
**As a** COO,  
**I want** the Sidekick (or a scheduled job) to notify me when a ticket is about to breach SLA or has breached,  
**so that** I can intervene before the customer escalates.

- **Closed:** Script **scripts/zendesk-sla-check.js** runs on a schedule (e.g. cron). Finds open/pending tickets, checks metrics, reports at-risk (no first reply within N hours, or high requester wait). Exit 1 when at-risk for alerting. See [ZENDESK_SIDEKICK_GAPS_CLOSURE.md](./ZENDESK_SIDEKICK_GAPS_CLOSURE.md).

### US-6.2 — CSAT and satisfaction trends
**As a** CEO or CCO,  
**I want** to ask "What’s our CSAT lately?" or "Show me recent survey feedback",  
**so that** I can track customer satisfaction over time.

- **Partial:** CSAT is on the ticket as `satisfaction_rating` (score good/bad, comment, reason). Use `zendesk_search_tickets` with `satisfaction_rating:bad` or `satisfaction_rating:good` to find bad/good ratings; `zendesk_get_ticket` returns satisfaction_rating. So "Who's pissed off?", "Any bad ratings?", "What did unhappy customers say?" work. Aggregated trends over time (e.g. % good/bad by week) still need Explore or Survey Response API.

### US-6.3 — Rollup reports (e.g. tickets by group, by agent)
**As a** COO or VP Support,  
**I want** to ask "How many tickets did each group close last week?" or "Tickets per agent this month",  
**so that** I can do lightweight reporting without Explore or exports.

- **Partial:** Sidekick can run multiple searches and summarize in conversation; no single "report" API. Explore/exports remain the right place for heavy reporting.

### US-6.4 — Escalation path (notify someone when ticket is urgent)
**As a** Support Manager,  
**I want** to say "Escalate ticket 5 to the manager" or "Notify Jane about ticket 5",  
**so that** the right person is looped in without a manual process.

- **Partial:** Sidekick can add an internal note mentioning the person, or assign to Jane; no built-in "notify" (email/Slack) in Zendesk skill. Integration with Slack/email would be separate.

---

## 7. Entities, products & topics (PM / Eng / everyone)

*Zendesk holds conversations about products, features, accounts, and topics. People want to see "everything about X" without building views or exporting.*

### US-7.1 — All tickets about a product or entity
**As a** Product Manager,  
**I want** to say "Show me all tickets about [Product X]" or "Everything we have for [Feature Y]",  
**so that** I see the full picture for that product or entity without hunting in Zendesk.

- **Sidekick can:** Use `zendesk_search_tickets` with full-text query (product/feature name); if you use a custom field or tag for "product" or "entity", search by that (e.g. `tags:product_x` or custom field value). Use `zendesk_list_ticket_fields` / `zendesk_list_ticket_forms` to know which field IDs map to product/entity; then search and filter by `custom_fields` in results or run multiple searches. For "mentions in text", search by keyword; `zendesk_list_ticket_comments` on a set of tickets lets the model infer entities from thread body.
- **Tools:** search_tickets, list_ticket_fields, list_ticket_forms, get_ticket (custom_fields), list_ticket_comments.

### US-7.2 — Tickets that mention a specific thing (keyword / topic)
**As a** PM or Engineer,  
**I want** to ask "Tickets that mention [refund / outage / API / login]",  
**so that** I can pull every conversation touching that topic.

- **Sidekick can:** Use `zendesk_search_tickets` with free-text query (Zendesk searches subject and description). For deeper "mentions in the whole thread", search returns ticket IDs; optionally fetch comments for a sample or key tickets and summarize what’s mentioned.
- **Tools:** search_tickets, list_ticket_comments (for thread-level mention scan).

### US-7.3 — Tickets by form or custom field value (e.g. "Product", "Type")
**As a** Product Manager or Ops,  
**I want** to ask "All tickets where Product = [X]" or "Tickets from the Feedback form",  
**so that** I get a list by the way we actually categorize work.

- **Sidekick can:** Use `zendesk_list_ticket_fields` to get field IDs and (for dropdowns) option values; then `zendesk_search_tickets` (if your plan supports search by custom field—check Zendesk docs) or search + filter in conversation. Tickets from a given form: search and filter by `ticket_form_id` from `zendesk_list_ticket_forms`. If search doesn’t support custom field filters, Sidekick can search recent/updated tickets and filter by `custom_fields` in the returned payload.
- **Tools:** list_ticket_fields, list_ticket_forms, search_tickets, get_ticket (custom_fields, ticket_form_id).

### US-7.4 — Summarize what people are saying about an entity or product
**As a** Product Manager,  
**I want** to ask "What are people saying about [Product X]?" or "Common themes in tickets for [Feature Y]",  
**so that** I get a synthesized view of feedback and issues without reading every ticket.

- **Sidekick can:** Run search for tickets about the product/entity (US-7.1–7.3), then for a sample or full set use `zendesk_get_ticket` and `zendesk_list_ticket_comments` to read subject, description, and thread; summarize themes, entities, and relationships in conversation. Use tags and custom_fields where available to narrow scope.
- **Tools:** search_tickets, get_ticket, list_ticket_comments, list_ticket_fields (to interpret custom_fields).

### US-7.5 — Who’s affected / which accounts are in these tickets?
**As a** PM or Head of CS,  
**I want** to see "Which organizations or customers show up in tickets about [X]?",  
**so that** I know impact and can prioritize or loop in account owners.

- **Sidekick can:** Search tickets for topic/product/entity (US-7.1–7.2); tickets include `requester_id` and often `organization_id` (in get_ticket or search if returned). Resolve org IDs via `zendesk_get_organization` or list from results; list org users with `zendesk_list_organization_users` if needed. Summarize "these orgs/customers appear in these tickets."
- **Tools:** search_tickets, get_ticket, get_organization, list_organizations, list_organization_users.

---

## 8. Zendesk for everything (use-case breadth)

*Zendesk is used for support, bug reports, feature requests, NPS/feedback, billing and refunds, onboarding, IT/internal ops, partnerships, and general "inbound" from customers and internal teams. Stories below are by use case so the Sidekick stays aligned with what people actually do.*

### US-8.1 — Support: "What’s going on with my queue / group / open tickets?"
**As a** Support Manager or Agent,  
**I want** to ask "My open tickets" or "What’s in the Billing queue?",  
**so that** I can triage and work without building Zendesk views.

- **Sidekick can:** Use `zendesk_search_tickets` (e.g. by group, assignee, status); resolve "my" or "Billing" via current user or `zendesk_list_groups` / `zendesk_list_group_memberships`.
- **Tools:** search_tickets, list_groups, list_group_memberships, list_users.

### US-8.2 — Bugs: "All bug reports" or "Bugs for [component]"
**As a** Engineer or PM,  
**I want** to ask "Show me open bug tickets" or "Bugs tagged [component]",  
**so that** I can see scope and prioritize fixes.

- **Sidekick can:** Use `zendesk_search_tickets` with tag (e.g. `tags:bug`) or type/keyword; if bugs are a custom field value (e.g. Type = Bug), use list_ticket_fields to get the field, then search/filter by custom_fields or tag.
- **Tools:** search_tickets, list_ticket_fields, get_ticket (custom_fields).

### US-8.3 — Feature requests / feedback: "What do people want?"
**As a** Product Manager,  
**I want** to ask "Feature request tickets" or "Feedback form submissions from last month",  
**so that** I can feed roadmap and prioritization.

- **Sidekick can:** Search by tag, form, or custom field (e.g. "Feature request", ticket_form_id for feedback form); filter by date. Use list_ticket_forms and list_ticket_fields to map forms/fields to "feedback" or "feature request."
- **Tools:** search_tickets, list_ticket_forms, list_ticket_fields, get_ticket.

### US-8.4 — Billing / refunds: "Billing issues" or "Refund requests"
**As a** Finance or Support,  
**I want** to ask "Open billing tickets" or "Refund requests this month",  
**so that** I can clear disputes and track volume.

- **Sidekick can:** Search by tag (e.g. `tags:billing`, `tags:refund`), keyword ("refund", "billing"), or custom field; filter by date/status.
- **Tools:** search_tickets, list_ticket_fields, get_ticket.

### US-8.5 — Onboarding / success: "Tickets from new customers" or "Onboarding issues"
**As a** CS or Onboarding lead,  
**I want** to ask "Tickets from orgs created in the last 90 days" or "Tickets tagged onboarding",  
**so that** I can spot patterns and improve onboarding.

- **Sidekick can:** Search by tag or keyword; for "new orgs" combine list_organizations (created_at) with search by organization ID or requester. Use custom_fields if you track "onboarding" or "new customer" on the ticket.
- **Tools:** search_tickets, list_organizations, get_organization, list_ticket_fields.

### US-8.6 — Internal / IT / ops: "Internal requests" or "Tickets from [department]"
**As a** Internal Ops or IT,  
**I want** to ask "Open IT tickets" or "Tickets submitted by [internal group]",  
**so that** I can manage internal demand in one place.

- **Sidekick can:** Search by tag, form, or organization (if internal depts are orgs); filter by requester domain or org name if you use that to distinguish internal.
- **Tools:** search_tickets, list_organizations, list_ticket_forms, get_ticket.

### US-8.7 — Voice of customer: "What’s trending?" / "What are people complaining about?"
**As a** PM, Marketing, or CEO,  
**I want** to ask "What’s trending in tickets?" or "What are the top complaints this month?",  
**so that** I get a quick read on sentiment and themes without running reports.

- **Sidekick can:** Search recent tickets (e.g. created or updated in last 7–30 days); summarize subjects, tags, and (from a sample) comment body. Use satisfaction_rating:bad for "complaints" or unhappy customers. Optionally aggregate by custom field (e.g. topic or product) using list_ticket_fields.
- **Tools:** search_tickets, get_ticket, list_ticket_comments, list_ticket_fields.

### US-8.8 — One place for "everything about this customer/account"
**As a** Account Manager or CS,  
**I want** to ask "Everything we have for [Company X]" (tickets, history, contacts),  
**so that** I have a single view for that account.

- **Sidekick can:** Resolve company name to org via `zendesk_list_organizations` or `zendesk_get_organization`; then `zendesk_search_tickets` with organization:ID, plus `zendesk_list_organization_users` for contacts. Summarize ticket counts, open vs closed, recent themes.
- **Tools:** list_organizations, get_organization, list_organization_users, search_tickets, get_ticket, list_ticket_comments.

---

## Coverage summary

| Area | User stories | Covered by current tools |
|------|------------------|---------------------------|
| Visibility & health | US-1.1–1.3 | Yes |
| Tickets: find, read, act | US-2.1–2.4 | Yes |
| People: agents, roles, groups | US-3.1–3.6 | Yes |
| Customers & organizations | US-4.1–4.3 | Yes (org search documented) |
| Configuration & workflow | US-5.1–5.2 | Yes |
| Stretch / roadmap | US-6.1–6.4 | US-6.1 closed (SLA script); US-6.2 partial; 6.3–6.4 partial/future |
| **Entities, products & topics** | **US-7.1–7.5** | **Yes** (search, tags, custom_fields, ticket_fields/forms, list_ticket_comments for thread/entity scan) |
| **Zendesk for everything** | **US-8.1–8.8** | **Yes** (support, bugs, feedback, billing, onboarding, internal, VoC, account view via search + tags + forms/fields + orgs) |

---

## How to add or refine stories

1. **Capture** — Add new stories in the same format: As a [persona], I want [capability] so that [outcome]. Include entity/product/topic stories (PM) and use-case breadth (support, bugs, feedback, billing, internal, etc.).
2. **Map** — For each story, note which Sidekick tools (if any) satisfy it; note "Gap" or "Partial" if not.
3. **Prioritize** — Use with C-suite/VP Support/PM to rank; feed into skill roadmap or scripts (e.g. SLA check script).
4. **Acceptance** — Define "done" (e.g. "Sidekick returns reply time in under 10 seconds" for US-1.2).

See also: [ZENDESK_CXO_SIDEKICK_BLUEPRINT.md](./ZENDESK_CXO_SIDEKICK_BLUEPRINT.md), [ZENDESK_SIDEKICK_GAPS_CLOSURE.md](./ZENDESK_SIDEKICK_GAPS_CLOSURE.md), [ZENDESK_SIDEKICK_PLAYBOOK.md](./ZENDESK_SIDEKICK_PLAYBOOK.md), [skills/zendesk/README.md](../../skills/zendesk/README.md), [jarvis/TOOLS.md](../../jarvis/TOOLS.md).
