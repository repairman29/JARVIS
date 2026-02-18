# Notion — Search, create pages, query databases

Use when the user wants to search Notion, create a page, add a database row, or list database entries. Requires **NOTION_API_KEY** (internal integration token from notion.so/my-integrations). Pages and databases must be shared with the integration.

---

## Setup

- Create an integration at [Notion Integrations](https://www.notion.so/my-integrations); copy the **Internal Integration Token**.
- Set **`NOTION_API_KEY`** in the gateway env. Share the relevant Notion pages/databases with the integration.

---

## When to use

| User says… | Tool | Notes |
|-------------|------|--------|
| "Search Notion for X", "Find in my Notion workspace" | `notion_search` | Pass query; returns matching pages/databases with titles and URLs. |
| "Create a Notion page under X", "Add a note to my meeting notes" | `notion_create_page` | Use `parent_page_id` (page UUID) and optional `title`, `content`. |
| "Add a row to my tasks database", "Create a database entry" | `notion_create_page` | Use `parent_database_id` (database UUID) and `title`; optional `database_title_key` if the DB title property isn't "Name". |
| "List my tasks database", "Show rows from database X" | `notion_query_database` | Pass `database_id`; optional `page_size`. |
| "Add this to my meeting notes", "Append to page X" | `notion_append_blocks` | Pass `page_id` and `content`; double newlines become separate paragraphs. |

---

## Tool reference

| Tool | Description | Parameters |
|------|-------------|------------|
| `notion_search` | Search Notion by title; returns up to 10 results with title and URL. | `query` (string, required) |
| `notion_create_page` | Create a page under a page or a row in a database. | `parent_page_id` or `parent_database_id`, `title`, optional `content` (page only), optional `database_title_key` |
| `notion_query_database` | List rows in a database. | `database_id` (required), optional `page_size` (default 20) |
| `notion_append_blocks` | Append paragraphs to an existing page. | `page_id` (required), `content` (required); `\n\n` splits into multiple paragraphs |

---

## Implementation

- **notion_search:** `POST /v1/search` with `query`; returns page/database titles and URLs.
- **notion_create_page:** `POST /v1/pages` with `parent` (page_id or database_id), `properties` (title), and optional `children` (paragraph when parent is page). For database parent, title property defaults to "Name".
- **notion_query_database:** `POST /v1/databases/{id}/query` with optional `page_size` and `sorts`; returns page titles and URLs for each row.
- **notion_append_blocks:** `PATCH /v1/blocks/{page_id}/children` with paragraph block(s); content split on double newlines, max 100 blocks per request.
