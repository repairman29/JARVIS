# Zendesk Sidekick: Playbook (flows to run)

*Step-by-step flows so the Sidekick (or a human) can fulfill the main user stories. Use these when the user asks for entity/product views, trends, or "everything about X."*

**See also:** [ZENDESK_SIDEKICK_USER_STORIES.md](./ZENDESK_SIDEKICK_USER_STORIES.md), [skills/zendesk/SKILL.md](../skills/zendesk/SKILL.md), [jarvis/TOOLS.md](../jarvis/TOOLS.md).

---

## Flow 1: All tickets about a product or entity

**User says:** "Show me all tickets about [Product X]" / "Everything for [Feature Y]."

1. **If you use a tag for product/entity:**  
   `zendesk_search_tickets({ query: "type:ticket tags:product_x", limit: 100 })`.

2. **If you use a custom field (e.g. "Product"):**  
   - `zendesk_list_ticket_fields()` → find the field whose title is "Product" (or similar); note its `id` and `custom_field_options` (values like "Product X").  
   - Zendesk Search may not support filtering by custom field in the query. So:  
   - `zendesk_search_tickets({ query: "type:ticket updated>2024-01-01", limit: 100 })` (or a keyword query if they mention the product name in subject/description).  
   - For each result, if the API returned `custom_fields`, filter in conversation where `custom_fields` has that field id with value "Product X". If search doesn’t return custom_fields, call `zendesk_get_ticket` for each ticket and filter by `custom_fields`.

3. **If it’s just keyword in subject/description:**  
   `zendesk_search_tickets({ query: "type:ticket Product X", limit: 100 })` (or a more specific phrase).

4. **Optional:** Run **`node scripts/zendesk-tickets-by-entity.js "Product X"`** (or `tag:product_x`) from repo root for a CLI list of matching ticket IDs and subjects.

---

## Flow 2: Tickets that mention a topic (keyword)

**User says:** "Tickets that mention refund / outage / API / login."

1. `zendesk_search_tickets({ query: "type:ticket refund", limit: 50 })` (replace "refund" with the topic).  
2. Zendesk full-text search covers subject and description. For "mentions in the whole thread," you only get ticket IDs from search; to confirm thread-level mention, use `zendesk_list_ticket_comments` on a sample and summarize.

---

## Flow 3: Tickets by form or custom field value

**User says:** "All tickets where Product = X" / "Tickets from the Feedback form."

1. **By form:**  
   - `zendesk_list_ticket_forms()` → get form id for "Feedback" (or the form name).  
   - Search recent tickets; then filter results where `ticket_form_id` equals that id (or fetch tickets and check `ticket_form_id`).

2. **By custom field value:**  
   - `zendesk_list_ticket_fields()` → get field id and option values.  
   - Search tickets (e.g. recent/updated); filter results by `custom_fields` where field id = value.  
   - Or run **`node scripts/zendesk-trends-by-field.js`** to see which field to use and get counts by value.

---

## Flow 4: What are people saying about [product/entity]?

**User says:** "What are people saying about [Product X]?" / "Common themes for [Feature Y]."

1. Get candidate tickets: Flow 1 (all tickets about product/entity).  
2. For a sample (e.g. 10–20 tickets), call `zendesk_get_ticket` and `zendesk_list_ticket_comments` for each.  
3. Summarize in conversation: themes, sentiment, entities (people, accounts, order IDs), and relationships. Use the full comment `body` as the source; the model infers entities/relationships.

---

## Flow 5: Who’s affected? (orgs/customers in these tickets)

**User says:** "Which organizations show up in tickets about [X]?"

1. Get tickets: Flow 1 or 2.  
2. From each ticket, collect `requester_id` and, if present, `organization_id` (from `zendesk_get_ticket`; search may also return these).  
3. Resolve org ids: `zendesk_get_organization` or `zendesk_list_organizations` to map id → name.  
4. Summarize: "These N orgs/customers appear in these tickets: …"

---

## Flow 6: Voice of customer / what’s trending

**User says:** "What’s trending?" / "Top complaints this month?" / "What are people complaining about?"

1. `zendesk_search_tickets({ query: "type:ticket updated>2025-01-01", sort_by: "updated_at", sort_order: "desc", limit: 50 })` (adjust date).  
2. Summarize subjects and tags; optionally filter by `satisfaction_rating:bad` for complaints.  
3. For themes, run Flow 4 on a sample (get_ticket + list_ticket_comments, summarize).  
4. **Optional:** `node scripts/zendesk-trends-by-field.js` to aggregate by a custom field (e.g. "Topic" or "Type").

---

## Flow 7: Everything for one account/customer

**User says:** "Everything we have for [Company X]."

1. `zendesk_list_organizations()` or search by name → get organization id.  
2. `zendesk_search_tickets({ query: "type:ticket organization:<id>", limit: 100 })`.  
3. `zendesk_get_organization`, `zendesk_list_organization_users` for contacts.  
4. Summarize: ticket count, open vs closed, recent subjects, key contacts.

---

## Flow 8: Bugs / feedback / billing (use-case filters)

**User says:** "Open bug tickets" / "Feature requests" / "Billing tickets" / "Refund requests."

1. Prefer **tag**: `zendesk_search_tickets({ query: "type:ticket tags:bug", limit: 50 })` (or tags:billing, tags:refund, tags:feature_request).  
2. If you use a **form**: get form id from `zendesk_list_ticket_forms`, search tickets, filter by `ticket_form_id`.  
3. If you use a **custom field** (e.g. Type = Bug): use `zendesk_list_ticket_fields` to get field id and values, then search + filter by `custom_fields`.  
4. Keyword fallback: `zendesk_search_tickets({ query: "type:ticket refund", limit: 50 })`.

---

## Scripts (run from repo root)

| Script | Purpose |
|--------|---------|
| `node scripts/zendesk-smoke-test.js` | Validate Zendesk connection and core tools. |
| `node scripts/zendesk-sla-check.js` | Find at-risk open/pending tickets (no reply, high wait). Exit 1 if any; for cron. |
| `node scripts/zendesk-tickets-by-entity.js [keyword]` or `tag:xyz` | List tickets matching a keyword (subject/description) or tag. Output: ticket id, subject, status. |
| `node scripts/zendesk-trends-by-field.js` | List ticket fields; then aggregate recent tickets by one custom field and print counts by value. |

Env for all: `ZENDESK_SUBDOMAIN`, `ZENDESK_EMAIL`, `ZENDESK_API_TOKEN` in `~/.clawdbot/.env`.
