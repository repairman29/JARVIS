# News — latest headlines

Use when the user asks for news, headlines, or what's happening. **No API key.** Fetches from BBC, NPR, and optionally Reuters RSS feeds.

---

## Setup

None. No env vars.

---

## When to use

| User says… | Tool | Notes |
|------------|------|--------|
| "Latest news", "Headlines", "What's in the news", "News today" | `news_headlines` | Returns title, link, source. Use `source: "all"` for mixed feeds or `bbc` / `npr` / `reuters` for one. |

---

## Tool reference

| Tool | Description | Parameters |
|------|-------------|------------|
| `news_headlines` | Get latest headlines from RSS feeds. | `limit` (default 10, max 25), `source` (all \| bbc \| npr \| reuters) |

---

## Implementation

- Fetches RSS XML from BBC, NPR, Reuters (Reuters feed may vary). Parses `<item>` blocks for `<title>` and `<link>`; strips CDATA and HTML entities. Dedupes by title when `source: "all"`.
