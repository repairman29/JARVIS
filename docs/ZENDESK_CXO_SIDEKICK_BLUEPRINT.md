# Strategic Architectural Framework for the Zendesk Orchestration AI Agent: The CXO Sidekick Blueprint

*Saved for JARVIS Zendesk skill and future CXO-sidekick alignment. **User stories (C-suite / business owners):** [ZENDESK_SIDEKICK_USER_STORIES.md](./ZENDESK_SIDEKICK_USER_STORIES.md). Implementation: **skills/zendesk/** — Phase 1+ : status, account settings, tickets (search/get/update/comments/metrics), users (list/get/create/update/search), groups (list/get/create/update) and group membership, organizations (list/get, list users), business hours schedules, custom ticket statuses. Full orchestration (webhooks, incremental exports, CSAT, multi-agent) remains roadmap.*

**Rate limits:** Support API is plan-based (e.g. 200–700 req/min); Update Ticket 100 req/min per account, 30 updates per ticket per 10 min per user. 429 returns Retry-After. [Zendesk rate limits](https://developer.zendesk.com/api-reference/introduction/rate-limits). Skill handles 429 and documents limits in SKILL.md.

---

The transition from traditional ticketing systems to agentic customer experience (CX) orchestration represents a paradigm shift in how enterprises manage service delivery. The development of a Zendesk "CXO Sidekick"—an autonomous AI agent capable of overseeing the entirety of a support operation—requires a holistic integration of system settings, business logic, hierarchical data schemas, and real-time synchronization pipelines. This architectural framework delineates the technical requirements and execution strategies necessary to build a centralized intelligence layer that resides within the Zendesk ecosystem, effectively serving as a proactive teammate rather than a reactive tool.1

## Global System Configuration and Administrative Governance

A robust AI Sidekick must first comprehend the environment in which it operates. The Zendesk Admin Center serves as the central nervous system for account configuration, encompassing billing, security, brand management, and operational toolsets.2 For the AI agent to function as a CXO, it must have programmatic access to the account settings JSON, which reveals the active features and limitations of the instance.3

### Account Settings and Feature Parity

| Account Setting Category | Key Configuration Properties | Operational Significance |
|--------------------------|-----------------------------|--------------------------|
| Active Features | active_features object | Determines the functional scope of the AI agent.3 |
| Branding | header_color, page_background_color, favicon_url | Ensures the AI agent's UI components remain brand-compliant.3 |
| Security | sso, ip_restrictions, deletion_schedules | Governs the agent's access control and data retention compliance.2 |
| Localization | iana_time_zone, language_selection | Crucial for time-sensitive SLA calculations and multilingual support.3 |
| Apps & APIs | api object, apps configuration | Defines the connection points for external system integration.3 |

### Operational Schedules and Business Hours

Schedules are comprised of a time zone and a weekly schedule of business intervals (at least one hour long, 15-minute increments). Enterprise plans support multiple schedules for tiers/regions.5

| Schedule Interval Attribute | Technical Specification |
|-----------------------------|-------------------------|
| start_time | Minutes since Sunday at midnight (e.g., 1440 for Monday midnight) |
| end_time | Minutes since Sunday at midnight |
| time_zone | IANA-compliant (e.g., "America/New_York") |
| holidays | Array of start_date, end_date (ISO 8601) |

## Hierarchical Data Modeling: Users, Groups, and Organizations

Organizations contain end users; Groups organize agents. Key user properties: id, external_id, role, role_type, default_group_id, organization_id, tags.4 Organizations enable bulk management and group mapping (e.g., VIP org → dedicated support group).9

## The Ticket Lifecycle: State Management and Conversational Audits

### Core Ticket Schema

| Ticket Property | Type | Description |
|-----------------|------|-------------|
| type | string | Problem, incident, question, or task.12 |
| subject | string | Headline of the interaction.12 |
| status | string | New, open, pending, hold, solved, closed.12 |
| priority | string | Low, normal, high, urgent.12 |
| requester_id | integer | Customer ID.12 |
| custom_status_id | integer | Custom status category.12 |
| via.channel | string | Origin (web, mobile, mail).10 |

Comment is write-only on update; add new comment object. Tickets can have up to 5,000 comments.12 Audits are read-only histories of every update.13 Side conversations allow threaded discussions with external stakeholders.14

## Business Rules Engine: Triggers, Automations, SLAs

| Rule Type | Clock | Condition Examples |
|-----------|-------|--------------------|
| Trigger | Instantaneous | Ticket is Created; Status is Open.17 |
| Automation | Hourly Cycle | Hours since solved > 96; Status is Pending.18 |
| SLA Policy | Per Minute | First reply time; Requester wait time.20 |
| Macro | Manual | Agent clicks "Apply Macro".16 |

## Data Synchronization: Webhooks and Incremental Exports

- **Webhooks:** Real-time events (ticket.created, ticket.comment_added, etc.). Rate limits (trial: 60/min, 10 webhooks). Timeout 12s; circuit breaker at 70% error rate.10
- **Incremental Export API:** Cursor- or time-based pagination for tickets, users, orgs, custom objects. Use end_time/after_cursor; respect end_of_stream.22,24

## Metrics and CSAT

- **Ticket Metrics API:** reply_time_in_minutes, requester_wait_time_in_minutes, full_resolution_time_in_minutes, assignee_stations, reopens.27
- **CSAT:** Extract via Incremental Ticket Export → audit SurveyResponseSubmitted → Show Survey Response endpoint for rating and verbatim.21,26

## AI Agent Architecture: ReAct and Multi-Agent

- **ReAct (Reason + Act):** Thought → Action (API call) → Observation → loop until done.29
- **Supervisor pattern:** Master agent delegates to worker agents (Billing, Tech, Data Analyst).29
- **MCP:** Model Context Protocol as standard interface for tools (Zendesk, CRMs).31

## Execution Plan (from blueprint)

- **Phase 1 (Months 1–2):** Foundation — Help Center AI-ready, content hyper-focus, common intents/answer flows.33
- **Phase 2 (Months 3–4):** Integration — API connections, webhooks, custom objects.38,39
- **Phase 3 (Months 5–6):** Agentic deployment — Copilot in Agent Workspace, HITL guardrails, Explore exports.41,34

---

## Works cited (abbreviated)

1. Zendesk blog – agentic service human architecture  
2. Admin Center settings – Zendesk help  
3. Account Settings – Zendesk Developer Docs  
4. Users – Zendesk Developer Docs  
5–7. Schedules, business hours – Zendesk help / Developer Docs  
8. Answer flows – Zendesk help  
9. Groups and organizations – Customer success resources  
10. Webhooks – Zendesk Developer Docs  
11. Organization events – Zendesk Developer Docs  
12. Tickets – Zendesk Developer Docs  
13. Ticket Audits – Zendesk Developer Docs  
14. Summarize tickets with AI – Port Documentation  
16–20. Business rules, triggers, automations, SLAs – Zendesk help / Developer Docs  
21. CSAT ratings – Zendesk Developer Docs  
22,24. Incremental Exports – Zendesk Developer Docs  
26,27. CSAT reporting, Ticket Metrics – Zendesk Developer Docs  
29–34. Design patterns, ReAct, multi-agent, Explore – AppsTek, Google Cloud, Authority Partners, Zendesk  
37–41. MCP, custom objects, Copilot – CData, Zendesk help  

Full URLs and citations available in original source material.
