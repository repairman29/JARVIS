# Parallel or batched tool calls

When the model supports **multiple tool calls in one turn**, the gateway can pass them through and merge results for faster, more efficient turns.

---

## Why

- **Speed** — Independent tools (e.g. clock + web_search + repo_summary) can be requested in one model response and executed in parallel.
- **Efficiency** — Fewer round-trips when the LLM batches tool calls.

---

## How it works

1. **Model** returns multiple `tool_calls` in a single response (e.g. OpenAI/Anthropic parallel tool-call support).
2. **Gateway** executes each tool call (in parallel when possible) and merges results into one or more tool-result messages.
3. **Model** gets one follow-up turn with all results and can produce the final reply.

If the model does **not** support parallel tool calls, the gateway continues with one tool per turn; no doc change needed beyond "prefer one tool per turn" until supported.

---

## Config and support

- **Model support** — Check your provider’s docs (e.g. OpenAI, Anthropic) for "parallel tool calls" or "multiple tool calls" in one response.
- **Gateway** — OpenClaw/CLAWDBOT gateway should pass through multiple `tool_calls` when the backend returns them; no extra config if the model already does this.
- **UI** — If the gateway returns `meta.tools_used`, the UI can show all tools used in that turn (see [JARVIS_UI_GATEWAY_CONTRACT.md](./JARVIS_UI_GATEWAY_CONTRACT.md) §2.6).

---

## Summary

Use an LLM that supports multiple tool calls in one turn when available; the gateway merges results. If your model does not support it, document "prefer one tool per turn" in agent instructions until you switch to a supporting model.
