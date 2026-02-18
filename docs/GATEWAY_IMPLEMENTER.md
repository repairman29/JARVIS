# For gateway implementers

**One-page entry point** for anyone implementing or forking the JARVIS/Clawdbot gateway. The UI and Edge are ready; the gateway must send **meta** so the UI can show tool visibility and structured output.

---

## Contract and behavior

| Doc | Use |
|-----|-----|
| **[JARVIS_UI_GATEWAY_CONTRACT.md](./JARVIS_UI_GATEWAY_CONTRACT.md)** | Exact response shapes for tool visibility (2.6), structured output (2.7), run-and-copy (4.8). |
| **[JARVIS_GATEWAY_META.md](./JARVIS_GATEWAY_META.md)** | How to send `meta.tools_used`, `meta.structured_result`, `meta.prompt_trimmed_to`; non-stream vs streaming; implementation checklist. |

---

## Implementation checklist (in your gateway codebase)

- [ ] **Non-stream:** Add top-level **`meta`** to the final JSON response. Set **`meta.tools_used`** to an array of tool/skill names used this turn. (If you already send **`choices[0].message.tool_calls`**, the JARVIS Edge maps them to `meta.tools_used`.)
- [ ] **Structured result:** When a tool returns list/table/key-value or JSON, set **`meta.structured_result`** to that object. Shapes: `list`, `table`, `key_value`, or raw JSON (see JARVIS_GATEWAY_META §4).
- [ ] **Streaming:** After the last content delta, send one more SSE line: **`data: {"meta":{"tools_used":["name1","name2"],"structured_result":{...}}}`**.
- [ ] **Prompt trimmed:** If the request was truncated, set **`meta.prompt_trimmed_to`** (number) so the UI can show "Prompt trimmed to N characters."
- [ ] **Vision (optional):** When the request includes **`imageDataUrl`** (data URL or base64 image), merge it into the last user message as multimodal content (e.g. OpenAI-style `content: [{ type: "text", text: "..." }, { type: "image_url", image_url: { url: imageDataUrl } }]`) and call a vision-capable model. See [JARVIS_VISION_BACKLOG.md](./JARVIS_VISION_BACKLOG.md).

---

## Where this lives

This repo (CLAWDBOT/JARVIS) holds the **UI**, **Edge function**, and **docs**. The gateway (Clawdbot/OpenClaw) may be a separate package or repo. Copy this page or link to it from your gateway repo so implementers have one place to start. Full details: [JARVIS_GATEWAY_META.md](./JARVIS_GATEWAY_META.md).
