# Gateway: how to send meta (tools_used, structured_result)

**Purpose:** For gateway implementers (e.g. Clawdbot or custom gateways). The JARVIS UI and Edge function already support **meta**; once the gateway sends it, tool visibility (2.6) and structured output (2.7) work end-to-end.

**Contract (exact shapes):** [JARVIS_UI_GATEWAY_CONTRACT.md](./JARVIS_UI_GATEWAY_CONTRACT.md)

---

## 1. What to send

| Field | When | UI behavior |
|-------|------|-------------|
| **`meta.tools_used`** | After a turn where skills/tools were used | Shows "Used: X" chips above the message |
| **`meta.structured_result`** | When you have list/table/key-value or raw JSON | Renders list, table, key_value, or expandable JSON block |
| **`meta.prompt_trimmed_to`** | When context was trimmed | UI shows "Prompt trimmed to N characters" |

---

## 2. Non-stream response

Include **`meta`** in the same JSON object as the assistant content (top-level or under `choices[0]`).

**Example (top-level content + meta):**

```json
{
  "content": "Here are the results from the launcher.",
  "meta": {
    "tools_used": ["launcher", "file_search"],
    "prompt_trimmed_to": 12000
  }
}
```

**Example (OpenAI-style):**

```json
{
  "choices": [{ "message": { "content": "I ran the calculator." } }],
  "meta": { "tools_used": ["calculator"] }
}
```

**Edge behavior:** The Edge function already passes through `meta` from the gateway. If the gateway returns OpenAI-style **`choices[0].message.tool_calls`**, the Edge maps those to **`meta.tools_used`** (see `extractMeta` in `supabase/functions/jarvis/index.ts`). So gateways can either send top-level **`meta.tools_used`** or rely on **tool_calls** for tool visibility.

---

## 3. Streaming response

Send a **final** SSE event with only **meta** after the last content delta (e.g. after the last `data: {"choices":[{"delta":{"content":"..."}}]}`).

**Example final event:**

```
data: {"meta":{"tools_used":["launcher"],"structured_result":{"type":"table","headers":["PID","Name"],"rows":[["123","node"]]}}}
```

The UI accumulates **tools_used** and **structured_result** from this event. If you don't send a final meta event, the UI shows no chips or structured block for that turn.

---

## 4. structured_result shapes

Use the same shapes as in the contract:

- **List:** `{ "type": "list", "items": ["a", "b", "c"] }`
- **Table:** `{ "type": "table", "headers": ["A", "B"], "rows": [["1", "2"]] }`
- **Key-value:** `{ "type": "key_value", "entries": [{ "key": "X", "value": "Y" }] }`
- **Other:** Any object → UI shows expandable JSON

---

## 5. Summary

| Goal | Gateway action |
|------|----------------|
| Tool visibility (2.6) | Add **`meta.tools_used`** (array of strings) to the response, or use **`choices[0].message.tool_calls`** (Edge maps to tools_used). |
| Structured output (2.7) | Add **`meta.structured_result`** (object: list/table/key_value or raw). |
| Prompt trimmed | Add **`meta.prompt_trimmed_to`** (number). |
| Streaming | Send a final SSE line **`data: {"meta":{...}}`** after the last content delta. |

**References:** [JARVIS_UI_GATEWAY_CONTRACT.md](./JARVIS_UI_GATEWAY_CONTRACT.md), [JARVIS_UI_AUDIT.md](./JARVIS_UI_AUDIT.md) (2.6, 2.7).
