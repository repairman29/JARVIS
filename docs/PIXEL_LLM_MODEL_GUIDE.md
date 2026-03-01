# Pixel LLM models: what they're best for and JARVIS mapping

Short guide to the models you have on the Pixel (InferrLM + Gemini Nano) and how to map them to JARVIS chat vs. tasks.

---

## Model summaries (Pixel InferrLM)

The **actual loaded model** is whatever you selected in InferrLM (Chat → Load model). The adapter reports it at `GET http://127.0.0.1:8888/v1/models` and in each completion’s `model` field (often the GGUF filename). The app may show a shorter display name (e.g. “Qwen 2.5 3B”) than the filename.

| Model ID (API / filename) | Best for | Notes |
|---------------------------|----------|--------|
| **Qwen2.5-3B-Instruct-Q4_K_M.gguf** | **Chat, tasks, Q&A** | 3B params, 4-bit (Q4_K_M). Good balance of speed and capability. May appear in the app as “Qwen 2.5 3B” or similar. |
| **gemma-3-4b-it-Q4_K_M.gguf** | **Tasks, reasoning, Q&A, summarization** | 4B params, 128K context; strong instruction-following and function calling. Best balance of capability vs. size on device. Use for plan-execute, skills, tool use. |
| **Gemma 3 Instruct - 1B** | **Fast chat, simple Q&A** | Small, fast (~2.8s in tests). Good for quick replies, smart-reply style, simple document Q&A. Use when Nano is down or for low-latency InferrLM fallback. |
| **Granite 4.0 Helper 1B** | **Fast chat, tool-calling, edge** | IBM 1.5B; built for edge/low-latency and agentic workflows (tool use). Fast inference. Good for quick tool decisions or fast chat. |
| **VibeThinker 1.5B** | **Math, coding, step-by-step reasoning** | Optimized for math/code reasoning; can be slow (55s+ in tests) and may output chain-of-thought (`<think>`). Use only when you explicitly want deep reasoning on a single request. |

---

## Gemini Nano (8890)

| Backend | Best for | Notes |
|---------|----------|--------|
| **Gemini Nano (bridge 8890)** | **Chat, quick replies** | Fastest (~49 ms in tests). On-device (AICore). Use for normal conversation; not for heavy tool use or long reasoning. |

---

## JARVIS mapping (recommended)

The router can send **chat** to Nano and **tasks** to InferrLM, and (when sending to InferrLM) set the request `model` so the right InferrLM model is used.

| JARVIS use | Recommended model | Env var |
|------------|--------------------|---------|
| **Chat (primary)** | Gemini Nano | `PIXEL_LLM_TERTIARY=http://127.0.0.1:8890`, `PIXEL_LLM_ROUTE=chat-task` |
| **Chat fallback** (when Nano unavailable) | Gemma 3 Instruct - 1B or Granite 4.0 Helper 1B | `PIXEL_LLM_PRIMARY_CHAT_MODEL="Gemma 3 Instruct - 1B"` |
| **Tasks** (plan-execute, skills, tools) | Gemma 3 4B | `PIXEL_LLM_PRIMARY_TASK_MODEL="gemma-3-4b-it-Q4_K_M.gguf"` |
| **Optional: heavy reasoning** (math/code) | VibeThinker 1.5B | Not set by default; use only if you add a separate path or override for that intent. |

---

## Example: transfer to JARVIS (Pixel env)

On the Pixel, in `~/.clawdbot/.env` (or wherever you set env before starting the stack), add or merge:

```bash
# Router: chat → Nano, tasks → InferrLM
export PIXEL_LLM_ROUTE=chat-task
export PIXEL_LLM_TERTIARY=http://127.0.0.1:8890

# When a request goes to InferrLM (8888), which model to request
export PIXEL_LLM_PRIMARY_CHAT_MODEL="Gemma 3 Instruct - 1B"
export PIXEL_LLM_PRIMARY_TASK_MODEL="gemma-3-4b-it-Q4_K_M.gguf"
```

Then restart the router (or full stack). Chat will use Nano when the bridge is running; when a request hits InferrLM, the router will set `model` to the chat or task model above so InferrLM uses the right one.

---

## Quick reference

- **Fastest for chat:** Nano (8890) → then Gemma 3 1B or Granite 4.0 Helper 1B.
- **Best for tasks/tools:** Gemma 3 4B.
- **Math/code reasoning:** VibeThinker 1.5B (slow; use only when needed).

See [PIXEL_LLM_SPEED_AND_PRIORITY.md](./PIXEL_LLM_SPEED_AND_PRIORITY.md) for speed tests and routing options, and [PIXEL_DUAL_LLM_BACKEND.md](./PIXEL_DUAL_LLM_BACKEND.md) for router env vars.
