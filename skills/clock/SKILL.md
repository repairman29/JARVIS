# Clock (current date/time)

Use this skill so JARVIS never says "I don't have real-time access" for date/time questions.

## When to use

- "What time is it?"
- "What's the date?"
- "Current time in Denver" / "time in London"
- "What day is it?"

## Tool

| Tool | Description |
|------|-------------|
| `get_current_time` | Current date and time. Params: optional `timezone` (IANA, e.g. America/Denver), optional `format` (friendly / iso / short). |

## Env

None. Always available.

## Example

**User:** "What time is it in Denver?"  
**JARVIS:** Call `get_current_time({ timezone: "America/Denver" })` and reply with the formatted time.

**User:** "What's today's date?"  
**JARVIS:** Call `get_current_time()` and reply with the date.
