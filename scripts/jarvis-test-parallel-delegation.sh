#!/usr/bin/env bash
# Send a test prompt to JARVIS to verify parallel delegation (exploit right agent, delegate in parallel).
# Usage: ./scripts/jarvis-test-parallel-delegation.sh [test_number|"custom prompt"]
#   test_number: 1 (default), 2, 3, or 4 — see docs/JARVIS_PARALLEL_DELEGATION.md § Testing
#   custom prompt: any string in quotes
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JARVIS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$JARVIS_DIR"

PROMPT=""
SUCCESS_HINT=""
case "${1:-1}" in
  1)
    PROMPT="What's the current time and give me a one-sentence repo_summary of the JARVIS repo? Do both in one go."
    SUCCESS_HINT="Success: one reply with (1) current time and (2) a short JARVIS repo summary."
    ;;
  2)
    PROMPT="Do these in parallel: (1) tell me the current time, (2) list the last 2 or 3 entries from this repo's DECISIONS.md if it exists."
    SUCCESS_HINT="Success: one reply with time and 2-3 DECISIONS.md entries (or note that file is missing)."
    ;;
  3)
    PROMPT="Spawn two background tasks: one to draft a one-paragraph PRD for olive, one to draft a one-paragraph test plan for BEAST-MODE. Tell me when you've started both."
    SUCCESS_HINT="Success: JARVIS says he started/spawned two subagents; results may follow in separate messages."
    ;;
  4)
    PROMPT="Run quality on the BEAST-MODE repo and a health check on the JARVIS repo. Do both in parallel if you can."
    SUCCESS_HINT="Success: JARVIS invokes BEAST MODE (quality) and Code Roach (health) and reports both (requires CLIs/workflows)."
    ;;
  *)
    if [ -n "$1" ]; then
      PROMPT="$*"
      SUCCESS_HINT="Check that JARVIS used the right agents and/or ran independent tasks in parallel."
    else
      PROMPT="What's the current time and give me a one-sentence repo_summary of the JARVIS repo? Do both in one go."
      SUCCESS_HINT="Success: one reply with (1) current time and (2) a short JARVIS repo summary."
    fi
    ;;
esac

echo "Test prompt: $PROMPT"
echo ""
echo "--- JARVIS reply ---"
"$SCRIPT_DIR/jarvis-chat" "$PROMPT" || true
echo ""
echo "---"
echo "$SUCCESS_HINT"
echo "See docs/JARVIS_PARALLEL_DELEGATION.md § 7 for all test prompts and success criteria."
