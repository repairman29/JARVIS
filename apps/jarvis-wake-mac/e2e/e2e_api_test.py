#!/usr/bin/env python3
"""
E2E API test for JARVIS Wake Mac contract.

Uses the same HTTP API the app uses (gateway or Edge). Run with the gateway
(or Edge) running; no app or microphone needed.

  Usage:
    # Use default base URL from ~/.jarvis/wake.conf or env
    python3 e2e_api_test.py

    # Override URL and optional token
    JARVIS_WAKE_BASE_URL=http://127.0.0.1:18789 JARVIS_WAKE_TOKEN=xxx python3 e2e_api_test.py

    # Only check connectivity (no content assertion)
    python3 e2e_api_test.py --no-assert-content
"""

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from typing import Optional


def read_wake_conf():
    """Read baseURL and token from ~/.jarvis/wake.conf (same logic as WakeConfig)."""
    conf = Path.home() / ".jarvis" / "wake.conf"
    if not conf.exists():
        return None, None
    base_url, token = None, None
    for line in conf.read_text().splitlines():
        t = line.strip()
        if t.startswith("baseURL="):
            base_url = t[8:].strip()
        elif t.startswith("token="):
            token = t[6:].strip()
    return base_url or None, token or None


def get_config():
    base_url = os.environ.get("JARVIS_WAKE_BASE_URL")
    token = os.environ.get("JARVIS_WAKE_TOKEN")
    if not base_url:
        from_conf, token_conf = read_wake_conf()
        base_url = from_conf
        if token is None and token_conf:
            token = token_conf
    if not base_url:
        base_url = "http://127.0.0.1:18789"
    return base_url.rstrip("/"), token


def is_edge_url(url: str) -> bool:
    return "supabase.co" in url and "functions/v1" in url


def send_gateway(base_url: str, token: Optional[str], message: str) -> tuple:
    """POST to gateway /v1/chat/completions (same as JarvisClient.sendToGateway)."""
    url = f"{base_url}/v1/chat/completions"
    body = {
        "model": "openclaw:main",
        "messages": [{"role": "user", "content": message[:4000]}],
        "stream": False,
        "user": f"e2e-{os.getpid()}",
    }
    headers = {
        "Content-Type": "application/json",
        "x-openclaw-agent-id": "main",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = Request(url, data=json.dumps(body).encode(), headers=headers, method="POST")
    with urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    return 200, data


def send_edge(base_url: str, token: Optional[str], message: str) -> tuple:
    """POST to Edge (same as JarvisClient.sendToEdge)."""
    body = {"message": message, "session_id": "e2e-test"}
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = Request(base_url, data=json.dumps(body).encode(), headers=headers, method="POST")
    with urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    return 200, data


def extract_content(data: dict) -> Optional[str]:
    """Same extraction logic as JarvisClient.extractContent."""
    if isinstance(data.get("content"), str) and data["content"]:
        return data["content"]
    if isinstance(data.get("message"), str) and data["message"]:
        return data["message"]
    if isinstance(data.get("text"), str) and data["text"]:
        return data["text"]
    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0]
        if isinstance(first, dict):
            msg = first.get("message")
            if isinstance(msg, dict) and isinstance(msg.get("content"), str):
                return msg["content"]
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description="E2E API test for JARVIS Wake contract")
    ap.add_argument("--no-assert-content", action="store_true", help="Do not require non-empty reply content")
    ap.add_argument("--message", default="What time is it?", help="Message to send (default: What time is it?)")
    args = ap.parse_args()

    base_url, token = get_config()
    message = args.message

    print(f"Base URL: {base_url}")
    print(f"Message:  {message}")
    if is_edge_url(base_url):
        print("Mode:     Edge")
    else:
        print("Mode:     Gateway")

    try:
        if is_edge_url(base_url):
            status, data = send_edge(base_url, token, message)
        else:
            status, data = send_gateway(base_url, token, message)
    except HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print(f"HTTP error: {e.code} {e.reason}", file=sys.stderr)
        print(body[:500], file=sys.stderr)
        return 1
    except URLError as e:
        print(f"Request failed: {e.reason}", file=sys.stderr)
        return 1

    content = extract_content(data)
    print(f"Status:   {status}")
    if content:
        preview = content[:200] + "..." if len(content) > 200 else content
        print(f"Content:  {preview}")
    else:
        print("Content:  (none or unparseable)")
        if not args.no_assert_content:
            print("E2E failed: no reply content", file=sys.stderr)
            return 1

    if not args.no_assert_content and not (content and content.strip()):
        print("E2E failed: empty reply content", file=sys.stderr)
        return 1

    print("E2E OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
