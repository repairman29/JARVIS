# Pixel dual LLM backend (Option B): Pixel + iPhone InferrLM

When the Pixel and your iPhone are on the same network, you can run **two InferrLM backends**: the Pixel’s local InferrLM (port 8889) and the iPhone’s InferrLM (`http://<iphone-ip>:8889`). The JARVIS gateway on the Pixel then uses a small **LLM router** that forwards chat requests to either backend (with fallback if one fails).

## Flow

- **Gateway (18789)** → **LLM router (18890)** → **Pixel adapter (8888)** or **iPhone adapter (8887)**
- Adapter 8888 → Pixel InferrLM at `127.0.0.1:8889`
- Adapter 8887 → iPhone InferrLM at `http://<iphone-ip>:8889` (InferrLM’s native port; adapter translates OpenAI ↔ InferrLM)

## Setup

1. **On the iPhone:** Run InferrLM with **Server ON** (port 8889). Ensure the iPhone and Pixel are on the **same Wi‑Fi** (or otherwise reachable).

2. **On the Pixel:** In Termux, set the iPhone backend URL in `~/.clawdbot/.env`:

   ```bash
   echo "JARVIS_IPHONE_LLM_URL=http://192.168.1.100:8889" >> ~/.clawdbot/.env
   ```

   Replace `192.168.1.100` with your iPhone’s IP (find it in iPhone Wi‑Fi settings or from your router).

3. **Start JARVIS** so it brings up both adapters and the router:

   ```bash
   bash ~/JARVIS/scripts/start-jarvis-pixel.sh
   ```

   The script will:
   - Start the Pixel adapter (8888 → local 8889).
   - Start the iPhone adapter (8887 → `JARVIS_IPHONE_LLM_URL`).
   - Start the LLM router (18890).
   - Set `NEURAL_FARM_BASE_URL=http://127.0.0.1:18890/v1` and run `set-primary-neural-farm.js` so the gateway uses the router.

## Routing

- **Round-robin (default):** Requests alternate between Pixel (8888), iPhone (8887), and optional Gemini Nano (8890). Set `PIXEL_LLM_ROUTE=round-robin` or leave unset.
- **Chat vs. task:** Prefer fast backend (e.g. Nano) for short chat, primary (InferrLM) for tasks. Set `PIXEL_LLM_ROUTE=chat-task` and `PIXEL_LLM_TERTIARY=http://127.0.0.1:8890`. See [PIXEL_LLM_SPEED_AND_PRIORITY.md](./PIXEL_LLM_SPEED_AND_PRIORITY.md).
- **By model:** Send a model name containing `iphone`/`secondary` or `gemini`/`nano` to pick a backend. Set `PIXEL_LLM_ROUTE=model`.
- **Primary only with fallback:** Prefer one backend; try others on failure. Set `PIXEL_LLM_ROUTE=primary`.

Optional env (in `~/.clawdbot/.env` or before starting the script):

| Env | Default | Description |
|-----|--------|-------------|
| `JARVIS_IPHONE_LLM_URL` | (unset) | iPhone InferrLM base URL, e.g. `http://192.168.1.100:8889`. When set, dual-backend and router are enabled. |
| `PIXEL_LLM_ROUTER_PORT` | 18890 | Router listen port. |
| `PIXEL_LLM_ROUTE` | round-robin | `round-robin` \| `model` \| `primary` \| `chat-task`. |
| `PIXEL_LLM_TERTIARY` | (unset) | Optional Gemini Nano bridge URL, e.g. `http://127.0.0.1:8890`. When set, included in round-robin and used for `chat-task` chat. |
| `PIXEL_LLM_PRIMARY_CHAT_MODEL` | (unset) | When forwarding a chat request to primary (InferrLM), set request body `model` to this. Use if InferrLM API supports per-request model. |
| `PIXEL_LLM_PRIMARY_TASK_MODEL` | (unset) | When forwarding a task request to primary, set request body `model` to this. Lets you target a specific InferrLM model for tasks if the API honors the field. |
| `PIXEL_LLM_ROUTER_TIMEOUT_MS` | 120000 | Request timeout to each backend (ms). |

## Disabling the iPhone backend

Remove or comment out `JARVIS_IPHONE_LLM_URL` in `~/.clawdbot/.env`, then restart:

```bash
bash ~/JARVIS/scripts/start-jarvis-pixel.sh
```

The gateway will keep using whatever single backend you had before (e.g. adapter 8888 or proxy 4000); you may need to set `NEURAL_FARM_BASE_URL=http://127.0.0.1:8888/v1` again if you had pointed it at the router.

## Logs

- Router: `tail -f ~/llm-router.log`
- iPhone adapter: `tail -f ~/adapter-iphone.log`
- Pixel adapter: `tail -f ~/adapter.log`

If the router or iPhone adapter fail, the gateway will still work using the Pixel adapter (and vice versa) as long as at least one backend is up.
