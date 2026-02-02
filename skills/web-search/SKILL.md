# Web Search (Brave)

Use Brave Search so JARVIS can answer current-events and real-time questions instead of saying "I don't have access to real-time information."

## When to use

- User asks for **today's date**, **current time** (in a city), **latest news**, **weather**, or any **live fact**.
- User says "search the web for X" or "look up X".
- You would otherwise reply that you don't have real-time access — **call `web_search` instead.**

## Tool

| Tool | Description |
|------|-------------|
| `web_search` | Query Brave Search. Params: `query` (required), `count` (default 5), optional `freshness` (pd/pw/pm/py). |

## Env

- `BRAVE_API_KEY` or `BRAVE_SEARCH_API_KEY` in `~/.clawdbot/.env` (or from Vault via `start-gateway-with-vault.js`).

## Example

**User:** "What's the current time in Denver?"  
**JARVIS:** Call `get_current_time({ timezone: "America/Denver" })` (clock skill) or `web_search({ query: "current time Denver Colorado" })` and report the result.

**User:** "Search for latest news about AI."  
**JARVIS:** Call `web_search({ query: "latest news AI", count: 5, freshness: "pd" })` and summarize.
