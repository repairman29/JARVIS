# Success metrics — what we track

**Purpose:** North star and supporting KPIs for JARVIS (product plan §6). Use this to tune for launch or a premium offering.

---

## North star

- **Active sessions (local + Edge) per week or month** — Count of distinct sessions that had at least one message in the period. Proxy for "people using JARVIS."

---

## Supporting KPIs

| Area | Metric | How to measure (options) |
|------|--------|---------------------------|
| **Chat UI** | Phase 1 done (streaming + persistent session) | Qualitative; UI roadmap audit. |
| **MCP** | Number of Cursor users using JARVIS MCP | MCP server installs or Edge calls with MCP-style JSON-RPC; Supabase Edge logs if you tag MCP requests. |
| **Showcase** | Traffic and install attempts (e.g. from Pages) | GitHub Pages analytics, or Vercel/Netlify if showcase moves; "Install" or "Try" button clicks. |
| **Community** | New skills or PRs per quarter | GitHub: new skills in `skills/`, PRs merged; CONTRIBUTING flow. |

---

## How to measure (practical)

- **Sessions:** If you have Supabase memory (session_messages), count distinct `session_id` per week/month. Edge logs can also give request counts per session_id if you log them.
- **MCP:** Tag Edge requests (e.g. body.jsonrpc === "2.0") and count in Supabase Edge logs or a simple analytics table.
- **Showcase:** Add analytics to the Pages site (e.g. Plausible, Fathom, or dashboard provider); track page views and CTA clicks.
- **Community:** GitHub API or manual: count new dirs under `skills/`, count PRs merged; optionally label PRs "skill" or "docs."

Tune these when you lock a launch or a premium offering. Update this doc when you add new metrics or change how you measure.
