# LiteLLM vs InferrLM on the Pixel — who does what

Short answer: **InferrLM runs the models.** LiteLLM is an optional **proxy** in front of the adapter; it doesn’t run any model itself.

---

## Roles

| Component | Port | Role |
|-----------|------|------|
| **InferrLM** (Android app) | **8889** | **Runs the actual model** (Gemma 1B/4B, etc.). You load a GGUF in the app and turn Server ON. This is the only place inference happens. |
| **Adapter** (inferrlm_adapter.py) | **8888** | Wraps InferrLM’s API into **OpenAI-compatible** `/v1/chat/completions`. The gateway (and anything else) talks to this. |
| **LiteLLM proxy** | **4000** | Optional **router**. Reads a config (e.g. `config-termux.yaml` in neural-farm) and forwards requests to one or more backends—e.g. to the adapter at 8888. Does **not** run models. |
| **Gateway** (Clawdbot) | **18789** | JARVIS agent. Calls the “farm” for LLM: either **4000** (if LiteLLM is up) or **8888** (if LiteLLM is not installed). |

So: **models live only in InferrLM.** LiteLLM is just a configurable proxy in front of the adapter.

---

## Request flow

**With LiteLLM (proxy on 4000):**

```
Gateway (18789) → LiteLLM (4000) → [config says "use 8888"] → Adapter (8888) → InferrLM (8889) → model runs
```

**Without LiteLLM (gateway talks to adapter directly):**

```
Gateway (18789) → Adapter (8888) → InferrLM (8889) → model runs
```

In both cases the **same model** runs in InferrLM. The only difference is whether the gateway uses the proxy (4000) or the adapter (8888) as the base URL.

---

## “Using LiteLLM with these models”

- You **don’t** run Gemma 1B/4B inside LiteLLM. You run them in **InferrLM** (load the GGUF in the app).
- **Using LiteLLM** with those models means:
  1. InferrLM is running with a model loaded (8889), adapter is up (8888).
  2. LiteLLM is running with a config that points at `http://127.0.0.1:8888` (the adapter) for the model(s) you care about.
  3. Gateway (or Cursor, etc.) uses `NEURAL_FARM_BASE_URL=http://127.0.0.1:4000/v1` so traffic goes through LiteLLM.

LiteLLM’s config (in **neural-farm**, e.g. `config-termux.yaml`) typically has a model entry like:

```yaml
# Example idea (actual file lives in neural-farm repo)
model_list:
  - model_name: gpt-4o-mini   # or openclaw:main, etc.
    litellm_params:
      openai_api_base: http://127.0.0.1:8888
      api_key: sk-local-farm
```

So “this model” in LiteLLM is just a name; the **real** model is whatever is loaded in InferrLM at 8889.

---

## When to use which

| Goal | Use |
|------|-----|
| **Run Gemma / Granite / etc. on the device** | InferrLM only: load GGUF in the app, Server ON. No LiteLLM required. |
| **Gateway talks to InferrLM** | Adapter (8888) is enough. Set `NEURAL_FARM_BASE_URL=http://127.0.0.1:8888/v1` if LiteLLM is not used. |
| **One endpoint for multiple backends** (e.g. adapter + cloud) | Run LiteLLM (4000), config routes by model name to 8888 and/or other APIs. Gateway points at 4000. |
| **Cursor/other tools with “Override Base URL”** | Point at **4000** (LiteLLM) or **8888** (adapter). Both speak OpenAI; the model that answers is still the one in InferrLM when the request is routed to 8888. |

---

## Summary

- **InferrLM** = where Pixel models (Gemma 1B/4B, etc.) **run** (port 8889).
- **Adapter (8888)** = OpenAI-compatible front for InferrLM; gateway can use this directly.
- **LiteLLM (4000)** = optional proxy that **forwards** to 8888 (and others); it does **not** run the models. “Using LiteLLM with these models” means routing through LiteLLM to the adapter, which talks to InferrLM.

See [PIXEL_LLM_MODEL_GUIDE.md](./PIXEL_LLM_MODEL_GUIDE.md) for which InferrLM model to load for chat vs tasks, and [PIXEL_INFERRLM_MODEL_INSTALL.md](./PIXEL_INFERRLM_MODEL_INSTALL.md) for putting a GGUF on the device.
