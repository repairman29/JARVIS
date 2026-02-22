# Env keys for full farm when Mac is offline

When the Mac is unreachable, Edge uses the **aux gateway (Railway)**. For the farm to use all models in that case, the Railway gateway must have every provider API key available: either in **Supabase Vault** (`env/clawdbot/<KEY>`) or in **Railway** → your service → **Variables**.

## Checklist (LLM providers in `config/railway-openclaw.json`)

| Env key | Provider | In Vault or Railway? |
|--------|----------|------------------------|
| `GROQ_API_KEY` | Groq (primary) | ☐ |
| `CEREBRAS_API_KEY` | Cerebras | ☐ |
| `GEMINI_API_KEY` | Gemini | ☐ |
| `OPENAI_API_KEY` | OpenAI | ☐ |
| `ANTHROPIC_API_KEY` | Anthropic | ☐ |
| `OPENROUTER_API_KEY` | OpenRouter | ☐ |
| `TOGETHER_API_KEY` | Together | ☐ |
| `MISTRAL_API_KEY` | Mistral | ☐ |
| `COHERE_API_KEY` | Cohere | ☐ |
| `DEEPSEEK_API_KEY` | DeepSeek | ☐ |
| `HUGGINGFACE_API_KEY` | Hugging Face | ☐ |

## Required for Railway to reach Vault

| Env key | Set in Railway Variables |
|--------|---------------------------|
| `VAULT_SUPABASE_URL` | ☐ |
| `VAULT_SUPABASE_SERVICE_ROLE_KEY` | ☐ |
| `PORT` | ☐ (e.g. 3000) |

## Optional (gateway auth, etc.)

- `CLAWDBOT_GATEWAY_TOKEN` — so Edge can call the gateway (set in **Supabase Edge** secrets too).

## Sync to Railway from this repo

From repo root (with `railway link` to jarvis-gateway and `railway login`):

```bash
node scripts/railway-set-variables.js
```

This reads keys from `~/.clawdbot/.env` and Supabase Vault and sets them on the Railway service. Then run `railway redeploy -y` to apply. Alternatively, set `RAILWAY_TOKEN` to a **Project Token** (Railway → Project → Settings → Tokens) and the script will use the API instead of the CLI.

## How to add to Vault

From repo root, with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or `VAULT_SUPABASE_*`) in `~/.clawdbot/.env`:

```bash
node scripts/vault-set-secret.js OPENROUTER_API_KEY "your_key" "OpenRouter" --update
node scripts/vault-set-secret.js TOGETHER_API_KEY "your_key" "Together" --update
```

First time (no `--update`): same command without `--update`. If `--update` fails with "create_secret did not return id", set that key in **Railway** → Variables instead; the gateway will use it from `process.env`.

## See also

- [RUNBOOK.md](../RUNBOOK.md) — Auxiliary mode, "Farm uses all models when Mac is offline", Railway steps.
- [JARVIS_LLM_OPTIMIZED_ORDER.md](./JARVIS_LLM_OPTIMIZED_ORDER.md) — Primary and fallback order.
