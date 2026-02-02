# JARVIS UI — Gateway/Edge Response Contract

**Purpose:** Define the response shapes the JARVIS UI expects for roadmap items **2.6** (tool/skill visibility), **2.7** (structured tool output), and **4.8** (CLI parity: run and copy result). When the gateway or Edge function sends these shapes, the UI will display them; until then, the UI works without them.

**Roadmap ref:** [JARVIS_UI_ROADMAP.md](./JARVIS_UI_ROADMAP.md) — Phase 2.6, 2.7; Phase 4.8.

---

## 1. Tool/skill visibility (2.6)

**Goal:** Show when JARVIS used a skill (e.g. "Used: launcher") so the developer can see what ran.

### Response shape (non-stream)

Include in the **same JSON object** that contains the assistant text (e.g. top-level or under `choices[0]`):

- **`meta.tools_used`** (optional): array of skill/tool names used for this turn.

**Examples:**

```json
{
  "choices": [{ "message": { "content": "I ran the calculator." } }],
  "meta": { "tools_used": ["calculator"] }
}
```

```json
{
  "content": "Here are the results from the launcher.",
  "meta": {
    "prompt_trimmed_to": 12000,
    "tools_used": ["launcher", "file_search"]
  }
}
```

**Streaming:** Gateways that stream can send a **final** SSE event with only meta (e.g. `data: {"meta":{"tools_used":["calculator"]}}`) after the last content delta. The UI will accumulate `tools_used` from the last such event when present. If no meta event is sent, the UI shows no chips for that turn.

### UI behavior

- If `meta.tools_used` is present and non-empty, the UI shows compact chips above the message body (e.g. "Used: calculator", "Used: launcher").
- If absent or empty, nothing is shown.

---

## 2. Structured tool output (2.7)

**Goal:** Render lists/tables/expandable blocks when the gateway returns structured results instead of a single text blob.

### Response shape

- **`meta.structured_result`** (optional): free-form structure (object or array) that the UI may render in a readable way.

**Suggested shapes (gateway may use others):**

- **List of items:** `{ "type": "list", "items": ["a", "b", "c"] }`
- **Table:** `{ "type": "table", "headers": ["Name", "Status"], "rows": [["JARVIS", "ok"], ["Ollama", "ok"]] }`
- **Key-value:** `{ "type": "key_value", "entries": [{ "key": "Session", "value": "abc" }] }`
- **Raw JSON (expandable):** any object; UI can show a collapsible JSON block.

**Example:**

```json
{
  "content": "Here are the running processes.",
  "meta": {
    "tools_used": ["launcher"],
    "structured_result": {
      "type": "table",
      "headers": ["PID", "Name"],
      "rows": [["123", "node"], ["456", "ollama"]]
    }
  }
}
```

### UI behavior (future)

- When `meta.structured_result` is present, the UI can render it as list, table, or expandable block **in addition to** (or instead of) the text in `content`, depending on design. Current UI does not yet render `structured_result`; this contract allows the gateway to send it so the UI can add rendering later.

---

## 3. CLI parity — Run and copy result (4.8)

**Goal:** Let the user run one message and get the final reply as plain text (e.g. to paste into a script or another app), without streaming UI.

### Option A: Query/body flag (preferred)

- **Request:** Same `POST /v1/chat/completions` (or Edge equivalent), with an extra parameter:
  - **`run_once`** or **`return_final_only`**: if `true`, gateway runs the turn and returns a **single** JSON object with the final text and optional meta (no streaming).
- **Response:** Same as non-stream response: `content` + optional `meta.tools_used`, `meta.prompt_trimmed_to`, `meta.structured_result`.

### Option B: Dedicated endpoint

- **Request:** e.g. `POST /v1/run_once` (or Edge path) with body `{ "message", "session_id", "messages" }`.
- **Response:** `{ "content": "...", "meta": { ... } }`.

### UI behavior

- When the gateway supports one of the above, the UI can add a "Run and copy result" (or "Copy result") control that:
  1. Sends the current composer text (or last user message) with `run_once: true` (or calls the dedicated endpoint).
  2. Waits for the full response.
  3. Copies `content` (and optionally a formatted summary including tools_used) to the clipboard.

Until the gateway implements Option A or B, the UI will not show this control (or will show it disabled with a tooltip).

---

## Summary

| Item | Gateway/Edge sends | UI today |
|------|--------------------|----------|
| 2.6 Tool visibility | `meta.tools_used: string[]` | Shows "Used: X" chips when present |
| 2.7 Structured output | `meta.structured_result` (object/array) | Contract only; rendering TBD |
| 4.8 Run and copy | `run_once` (or dedicated endpoint) + same JSON body | Button/control when supported |

**Pass-through:** The Next.js API route in `apps/jarvis-ui/app/api/chat/route.ts` forwards `meta` from gateway/Edge to the client when present (non-stream and, when implemented, final stream event).
