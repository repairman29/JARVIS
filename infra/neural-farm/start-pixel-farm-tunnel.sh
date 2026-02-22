#!/bin/bash
# Neural Farm v4 Manager — keeps the 4-node cluster alive from Mac
# Architecture: Mac (MLX Qwen3-8B) + Pixel (llama.cpp) + 2x iPhone (InferrLM)
#               → balancer (:8899) → gateway (:18789) → Tailscale Funnel → Supabase → JARVIS UI
# Managed by launchd: com.jarvis.pixel-farm
# Docs: /Users/jeffadkins/NEURAL-FARM.md

PIXEL_IP="100.75.3.115"
IPHONE_IP="100.102.220.122"
IPHONE16_IP="100.91.240.55"
PIXEL_SSH_PORT=8022
BALANCER_PORT=8899
GATEWAY_PORT=18789
BALANCER_SCRIPT="/Users/jeffadkins/farm-balancer.js"
FUNNEL_URL="https://jeffs-macbook-air.tail047a68.ts.net"
MLX_ENV="/Users/jeffadkins/mlx-env"
MLX_MODEL="mlx-community/Qwen3-8B-4bit"
MLX_PORT=8890

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*"; }

check_pixel_ssh() {
  ssh -o ConnectTimeout=5 -o BatchMode=yes -p $PIXEL_SSH_PORT $PIXEL_IP 'echo ok' 2>/dev/null | grep -q ok
}

check_balancer() {
  curl -s --max-time 3 http://localhost:$BALANCER_PORT/health 2>/dev/null | grep -q '"status"'
}

check_funnel() {
  # Gateway (clawdbot) exposes /v1/models; farm had /health
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$FUNNEL_URL/v1/models" 2>/dev/null)
  [ "$code" = "200" ]
}

start_balancer() {
  log "Starting farm balancer on port $BALANCER_PORT..."
  pkill -f "farm-balancer.js" 2>/dev/null
  sleep 1
  nohup node "$BALANCER_SCRIPT" > /Users/jeffadkins/farm-balancer.log 2>&1 &
  sleep 3
  if check_balancer; then
    log "Balancer started"
  else
    log "Balancer failed to start"
  fi
}

start_funnel() {
  log "Starting Tailscale Funnel (gateway :$GATEWAY_PORT)..."
  tailscale serve --bg http://localhost:$GATEWAY_PORT 2>/dev/null
  sleep 1
  tailscale funnel --bg --https=443 http://localhost:$GATEWAY_PORT 2>/dev/null
  sleep 2
  if check_funnel; then
    log "Funnel active at $FUNNEL_URL (gateway)"
  else
    log "Funnel may need a moment to propagate"
  fi
}

ensure_pixel_farm() {
  ssh -o ConnectTimeout=5 -p $PIXEL_SSH_PORT $PIXEL_IP '
    if ! timeout 2 bash -c "echo >/dev/tcp/127.0.0.1/8889" 2>/dev/null; then
      echo "NEED_START"
    else
      echo "RUNNING"
    fi
  ' 2>/dev/null
}

log "=== Neural Farm v4 Manager starting ==="
log "Funnel URL: $FUNNEL_URL (permanent)"

# Start MLX server if not running
if curl -s --max-time 2 "http://127.0.0.1:$MLX_PORT/v1/models" 2>/dev/null | grep -q model; then
  log "MLX server already running on :$MLX_PORT"
else
  log "Starting MLX server (Qwen 3 8B + speculative decoding)..."
  pkill -f mlx_lm.server 2>/dev/null
  pkill -f llama-server 2>/dev/null
  sleep 1
  source "$MLX_ENV/bin/activate"
  nohup mlx_lm.server \
    --model "$MLX_MODEL" \
    --draft-model mlx-community/Qwen3-0.6B-4bit \
    --num-draft-tokens 4 \
    --chat-template-args '{"enable_thinking":false}' \
    --decode-concurrency 2 \
    --prompt-concurrency 2 \
    --port $MLX_PORT --host 127.0.0.1 \
    --max-tokens 2048 \
    > /Users/jeffadkins/mlx-server.log 2>&1 &
  for i in $(seq 1 30); do
    sleep 2
    if curl -s --max-time 2 "http://127.0.0.1:$MLX_PORT/v1/models" 2>/dev/null | grep -q model; then
      log "MLX server ready (Qwen 3 8B, Metal GPU)"
      break
    fi
    [ $i -eq 30 ] && log "MLX server failed to start"
  done
fi

while true; do
  # Ensure Pixel llama-server is running
  if check_pixel_ssh; then
    pixel_status=$(ensure_pixel_farm)
    if echo "$pixel_status" | grep -q "NEED_START"; then
      log "Pixel llama-server not running, starting..."
      ssh -o ConnectTimeout=10 -p $PIXEL_SSH_PORT $PIXEL_IP 'bash ~/start-farm.sh --bg' 2>/dev/null
      sleep 15
    fi
  else
    log "Pixel SSH unreachable"
  fi

  # Ensure balancer is running
  if ! check_balancer; then
    start_balancer
  fi

  # Ensure Tailscale Funnel is serving
  if ! check_funnel; then
    start_funnel
  fi

  # Log status
  if check_balancer; then
    STATUS=$(curl -s http://localhost:$BALANCER_PORT/health 2>/dev/null)
    NODES=$(echo "$STATUS" | python3 -c "
import json,sys
d=json.load(sys.stdin)
parts=[f\"{n['name']}:{'UP' if n['healthy'] else 'DOWN'}({n['requests']}r)\" for n in d['nodes']]
print(' '.join(parts))
" 2>/dev/null)
    log "Farm: $NODES"
  fi

  sleep 300
done
