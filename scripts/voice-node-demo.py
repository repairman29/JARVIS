#!/usr/bin/env python3
"""
Demo: send one message to the JARVIS gateway and speak the reply via TTS FIFO.
Use this to verify gateway + TTS without wake word or Whisper.
  python3 scripts/voice-node-demo.py "What time is it?"
  echo "Hello from the demo" | python3 scripts/voice-node-demo.py
"""

import os
import re
import sys
import requests

def main():
    gateway_url = os.environ.get("GATEWAY_URL", "http://127.0.0.1:18789").rstrip("/")
    tts_fifo = os.environ.get("TTS_FIFO", os.path.expanduser("~/.tts_pipe"))
    if len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
    else:
        text = sys.stdin.read().strip()
    if not text:
        print("Usage: voice-node-demo.py <message>", file=sys.stderr)
        sys.exit(1)

    # Check gateway
    try:
        r = requests.get(f"{gateway_url}/", timeout=5)
    except Exception as e:
        print(f"Gateway unreachable ({gateway_url}): {e}", file=sys.stderr)
        sys.exit(1)
    if r.status_code != 200:
        print(f"Gateway returned {r.status_code}", file=sys.stderr)
        sys.exit(1)

    url = f"{gateway_url}/v1/chat/completions"
    payload = {
        "model": "openclaw:main",
        "messages": [{"role": "user", "content": text}],
        "stream": False,
        "user": "voice-demo",
    }
    headers = {"Content-Type": "application/json", "x-openclaw-agent-id": "main"}
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=60)
        r.raise_for_status()
        data = r.json()
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "")
    except Exception as e:
        print(f"Chat request failed: {e}", file=sys.stderr)
        sys.exit(1)

    if not content:
        print("No reply from gateway.", file=sys.stderr)
        sys.exit(1)
    print("JARVIS:", content)

    # TTS FIFO
    if not os.path.exists(tts_fifo):
        print(f"TTS FIFO not found: {tts_fifo}. Create with: mkfifo {tts_fifo}", file=sys.stderr)
        print("Then run the TTS reader in another terminal: while true; do while IFS= read -r line; do [ -n \"$line\" ] && termux-tts-speak \"$line\"; done < ~/.tts_pipe; done", file=sys.stderr)
        return
    # Strip markdown for TTS
    plain = content.replace("```", " ").replace("`", " ").replace("**", " ").replace("*", " ")
    plain = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", plain)
    plain = re.sub(r"\n+", " ", plain).replace("  ", " ").strip()[:3000]
    try:
        with open(tts_fifo, "w") as f:
            f.write(plain + "\n")
            f.flush()
        print("(Sent to TTS.)")
    except Exception as e:
        print(f"Could not write to TTS FIFO: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
