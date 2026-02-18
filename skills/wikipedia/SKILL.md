# Wikipedia — Search & summaries

Use when the user asks for a definition, "what is X", or wants to look something up on Wikipedia. **No API key required.** Uses the public MediaWiki API.

---

## Setup

None. No env vars; works out of the box.

---

## When to use

| User says… | Tool | Notes |
|------------|------|--------|
| "What is X?", "Define Y", "Wikipedia summary for Z" | `wikipedia_summary` | Use `title` if they give an exact article name, or `search` to find the first matching article. |
| "Search Wikipedia for X", "Find Wikipedia articles about Y" | `wikipedia_search` | Returns titles, snippets, and page IDs. |

---

## Tool reference

| Tool | Description | Parameters |
|------|-------------|------------|
| `wikipedia_search` | Search Wikipedia; returns matching articles with title, snippet, pageId. | `query` (required), `limit` (default 5, max 10) |
| `wikipedia_summary` | Get the intro summary of an article. | `title` (exact article title) or `search` (find first match), optional `sentences` (default 5, max 10) |

---

## Implementation

- **wikipedia_search:** `GET en.wikipedia.org/w/api.php?action=query&list=search&srsearch=...` — no key.
- **wikipedia_summary:** Resolves title from `search` if needed via search API, then `action=query&prop=extracts&exintro&explaintext=1&exsentences=N&titles=...`.
- Plain text only; no HTML in responses.
