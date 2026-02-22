# Optimized LLM order (free-tier limits)

Run **`node scripts/optimize-llm-fallbacks.js`** to set primary and fallbacks in `clawdbot.json` to this order. The gateway tries primary first, then each fallback in sequence when the previous one fails (rate limit, error, context overflow).

## Order and rationale

| Order | Model | Provider | Approx. free limits | Why this position |
|-------|--------|----------|---------------------|-------------------|
| **Primary** | groq/llama-3.1-8b-instant | Groq | 14,400 req/day, very fast | Highest RPD, lowest latency; best default. |
| 1 | groq/llama-3.3-70b-versatile | Groq | 1,000 req/day | Same key; use when 8B hits context overflow or you want 70B. |
| 2 | cerebras/llama-3.3-70b | Cerebras | 30 RPM, 1M tok/day | Fast, good daily token budget. |
| 3 | gemini/gemini-2.5-flash | Google | 10 RPM, 250 RPD, 250K TPM | Strong free tier, 1M context. |
| 4 | deepseek/deepseek-chat | DeepSeek | 5M tokens free then cheap | High free token grant before paid. |
| 5 | cohere/command-r-plus | Cohere | 20 RPM, 1K req/month | Decent RPM; monthly cap. |
| 6 | openrouter/arcee-ai/trinity-mini:free | OpenRouter | ~50 req/day, 20 RPM | Low daily count; use after higher limits. |
| 7 | together/... | Together | Varies | If configured; Together may require paid tier now. |
| 8 | mistral/mistral-large-latest | Mistral | 2 RPM, 1B tok/month | Very low RPM; use late to preserve quota. |
| 9 | huggingface/... | Hugging Face | Monthly credits | Community models; use last among free. |

After these, if you have **openai** or **anthropic** in config and in fallbacks, they run last (paid).

## Limits (summary)

- **Groq 8B:** 14,400 RPD — use as primary.
- **Groq 70B:** 1,000 RPD — first fallback for bigger model.
- **Cerebras:** 30 RPM, 1M tokens/day.
- **Gemini 2.5 Flash:** 10 RPM, 250 RPD, 250K TPM.
- **DeepSeek:** 5M free tokens (then pay-per-use).
- **Cohere:** 20 RPM, 1K requests/month.
- **OpenRouter free:** ~50 req/day.
- **Mistral:** 2 RPM — use late.

## Script behavior

- **optimize-llm-fallbacks.js** only adds fallbacks whose **provider** exists in `models.providers` in your `clawdbot.json`. If you haven’t run the “add X provider” scripts for some of these, they’re skipped.
- Primary is set to `groq/llama-3.1-8b-instant` if the `groq` provider exists; otherwise the script keeps your current primary or picks the first available from the list.
- Restart the gateway after running so the new order is used.

## Reverting or customizing

- To go back to a different primary: run `node scripts/set-primary-groq.js`, `set-primary-openai.js`, etc., or edit `agents.defaults.model.primary` in `clawdbot.json`.
- To change fallback order: edit `agents.defaults.model.fallbacks` in `clawdbot.json` (array of `"provider/model"` strings).
