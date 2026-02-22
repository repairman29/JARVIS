# Neural Farm v4 — Local AI Inference Cluster

> 4-node heterogeneous LLM cluster powering JARVIS "free tier" AI operations.
> Mac (MLX) + Pixel (llama.cpp) + 2x iPhone (InferrLM) → smart load balancer → Tailscale Funnel → Supabase Edge Functions → JARVIS UI

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              JARVIS UI                   │
                    │         (Vercel / Next.js)               │
                    └──────────────┬──────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────┐
                    │       Supabase Edge Functions            │
                    │  model_hint: "free" → Neural Farm       │
                    └──────────────┬──────────────────────────┘
                                   │ HTTPS
                    ┌──────────────▼──────────────────────────┐
                    │       Tailscale Funnel (permanent)       │
                    │  jeffs-macbook-air.tail047a68.ts.net     │
                    └──────────────┬──────────────────────────┘
                                   │ :443 → :8899
         ┌─────────────────────────▼─────────────────────────┐
         │            farm-balancer.js (Node.js)              │
         │         http://localhost:8899                       │
         │   Smart routing · Streaming · Failover · Monitor   │
         └──┬──────────┬──────────┬──────────┬───────────────┘
            │          │          │          │
   ┌────────▼───┐ ┌───▼──────┐ ┌▼────────┐ ┌▼─────────────┐
   │  Mac (M4)  │ │  Pixel   │ │iPhone 15│ │  iPhone 16   │
   │  MLX       │ │llama.cpp │ │InferrLM │ │  InferrLM    │
   │  Qwen3 8B  │ │Qwen2.5  │ │Llama3.2 │ │  Qwen3 4B    │
   │  :8890     │ │3B :8889  │ │3B :8889 │ │  :8889       │
   │  SMART     │ │ PRIMARY  │ │ PRIMARY │ │  PRIMARY     │
   │  2 slots   │ │ 2 slots  │ │ 1 slot  │ │  1 slot      │
   └────────────┘ └──────────┘ └─────────┘ └──────────────┘
```

## Nodes

| Node | Device | IP (Tailscale) | Port | Engine | Model | Tier | Slots |
|------|--------|----------------|------|--------|-------|------|-------|
| mac | MacBook Air M4 (24GB) | 127.0.0.1 | 8890 | MLX (Metal GPU) | Qwen 3 8B 4-bit | smart | 2 |
| pixel | Pixel 8 Pro | 100.75.3.115 | 8889 | llama.cpp | Qwen 2.5 3B Q4_K_M | primary | 2 |
| iphone15 | iPhone 15 Pro Max | 100.102.220.122 | 8889 | InferrLM | Llama 3.2 3B Q4_K_M | primary | 1 |
| iphone16 | iPhone 16 Pro | 100.91.240.55 | 8889 | InferrLM | Qwen 3 4B Q4_K_M | primary | 1 |

**Total: 6 concurrent slots across 4 devices**

## Smart Routing

The balancer classifies incoming queries by complexity:

| Complexity | Trigger | Routes to |
|------------|---------|-----------|
| **simple** | Short messages, no keywords | Primary tier (phones/pixel) |
| **medium** | Contains "explain", "write", "code", etc. | Smart tier (Mac) |
| **complex** | Contains "analyze", "compare" + long content | Smart tier (Mac) |

Thinking mode is disabled natively via MLX `--chat-template-args '{"enable_thinking":false}'`. The balancer also strips any `<think>...</think>` tags that leak through from InferrLM nodes.

When all 6 slots are busy, incoming requests are **queued** (up to 10, 60s timeout) and dispatched as slots free up.

## Mac Optimizations

The M4 Mac runs several optimizations:

- **Apple MLX** — native Metal GPU framework, faster than llama.cpp on Apple Silicon
- **Speculative decoding** — 0.6B draft model proposes tokens, 8B verifies batches (1.5-3x speedup)
- **Concurrent decoding** — 2 requests decoded in parallel
- **Concurrent prompts** — 2 prompts processed in parallel
- **Thinking disabled** — native Qwen 3 `enable_thinking: false` flag, no token waste

### Model Swap

Switch between 8B (default, fast) and 14B (max quality, slower) on the fly:

```bash
./swap-mac-model.sh status   # show current model
./swap-mac-model.sh 8b       # switch to Qwen 3 8B (default, ~5GB)
./swap-mac-model.sh 14b      # switch to Qwen 3 14B (~8.5GB, first run downloads)
```

## Files

| File | Purpose |
|------|---------|
| `/Users/jeffadkins/farm-balancer.js` | Load balancer — routing, streaming, queuing, health checks, monitoring |
| `/Users/jeffadkins/start-mac-models.sh` | Starts MLX server with Qwen 3 8B + speculative decoding on port 8890 |
| `/Users/jeffadkins/swap-mac-model.sh` | Swap between 8B and 14B models on the fly |
| `/Users/jeffadkins/start-pixel-farm-tunnel.sh` | Master manager — starts Mac models, balancer, Tailscale Funnel, monitors Pixel |
| `~/Library/LaunchAgents/com.jarvis.pixel-farm.plist` | launchd agent — auto-starts the farm manager on login |

### Logs

| Log | Contents |
|-----|----------|
| `/Users/jeffadkins/mlx-server.log` | MLX server output |
| `/Users/jeffadkins/farm-balancer.log` | Balancer routing and health check logs |
| `/Users/jeffadkins/pixel-farm-tunnel.log` | Farm manager output |

## Quick Start

### Start everything (normal operation)

The farm manager handles it all — MLX, balancer, Pixel monitoring, and Tailscale Funnel:

```bash
bash /Users/jeffadkins/start-pixel-farm-tunnel.sh
```

Or it starts automatically on login via launchd (`com.jarvis.pixel-farm`).

### Start components individually

```bash
# 1. MLX server (Mac — Qwen 3 8B with speculative decoding)
bash /Users/jeffadkins/start-mac-models.sh

