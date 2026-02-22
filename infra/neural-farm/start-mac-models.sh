#!/bin/bash
# Start Mac LLM node: Qwen 3 8B via Apple MLX with speculative decoding
# Optimized for M4 (24GB) — MLX Metal GPU + 0.6B draft model
# Swap to 14B: ./swap-mac-model.sh 14b

MLX_ENV="/Users/jeffadkins/mlx-env"
MODEL="mlx-community/Qwen3-8B-4bit"
DRAFT="mlx-community/Qwen3-0.6B-4bit"
PORT=8890
LOG="/Users/jeffadkins/mlx-server.log"

check_port() { curl -s --max-time 2 "http://127.0.0.1:$1/v1/models" 2>/dev/null | grep -q model; }

echo "=== Mac Model Startup (MLX + Speculative Decoding) ==="

if check_port $PORT; then
  echo "[OK] MLX server already running on :$PORT"
  curl -s "http://127.0.0.1:$PORT/v1/models" | python3 -c "
import json,sys
d=json.load(sys.stdin)
for m in d.get('data',[]):
  print(f'  Model: {m[\"id\"]}')
" 2>/dev/null
else
  pkill -f llama-server 2>/dev/null
  pkill -f mlx_lm.server 2>/dev/null
  sleep 1

  echo "[..] Starting Qwen 3 8B + 0.6B draft via MLX (port $PORT)..."
  source "$MLX_ENV/bin/activate"
  nohup mlx_lm.server \
    --model "$MODEL" \
    --draft-model "$DRAFT" \
    --num-draft-tokens 4 \
    --chat-template-args '{"enable_thinking":false}' \
    --decode-concurrency 2 \
    --prompt-concurrency 2 \
    --port $PORT \
    --host 127.0.0.1 \
    --max-tokens 2048 \
    > "$LOG" 2>&1 &
  echo "  PID: $!"

  for i in $(seq 1 30); do
    sleep 2
    if check_port $PORT; then
      echo "[OK] Qwen 3 8B ready (MLX Metal GPU, spec decode, ~35+ tok/s)"
      break
    fi
    [ $i -eq 30 ] && echo "[!!] MLX server failed to start — check $LOG"
  done
fi

echo ""
echo "=== Mac Node ==="
echo "  Engine:  MLX (Apple Metal native) + speculative decoding"
echo "  Model:   Qwen 3 8B 4-bit ($MODEL)"
echo "  Draft:   Qwen 3 0.6B 4-bit ($DRAFT)"
echo "  Port:    http://127.0.0.1:$PORT"
echo "  API:     OpenAI-compatible (/v1/chat/completions)"
echo "  Swap to: ./swap-mac-model.sh [8b|14b]"
echo "  Log:     $LOG"
