# Web Search skill

JARVIS uses the **Brave Search API** to search the web. This skill is loaded by the gateway so JARVIS can answer current-events and real-time questions instead of saying he doesn't have access.

## Setup

1. Get a Brave Search API key: https://brave.com/search/api/ or https://api-dashboard.search.brave.com
2. Add to `~/.clawdbot/.env`:
   ```
   BRAVE_API_KEY=your_brave_search_api_key
   ```
3. Start the gateway with Vault so the key is loaded:
   ```bash
   node scripts/start-gateway-with-vault.js
   ```

See repo `docs/BRAVE_SEARCH_SETUP.md` for more options (Vault, `clawdbot configure --section web`).

## Tools

- **web_search** — `query` (required), `count` (default 5), optional `freshness` (pd/pw/pm/py for 24h/7d/31d/year).

## Behavior

- When the user asks for current date/time, news, weather, or "search for X", JARVIS should call `web_search` (or `get_current_time` from the clock skill for simple date/time).
- The skill returns `results` (title, url, description) and optional `summary` from Brave.
