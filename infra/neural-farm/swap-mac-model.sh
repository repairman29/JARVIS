#!/bin/bash
# Swap the Mac MLX model between 8B (default) and 14B (max quality)
# Usage: ./swap-mac-model.sh [8b|14b|status]
#
# The 14B uses ~8.5GB RAM — only use when you're NOT running heavy apps.
# The 8B uses ~5GB RAM and is the safe default.

MLX_ENV="/Users/jeffadkins/mlx-env"
PORT=8890
LOG="/Users/jeffadkins/mlx-server.log"

MODEL_8B="mlx-community/Qwen3-8B-4bit"
DRAFT_8B="mlx-community/Qwen3-0.6B-4bit"

MODEL_14B="mlx-community/Qwen3-14B-4bit"
DRAFT_14B="mlx-community/Qwen3-0.6B-4bit"

get_current() {
  curl -s --max-time 3 "http://127.0.0.1:$PORT/v1/models" 2>/dev/null | \
    python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data'][0]['id'])" 2>/dev/null
}

start_model() {
  local MODEL="$1"
  local DRAFT="$2"
  local LABEL="$3"

  echo "Stopping current MLX server..."
  pkill -f mlx_lm.server 2>/dev/null
  sleep 3

  echo "Starting $LABEL..."
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

  echo "PID: $!"
  for i in $(seq 1 40); do
    sleep 2
    if curl -s --max-time 2 "http://127.0.0.1:$PORT/v1/models" 2>/dev/null | grep -q model; then
      echo "Ready: $(get_current)"
      return 0
    fi
    [ $i -eq 40 ] && echo "Failed to start — check $LOG" && return 1
  done
}

case "${1:-status}" in
  8b|8B)
    CURRENT=$(get_current)
    if echo "$CURRENT" | grep -qi "8B"; then
      echo "Already running 8B: $CURRENT"
      exit 0
    fi
    start_model "$MODEL_8B" "$DRAFT_8B" "Qwen 3 8B (default — fast, ~5GB RAM)"
    ;;
  14b|14B)
    CURRENT=$(get_current)
    if echo "$CURRENT" | grep -qi "14B"; then
      echo "Already running 14B: $CURRENT"
      exit 0
    fi
    echo "NOTE: 14B uses ~8.5GB RAM. Make sure you have headroom."
    echo "First run will download the model (~8GB)."
    start_model "$MODEL_14B" "$DRAFT_14B" "Qwen 3 14B (max quality — ~8.5GB RAM)"
    ;;
  status|"")
    CURRENT=$(get_current)
    if [ -z "$CURRENT" ]; then
      echo "MLX server is NOT running"
    else
      echo "Current model: $CURRENT"
      echo "Port: $PORT"
    fi
    echo ""
    echo "Usage: $0 [8b|14b|status]"
    ;;
  *)
    echo "Usage: $0 [8b|14b|status]"
    exit 1
    ;;
esac
