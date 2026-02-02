# Many Cursor Bots — Stitch Into One Session

**Goal:** JARVIS **stitches** all Cursor bots into **one** session. By default, every MCP `jarvis_chat` call (from any Cursor window or agent) loads and appends to the same thread (`"mcp"`). One conversation, many bots.

**Bot awareness:** So JARVIS knows which bot said what, pass **`speaker`** in `jarvis_chat` (e.g. workspace name, or a label like `Cursor-olive`). The Edge function prepends `[Bot: <speaker>]` to each user message before storing and sending to the model. Then JARVIS sees "Bot: olive" vs "Bot: jarvis-ui" and can be aware they are different.

---

## 1. Default: one session, all bots stitch

| Client | Session ID | Behavior |
|--------|------------|----------|
| **MCP (Cursor)** | Omit `session_id` → use **`"mcp"`** | All bots load the same history and append to the same thread. JARVIS sees one continuous conversation from every Cursor agent/window. |
| **REST** | Send `session_id: "mcp"` (or same id as UI) | Same thread as MCP; UI or scripts can read/write the same stitched session. |
| **JARVIS UI** | Use `"mcp"` in session picker / config | One place to view and continue the stitched conversation. |

**Rule:** Don’t pass `session_id` from MCP (or use `"mcp"` everywhere) → one session, all bots stitch. Pass `session_id` only when you want **that** bot in a separate thread.

---

## 2. How stitching works

1. **Load:** Each MCP call loads the last N messages for the session (default `"mcp"`) from `session_messages`.
2. **Speaker (optional):** If the client passes `speaker` (e.g. workspace name), we store and send the user message as `[Bot: <speaker>]\n<message>`. JARVIS then sees which bot said what.
3. **Call:** Gateway gets `[history..., new user message]` so JARVIS has full context from all previous bots (and, if speaker was used, who said what).
4. **Append:** After the reply, we append the new user message and the assistant reply to the same session. Next bot (or same bot later) sees that turn in history.

Result: one growing thread. Bot A asks something, JARVIS answers; Bot B asks a follow-up with full context. If `speaker` is passed, JARVIS is aware that the bots are different.

---

## 3. When to use a separate thread

Pass `session_id` in `jarvis_chat` **only** when you want this Cursor agent/window to have its **own** conversation (e.g. a one-off experiment or a distinct project). Then that bot gets an isolated thread; everyone else keeps stitching into `"mcp"`.

---

## 4. Bottlenecks when many bots talk at once

| Layer | Behavior | Limit / scaling |
|-------|----------|------------------|
| **Supabase Edge** | Stateless; one request = one invocation. | Supabase concurrency limits per project. |
| **Gateway** | Single process today. All requests hit the same process. | **Main bottleneck:** CPU / memory. Scale by multiple gateway instances or a bigger host. |
| **Supabase DB** | `session_messages` keyed by `session_id`; one `"mcp"` thread grows with every turn. | Indexed by session_id; one session = one row set. Keep last N or summarize if the thread gets huge (see JARVIS_MEMORY.md). |

---

## 5. Summary

- **Stitch (default):** Omit `session_id` in MCP → all Cursor bots use session `"mcp"`: load history, append after each turn. One session, one conversation.
- **Separate thread:** Pass `session_id` only when you want that bot isolated.
- **View the stitched session:** Use JARVIS UI (or REST) with `session_id: "mcp"` to see and continue the same thread.
