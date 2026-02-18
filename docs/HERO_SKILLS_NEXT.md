# Hero skills — next steps

Short list of what’s done and what’s next for **Focus Pro** and **Notion** (hero/premium skills). See [COMMUNITY_AND_SKILLS.md](./COMMUNITY_AND_SKILLS.md) and [JARVIS_PRODUCT_PLAN.md](./JARVIS_PRODUCT_PLAN.md) §5b.

---

## Focus Pro

| Item | Status | Notes |
|------|--------|------|
| Timer + macOS `say` | ✅ Done | skills/focus-pro: start session, announce on end. |
| Windows/Linux voice | ✅ Done | Timer ends: Linux `notify-send`, Windows 10+ toast via PowerShell. |
| Labels in announcement | ✅ Done | "Focus for 50 minutes on writing" → announcement includes label. |

**Next (optional):** Notify-send or system toast on Windows/Linux when timer ends.

---

## Notion

| Item | Status | Notes |
|------|--------|------|
| Search (notion_search) | ✅ Done | skills/notion: NOTION_API_KEY, search by query. |
| Create page | ⬜ Next | Notion API: create page in database or as child. See [Notion API](https://developers.notion.com/). |
| Query database | ⬜ Next | Notion API: query a database with filters/sorts; return rows. |
| Append blocks | ✅ Done | skills/notion: `notion_append_blocks` — page_id + content; double newlines → multiple paragraphs. |
| MCP alignment | ⬜ When ready | Align with Notion MCP toolset (notion-search, notion-fetch, notion-update-page, query-data-source). See [NOTION_AGENTIC_WORKSPACE_2026.md](./NOTION_AGENTIC_WORKSPACE_2026.md). |

**Next:** Notion MCP alignment when ready. Otherwise hero skills are complete for this wave.

---

## How to use this doc

When picking up hero-skill work, read the skill’s README and SKILL.md, then use this table to choose the next unimplemented item. Update the table when you ship something.
