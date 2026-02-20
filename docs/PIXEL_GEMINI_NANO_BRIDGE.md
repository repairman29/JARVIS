# Gemini Nano Bridge — OpenAI-Compatible Endpoint on the Pixel

**Goal:** Use **Gemini Nano** (Tensor G3, on-device via Android AICore) as an extra LLM endpoint for JARVIS, exposed as an **OpenAI-compatible** `/v1/chat/completions` API so the gateway or router can call it like any other adapter.

---

## Why a bridge?

- **AICore** (and ML Kit GenAI APIs) are **Android app APIs** (Java/Kotlin). Termux/Node/Python on the Pixel cannot call them directly.
- To use Gemini Nano from the JARVIS stack (Node gateway, adapters, router), we need a process that **talks to AICore** and **exposes HTTP** on localhost.

---

## Architecture

```
JARVIS gateway / router  →  HTTP localhost:8890  →  Android app (Gemini Nano bridge)
                                                          ↓
                                                    AICore / Gemini Nano
```

- The **bridge** is a small Android app (or a foreground service) that:
  - Binds **localhost:8890** (or another port).
  - Exposes **POST /v1/chat/completions** with a request/response shape compatible with OpenAI (or with the InferrLM adapter so the gateway can use the same client).
- **Termux** (gateway, router) runs on the same device and calls `http://127.0.0.1:8890/v1/chat/completions`. The app receives the request, calls AICore Generative Model (Gemini Nano), and returns the response in the expected format.

---

## API contract (OpenAI-compatible subset)

The bridge should accept:

**Request:** `POST /v1/chat/completions`  
Body (JSON):

- `model` (optional): e.g. `"gemini-nano"` (ignored; bridge always uses Nano).
- `messages`: array of `{ "role": "user"|"assistant"|"system", "content": "..." }`.
- `stream` (optional): if `true`, return SSE stream; else return single JSON object.
- `max_tokens` (optional): cap on output length.

**Response (non-stream):** JSON:

- `choices: [ { "message": { "role": "assistant", "content": "..." } } ]`

**Response (stream):** SSE with `data: {"choices":[{"delta":{"content":"..."}}]}` chunks, ending with `data: [DONE]`.

This matches what the JARVIS gateway and InferrLM adapter expect, so the bridge can be registered as a third adapter (e.g. port **8890**) and the router can route to it.

---

## Ready-made scaffold in this repo

A minimal Android app is in **jarvis-gemini-nano-bridge/**:

- **Build:** Open the folder in Android Studio, or `./gradlew assembleDebug` (after adding Gradle wrapper if needed).
- **Run:** Install on the Pixel, tap **Start bridge**; the app binds `127.0.0.1:8890` and serves `POST /v1/chat/completions`.
- **AICore:** Edit `GeminiNano.kt` and implement `complete(messages)` using your device’s SDK (ML Kit GenAI or AICore API). The scaffold returns a placeholder until you do.

See [jarvis-gemini-nano-bridge/README.md](../jarvis-gemini-nano-bridge/README.md) for build/run and JARVIS integration.

---

## How to build the bridge (from scratch)

**Option 1: Minimal Android app (recommended)**

- **Stack:** Kotlin + Jetpack Compose (or plain Activity). Use a small HTTP server in-process: **Ktor** or **NanoHTTPD** listening on `127.0.0.1:8890`.
- **AICore:** Use the **Generative AI SDK** or **ML Kit GenAI Prompt API** to send the concatenated conversation as a single prompt (or multi-turn if the API supports it) and stream/colllect the response.
- **Mapping:** Convert `messages` → single prompt (e.g. "System: ...\nUser: ...\nAssistant: ...") and then map the model output → `choices[0].message.content` or SSE deltas.
- **Lifecycle:** App must stay in foreground (or use a foreground service with a persistent notification) so the system doesn’t kill it. User can "minimize" the app; the server keeps listening.

**Option 2: Use or fork an existing project**

- **[GemBridge](https://github.com/JumpingKeyCaps/GemBridge)** and similar projects show Gemini integration patterns. If any project already exposes an HTTP API on localhost, it could be adapted to the contract above and used as the bridge.
- **gemini-cli** and similar tools are usually CLI-only; we need a **long-lived HTTP server** in an app.

**Option 3: ADB + helper app (hacky)**

- A small app that accepts intents (e.g. from Termux via `am start` with extras) with the prompt and writes the reply to a file; Termux polls or reads the file. This is more complex and slower than a direct HTTP server in the app; not recommended unless HTTP is impossible.

---

## Integrating with JARVIS on the Pixel

1. **Build and install** the bridge app on the Pixel; start the app (or its foreground service) so it listens on `127.0.0.1:8890`.
2. **Add a third adapter** (or point an existing port to the bridge):
   - Either run a thin **proxy** in Termux that forwards `http://127.0.0.1:8890` so the gateway can use `NEURAL_FARM_BASE_URL` or a dedicated adapter URL.
   - Or configure the **router** (18890) to include `http://127.0.0.1:8890/v1` as an upstream; route by model name (e.g. `gemini-nano`) or by task (e.g. simple Q&A → Nano, coding → InferrLM/cloud).
3. **Env (optional):** e.g. `JARVIS_GEMINI_NANO_URL=http://127.0.0.1:8890` in `~/.clawdbot/.env` and have `start-jarvis-pixel.sh` (or a small script) start the bridge app via `am start` if needed.

---

## Constraints and caveats

- **Device support:** Gemini Nano (AICore) is available on **Pixel 8+**, **Samsung S24+**, and other devices that ship with AICore. Check [Android AICore docs](https://developer.android.com/ai/gemini-nano).
- **Foreground:** The bridge must run as an app (or foreground service) so it is not killed in the background.
- **Latency:** On-device inference is typically &lt;100 ms per step; the HTTP hop is negligible. Good for quick, local, PII-sensitive or offline tasks.

---

## Summary

| Item | Description |
|------|-------------|
| **What** | Android app that exposes Gemini Nano as `POST /v1/chat/completions` on localhost. |
| **Where** | Runs on the Pixel; Termux gateway/router call `http://127.0.0.1:8890`. |
| **How** | Kotlin/Compose + Ktor/NanoHTTPD + AICore/GenAI API; map messages ↔ prompt and response ↔ OpenAI format. |
| **JARVIS** | Register as third LLM (e.g. 8890) or add to router; use for simple/local/offline tasks. |

**See also:** [SOVEREIGN_MOBILE_NEXUS.md](./SOVEREIGN_MOBILE_NEXUS.md) (§ Mind: hybrid intelligence), [PIXEL_PERFECTION_ROADMAP.md](./PIXEL_PERFECTION_ROADMAP.md) (Gemini Nano bridge item), [start-jarvis-pixel.sh](../scripts/start-jarvis-pixel.sh) (adapter ports 8888, 8887, router 18890).
