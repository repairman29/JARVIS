# Clock skill

Provides **current date and time** in any IANA timezone. No API key required. Use so JARVIS never says he doesn't have real-time access for simple date/time questions.

## Tools

- **get_current_time** — Optional `timezone` (e.g. America/Denver, Europe/London, UTC), optional `format` (friendly, iso, short). Returns date, time, formatted string, and ISO.

## Behavior

- When the user asks "what time is it?", "what's the date?", or "current time in [city]", call `get_current_time` with the appropriate timezone (or omit for local time) and report the result.