# 2. Load balancer
node /Users/jeffadkins/farm-balancer.js

# 3. Tailscale Funnel
tailscale serve --bg http://localhost:8899
tailscale funnel --bg --https=443 http://localhost:8899
```

Full manual MLX command (if you need to customize):

```bash
source /Users/jeffadkins/mlx-env/bin/activate
mlx_lm.server \
  --model mlx-community/Qwen3-8B-4bit \
  --draft-model mlx-community/Qwen3-0.6B-4bit \
  --num-draft-tokens 4 \
  --chat-template-args '{"enable_thinking":false}' \
  --decode-concurrency 2 --prompt-concurrency 2 \
  --port 8890 --host 127.0.0.1 --max-tokens 2048
```

### Pixel startup (runs on the Pixel via Termux)

```bash
ssh -p 8022 100.75.3.115
bash ~/start-farm.sh
```

### iPhone startup

Open **InferrLM** on each iPhone → ensure model is loaded → enable API server on port **8889**. Keep InferrLM in the foreground (iOS kills background servers).

### iPhone keep-alive tips

iOS aggressively kills background network servers. To maximize uptime:

1. **Auto-Lock: Never** — Settings → Display & Brightness → Auto-Lock → Never
2. **Low Power Mode: Off** — it throttles background networking
3. **Guided Access** (optional) — triple-click Side Button to lock InferrLM in foreground
4. **iOS Shortcut automation** — create an automation:
   - Trigger: "When [InferrLM] is closed"
   - Action: "Open App → InferrLM"
   - This auto-reopens InferrLM if iOS kills it
5. **Plug in** — keep both iPhones charging to prevent battery-saver throttling

The balancer auto-detects when iPhones drop and routes around them. They'll reconnect within 30s of InferrLM becoming active again.

## API

### Chat completion (OpenAI-compatible)

```bash
curl -X POST https://jeffs-macbook-air.tail047a68.ts.net/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 200,
    "stream": false
  }'
```

### Health check

```bash
curl https://jeffs-macbook-air.tail047a68.ts.net/health
```

Returns per-node status, models, busy slots, request counts, latency, uptime.

### List models

```bash
curl https://jeffs-macbook-air.tail047a68.ts.net/v1/models
```

## Monitoring

The JARVIS dashboard at `/dashboard` shows real-time farm status (fetched from `/api/farm`), including:
- Per-node health, tier, models, busy/parallel slots
- Request counts, error rates, average latency
- Uptime per node

## Troubleshooting

| Problem | Fix |
|---------|-----|
| iPhone node goes DOWN | Open InferrLM, check API server is on, keep app in foreground, set Auto-Lock to Never |
| Pixel node goes DOWN | SSH in (`ssh -p 8022 100.75.3.115`), run `bash ~/start-farm.sh` |
| Mac MLX not responding | Check `ps aux \| grep mlx`, restart with `start-mac-models.sh` |
| Balancer not routing | `curl localhost:8899/health` — check node statuses, restart with `node farm-balancer.js` |
| Funnel not reachable | `tailscale funnel status` — re-run `tailscale funnel --bg --https=443 http://localhost:8899` |
| Slow Mac responses | Thinking should be disabled natively; check `--chat-template-args` in startup. Restart MLX: `bash start-mac-models.sh` |
| All nodes busy | Requests now queue automatically (up to 10). Check queue depth: `curl localhost:8899/health \| jq .queued` |
| Want smarter answers | Swap to 14B: `./swap-mac-model.sh 14b` (uses more RAM, slower but higher quality) |
| Want faster answers | Swap to 8B: `./swap-mac-model.sh 8b` (default, best speed/quality balance) |

## Models on Disk (Mac)

```
/Users/jeffadkins/models/
├── Qwen2.5-3B-Instruct-Q4_K_M.gguf          (2.0 GB) — Pixel model, Mac backup
├── Qwen2.5-0.5B-Instruct-Q8_0.gguf          (644 MB) — Pixel draft model (tested, reverted)
├── qwen2.5-14b-instruct-q4_k_m-*.gguf       (8.4 GB) — GGUF format, legacy

~/.cache/huggingface/hub/
├── mlx-community/Qwen3-8B-4bit/              (~5 GB) — Active Mac model
├── mlx-community/Qwen3-0.6B-4bit/            (~400 MB) — Draft model for speculative decoding
└── mlx-community/Qwen3-14B-4bit/             (~8.5 GB) — Downloaded on first `swap-mac-model.sh 14b`
```

## Network (Tailscale)

| Device | Tailscale IP | Hostname |
|--------|-------------|----------|
| Mac | 100.89.67.76 | jeffs-macbook-air |
| Pixel 8 Pro | 100.75.3.115 | pixel-8-pro |
| iPhone 15 Pro Max | 100.102.220.122 | iphone-15-pro-max |
| iPhone 16 Pro | 100.91.240.55 | iphone171 |

Public URL: `https://jeffs-macbook-air.tail047a68.ts.net`

## History

- **v1**: Single Pixel node with ngrok tunnel
- **v2**: Added iPhone 15, streaming support, model discovery
- **v3**: Added Mac M4 with llama.cpp (Qwen 2.5 3B), Tailscale Funnel, monitoring dashboard
- **v4**: Upgraded Mac to MLX + Qwen 3 8B, added iPhone 16 Pro, smart routing (simple→phones, complex→Mac), think-tag stripping
- **v4.1**: Speculative decoding (3x speedup), native thinking disable, request queuing, model swap script (8B↔14B), concurrent decode/prompt, cleaned stale launchd agents, Supabase secret verified
