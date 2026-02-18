# Wikipedia

Search Wikipedia and get article summaries. No API key required. JARVIS can answer "what is X?" and "search Wikipedia for Y" using the public MediaWiki API.

## Installation

No setup. Enable the skill in your gateway config (or rely on default skill loading). No env vars.

## Quick usage

- **"What is quantum entanglement?"** → `wikipedia_summary` with `search: "quantum entanglement"`.
- **"Search Wikipedia for machine learning"** → `wikipedia_search` with `query: "machine learning"`.
- **"Give me a short summary of the Albert Einstein article"** → `wikipedia_summary` with `title: "Albert Einstein"`.

## Tools

- **wikipedia_search** — Search by query; returns titles, snippets, page IDs.
- **wikipedia_summary** — Intro summary for an article by title or by search term.

See [SKILL.md](./SKILL.md) for when to use and parameters.
