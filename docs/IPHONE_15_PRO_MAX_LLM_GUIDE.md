# Best/fastest LLM on iPhone 15 Pro Max for JARVIS

Your **iPhone 15 Pro Max** is already a Neural Farm node: InferrLM on port **8889**, reachable via Tailscale. JARVIS outsources tasks to it through the farm balancer. This doc answers: **what is the best/fastest model to run on it?**

---

## TL;DR

| Goal | Recommendation |
|------|----------------|
| **Fastest** | **Gemma 3 1B** (Q4_K_M) in InferrLM — ~30–40 tok/s on A17 Pro, lowest latency. |
| **Best balance (speed + quality)** | **Llama 3.2 3B** (current) or **Qwen 2.5 3B** (Q4_K_M) — 10–20 tok/s, better for coding/reasoning. |
| **No app management** | **Local LLM Server** (App Store) — Apple Intelligence, OpenAI-compatible API; add as separate provider if you want. |

---

## Current setup

- **Node:** `iphone15` in `infra/neural-farm/farm-balancer.js` (host `100.102.220.122`, port 8889).
- **Engine:** InferrLM (OpenAI-compatible `/v1/chat/completions`).
- **Current model (per README):** Llama 3.2 3B Q4_K_M.

No code changes are required to “use” the iPhone — the balancer already routes simple/primary-tier requests to it. You only choose **which model is loaded inside InferrLM** on the device.

---

## Fastest: 1B models (InferrLM)

On A17 Pro, **1B-parameter models** give the highest tokens/second and lowest first-token latency:

| Model | Approx speed (A17 Pro) | Use case |
|-------|------------------------|----------|
| **Gemma 3 1B** (Q4_K_M) | ~30–40 tok/s | Fast chat, simple Q&A, quick agent replies. |
| **Llama 3.2 1B** (Q4_K_M) | ~20–30 tok/s | General purpose, good balance. |
| **Granite 4.0 Helper 1B** | Fast | Edge/agentic, tool-calling. |

**How to switch:** In the **InferrLM** app on the iPhone, download or load one of these GGUF models (e.g. Gemma 3 1B Q4_K_M), set it as the active model, and leave the API server **ON** on port 8889. The farm balancer keeps using the same endpoint; it doesn’t care which model is loaded.

**Getting the model on iPhone:** Use InferrLM’s in-app model browser/download if available, or download the GGUF on a computer and transfer to the iPhone (e.g. AirDrop to Files, then open in InferrLM). Model names on Hugging Face (examples): `gemma-3-1b-it-*Q4_K_M*.gguf`, `Llama-3.2-1B-Instruct-*Q4_K_M*.gguf`.

---

## Best balance: 3B models (current tier)

Keeping a **3B** model improves quality for coding and reasoning at the cost of speed:

- **Llama 3.2 3B** (current) — 10–20 tok/s.
- **Qwen 2.5 3B** (Q4_K_M) — similar speed, strong instruction-following.

Stick with 3B if you want the iPhone node to handle slightly harder tasks without going to the Mac “smart” tier.

---

## Alternative: Local LLM Server (Apple Intelligence)

If you prefer **not** to manage models in InferrLM:

- **Local LLM Server** (App Store) uses **Apple Intelligence** (~3B on-device), exposes **OpenAI-compatible** and **Ollama-compatible** APIs on the device.
- Requires supported OS (e.g. iOS 18.1+ with Apple Intelligence; app listing may say iOS 26 for a future version).
- You’d run it **instead of or alongside** InferrLM: ensure the app is reachable on the network (same Wi‑Fi or Tailscale), note the IP and port, then either:
  - Add it as a **separate provider** in `~/.clawdbot/clawdbot.json` (see [JARVIS_FREE_AND_OWN_LLMS.md](./JARVIS_FREE_AND_OWN_LLMS.md)), or
  - Add a **new node** in `infra/neural-farm/farm-balancer.js` pointing at the iPhone’s Tailscale IP and the app’s port.

Trade-off: zero model management and one less app (InferrLM), but you’re fixed to Apple’s model and dependent on that app’s availability.

---

## Alternative: ai.local (Ollama-style)

**ai.local** (Bruno Wernimont) runs local LLMs on iOS with an **Ollama-style API**. If it exposes HTTP on the **network** (not only localhost), you can add it as a provider or farm node the same way as Local LLM Server — point the gateway or balancer at `http://<iphone-tailscale-ip>:<port>`.

---

## JARVIS integration (recap)

- **Today:** JARVIS already outsources to the iPhone 15 Pro Max via the **Neural Farm** balancer. Edge (or UI) → Tailscale Funnel → farm balancer → primary tier → **iphone15** (InferrLM :8889).
- **To go faster:** Load **Gemma 3 1B** (or another 1B) in InferrLM on the iPhone; no config change.
- **To use Apple Intelligence or ai.local:** Expose the app’s API on the network, then add it as a provider or new farm node with the same `/v1/chat/completions` contract.

---

## References

- [infra/neural-farm/README.md](../infra/neural-farm/README.md) — Farm layout, nodes, routing.
- [JARVIS_FREE_AND_OWN_LLMS.md](./JARVIS_FREE_AND_OWN_LLMS.md) — Adding OpenAI-compatible providers.
- [PIXEL_LLM_MODEL_GUIDE.md](./PIXEL_LLM_MODEL_GUIDE.md) — Model roles (chat vs tasks); same 1B/3B/4B logic applies to iPhone.
