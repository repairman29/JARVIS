# Pixel LLM speed test and chat vs. task priority

Measure backend latency and choose which model JARVIS uses for **talking to you** (chat) vs. **doing tasks** (plan-execute, skills, tool use).

---

## Speed test

The script hits each LLM backend with a small completion request and reports latency (ms). **Run it on the Pixel** (Termux) so `127.0.0.1` is local.

**On the Pixel (Termux):**
```bash
cd ~/JARVIS && node scripts/pixel-llm-speed-test.js
```

**From your Mac (via SSH):**
```bash
ssh -p 8022 u0_a310@<pixel-ip> "cd ~/JARVIS && node scripts/pixel-llm-speed-test.js"
```

Replace `<pixel-ip>` with the Pixel’s IP (e.g. `192.168.86.209`). Ensure the JARVIS stack and any backends you care about (InferrLM adapter 8888, iPhone adapter 8887, Gemini Nano bridge 8890) are running before you test.

**Options:**

| Env | Default | Description |
|-----|--------|-------------|
| `PIXEL_LLM_SPEED_ITERATIONS` | 2 | Number of requests per backend (higher = smoother average). |

Example output:
```
Pixel LLM speed test (run on Pixel; each backend 2 request(s))

  Pixel InferrLM (8888) ... 420 ms avg (min 380 max 460)
  iPhone adapter (8887) ... failed: connect ECONNREFUSED
  Gemini Nano (8890) ... 180 ms avg (min 170 max 190)

  Fastest for simple reply: Gemini Nano (8890) (180 ms)
```

Use the **fastest** backend for low-latency chat when possible; use the **most capable** (e.g. InferrLM) for tasks that need reasoning or tools.

---

## Prioritizing chat vs. tasks

The **LLM router** (port 18890) decides which backend gets each request. You can prioritize:

- **Talking to you (chat):** short back-and-forth, no tools → prefer **fast** (e.g. Gemini Nano).
- **Doing tasks:** plan-execute, skills, tool_calls → prefer **capable** (e.g. Pixel InferrLM).

### Option 1: `chat-task` routing (recommended)

Route **chat** to the fast backend (e.g. Nano) and **tasks** to the primary (e.g. InferrLM). The router treats a request as “chat” when:

- Few messages (≤ 4) in the request, and  
- No `tools` and no `tool_calls` in the last message.

Otherwise it’s treated as a task and sent to primary.

**On the Pixel**, set before starting the stack (e.g. in `~/.clawdbot/.env` or in the script that starts the router):

```bash
export PIXEL_LLM_TERTIARY=http://127.0.0.1:8890   # Gemini Nano bridge
export PIXEL_LLM_ROUTE=chat-task
```

Then restart the router (or run `start-jarvis-pixel.sh` with `JARVIS_GEMINI_NANO_BRIDGE=1`). Ensure the **JARVIS Gemini Bridge** app is running and showing “Listening” so 8890 is up.

Result: simple chat (Mac or Pixel UI) → Nano when available; plan-execute and tool-using turns → InferrLM (8888).

### Option 2: Primary only (single backend)

Use one backend for everything. Set:

```bash
export PIXEL_LLM_ROUTE=primary
export PIXEL_LLM_PRIMARY=http://127.0.0.1:8888   # or 8890 if you want everything on Nano
```

Use **8888** for best capability (InferrLM); use **8890** for best speed (Nano) if you don’t need tools for that flow.

### Option 3: Round-robin

Spread load across all backends (no chat vs. task split). Default:

```bash
export PIXEL_LLM_ROUTE=round-robin
```

### Option 4: By model name

Send a specific model name to pick a backend. Set `PIXEL_LLM_ROUTE=model`. Then:

- Model name containing `gemini` or `nano` → tertiary (8890).
- Model name containing `iphone` or `secondary` → secondary (8887).
- Otherwise → primary (8888).

The chat server and gateway usually send `openclaw:main`, so this is only useful if you add a path that sends a different model for “fast” chat.

---

## InferrLM: multiple models, one default

InferrLM can load several models, but the **app only has one "default" model** at a time. You can still get different behavior for chat vs. tasks:

1. **Use chat–task routing (recommended)**  
   Set `PIXEL_LLM_ROUTE=chat-task` and `PIXEL_LLM_TERTIARY=http://127.0.0.1:8890`.  
   - **Chat** → Gemini Nano (8890), so InferrLM's default doesn't matter for quick replies.  
   - **Tasks** → primary (8888) = InferrLM. Set the **default model in the InferrLM app** to the model you want for tasks (e.g. the larger or more capable one).

2. **Try per-request model (if InferrLM supports it)**  
   Some OpenAI-style APIs accept a `model` field in the request body. If InferrLM's server does that, set:
   - `PIXEL_LLM_PRIMARY_CHAT_MODEL` — model name for chat when sent to primary (e.g. fallback when Nano is down).
   - `PIXEL_LLM_PRIMARY_TASK_MODEL` — model name for task requests to InferrLM.  
   The router overwrites the request body `model` when forwarding to primary (8888). Use the exact model IDs InferrLM exposes. If InferrLM ignores the field, only the app default applies.

3. **Single backend**  
   If you don't use Nano, set InferrLM's default in the app to the model you want JARVIS to use for everything.

---

## Summary

| Goal | Set |
|------|-----|
| **Test backend speeds** | Run `node scripts/pixel-llm-speed-test.js` on the Pixel (or via SSH from Mac). |
| **Chat = fast, tasks = capable** | `PIXEL_LLM_ROUTE=chat-task` and `PIXEL_LLM_TERTIARY=http://127.0.0.1:8890`; bridge app running. |
| **Everything on one backend** | `PIXEL_LLM_ROUTE=primary` and `PIXEL_LLM_PRIMARY` to the desired URL. |
| **Spread load** | `PIXEL_LLM_ROUTE=round-robin` (default). |
| **InferrLM: different model for tasks** | Set default in InferrLM app to your task model; use chat-task so chat → Nano. Optionally set `PIXEL_LLM_PRIMARY_TASK_MODEL` (and `PIXEL_LLM_PRIMARY_CHAT_MODEL`) if InferrLM’s API honors the `model` field. |

See [PIXEL_LLM_MODEL_GUIDE.md](./PIXEL_LLM_MODEL_GUIDE.md) for what each model is best for and recommended JARVIS mapping, [PIXEL_DUAL_LLM_BACKEND.md](./PIXEL_DUAL_LLM_BACKEND.md) for router env vars, and [PIXEL_GEMINI_NANO_BRIDGE.md](./PIXEL_GEMINI_NANO_BRIDGE.md) for the Nano bridge.
