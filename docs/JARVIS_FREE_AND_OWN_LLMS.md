# Free LLMs and own-model options for JARVIS

How our stack works, then a list of **free** and **own-model** options that fit it.

---

## How the stack uses LLMs

- **Gateway** (Clawdbot) talks to LLM **providers** via **OpenAI-compatible** HTTP: `POST /v1/chat/completions` with `model`, `messages`, etc.
- Config: `~/.clawdbot/clawdbot.json` (and on Railway, `config/railway-openclaw.json` is copied at start). You add **providers** under `models.providers` and **fallbacks** under `agents.defaults.model.fallbacks`.
- **Secrets:** API keys go in `~/.clawdbot/.env` or **Supabase Vault** (`env/clawdbot/<KEY>`). Railway uses Vault via `start-gateway-with-vault.js`.
- Any service that exposes an **OpenAI-compatible** chat completions API can be added as a provider (base URL + API key env, `api: "openai-completions"`).

See [GETTING_STARTED_MODES.md](../GETTING_STARTED_MODES.md) and [scripts/FREE_TIER_FALLBACKS.md](../scripts/FREE_TIER_FALLBACKS.md) for existing Groq / OpenRouter / Together setup.

---

## Free APIs (cloud, OpenAI-compatible)

| Provider | Free tier | Notes | Plug-in |
|----------|-----------|--------|--------|
| **Groq** | 30–60 RPM, 1K req/day; Llama 3.3 70B, 8B | Already in Blue mode; very fast | `GROQ_API_KEY`, provider `groq` |
| **OpenRouter** | ~50 req/day (20 RPM); 25+ free models | `openrouter/free` or specific free models | `OPENROUTER_API_KEY`, [FREE_TIER_FALLBACKS.md](../scripts/FREE_TIER_FALLBACKS.md) |
| **Google AI Studio (Gemini)** | 5–15 RPM, 250K tok/min; Gemini 2.5 Pro/Flash, 1M context | **OpenAI-compatible**: base URL `https://generativelanguage.googleapis.com/v1beta/openai/`, model names differ | Add provider with `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY`; [Google docs](https://ai.google.dev/gemini-api/docs/openai) |
| **Cerebras** | 30 RPM, 1M tokens/day; Llama 3.3 70B | Fast inference | Add provider `baseUrl: "https://api.cerebras.ai/v1"`, `apiKey: "${CEREBRAS_API_KEY}"` |
| **Mistral** | 2 RPM, 1B tokens/month; Mistral Large | | `MISTRAL_API_KEY`, base URL per Mistral docs |
| **Cohere** | 20 RPM, 1K req/month; Command R+ | | `COHERE_API_KEY` (may need adapter if not fully OpenAI-shaped) |
| **DeepSeek** | 5M free tokens then cheap paid | Very low cost | Add provider; base URL per DeepSeek API docs |
| **Hugging Face** | Free tier with monthly credits; 300+ models | Inference API; some OpenAI-compatible endpoints | `HUGGINGFACE_API_KEY`; check per-model endpoint shape |
| **Together** | Free Llama 3.3 70B (limits apply) | Already in FREE_TIER_FALLBACKS | `TOGETHER_API_KEY` |
| **GitHub Models** | GPT-4o, 10–15 RPM | For GitHub-authenticated usage | GitHub token + provider if they expose chat completions |

**References:** [OpenRouter free API](https://openrouter.ai/openrouter/free/api), [Google Gemini OpenAI compatibility](https://ai.google.dev/gemini-api/docs/openai), [free LLM APIs 2025 roundups](https://awesomeagents.ai/tools/free-ai-inference-providers-2026/).

---

## Using your own models (self-hosted / local)

These expose an **OpenAI-compatible** `/v1/chat/completions` endpoint so the gateway can use them like any other provider.

| Option | Role | Notes |
|--------|------|--------|
| **Ollama** | Local models (Mac, Linux, etc.) | Already in your stack. `ollama run <model>`, then `http://localhost:11434/v1`. Add provider `baseUrl: "http://localhost:11434"`, no key. Your Neural Farm uses Ollama on the Mac. |
| **LocalAI** | Self-hosted, OpenAI-compatible API | Drop-in OpenAI replacement; runs GGML/llama.cpp models, no GPU required. Docker: `docker run -p 8080:8080 localai/localai:latest`. Add provider `baseUrl: "http://localhost:8080"` (or your server). [LocalAI](https://localai.io/) |
| **llama.cpp server** | Lightweight local server | Many wrappers expose `/v1/chat/completions`. Point gateway at that URL. |
| **Neural Farm (your setup)** | Mac + phones as “own” models | Farm balancer :8899; gateway uses `farm/auto`. When Mac is up, those nodes are “your” models. |

For **Railway**: you can’t run Ollama/LocalAI on Railway’s Node service. Use them on your Mac, a home server, or a VPS, and point the gateway at that URL (e.g. Tailscale or tunnel) if you want “own model” in the cloud path.

---

## Adding a new provider to clawdbot.json

1. **Get an API key** (or confirm no key for local).
2. **Put the key in env:** `~/.clawdbot/.env` or Vault as `env/clawdbot/<KEY_NAME>`.
3. **Add a provider block** in `clawdbot.json` under `models.providers`:

```json
"provider_id": {
  "baseUrl": "https://api.provider.com/v1",
  "apiKey": "${PROVIDER_API_KEY}",
  "api": "openai-completions",
  "models": [
    {
      "id": "model-name-on-provider",
      "name": "Human-readable name",
      "reasoning": false,
      "input": ["text"],
      "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
      "contextWindow": 131072,
      "maxTokens": 8192
    }
  ]
}
```

4. **Reference in fallbacks** (optional): add `"provider_id/model-name-on-provider"` to `agents.defaults.model.fallbacks`.
5. **Restart the gateway** (and on Railway, redeploy so the new env var is present).

---

## Quick wins for “more free” and “own”

- **Already in stack:** Groq, OpenRouter free, Together (see [FREE_TIER_FALLBACKS.md](../scripts/FREE_TIER_FALLBACKS.md)); Cerebras (run [add-cerebras-provider.js](../scripts/add-cerebras-provider.js)); OpenAI, Gemini, Anthropic (run [add-openai-gemini-anthropic-providers.js](../scripts/add-openai-gemini-anthropic-providers.js) so provider blocks exist — keys already loaded from Vault).
- **One-time setup:** Run **`node scripts/add-openai-gemini-anthropic-providers.js`** to add `openai`, `gemini`, and `anthropic` provider blocks to `clawdbot.json`. Then set primary or fallbacks (e.g. `openai/gpt-4o-mini`, `gemini/gemini-2.5-flash`, `anthropic/claude-3-5-sonnet-20241022`) as needed.
- **Own models:** Keep using **Ollama** and/or **Neural Farm** when the Mac is on; for a dedicated self-hosted API, add **LocalAI** or another OpenAI-compatible server and a provider pointing at its URL.
