#!/usr/bin/env python3
"""
Voice node controller for JARVIS on Pixel (Termux).
Pipeline: PulseAudio → ring buffer → OpenWakeWord → VAD → Whisper (STT) → Gateway (stream) → TTS FIFO.
Requires: PulseAudio + module-sles-source, openwakeword, sounddevice, numpy, requests.
Optional: whisper.cpp binary or Python 'whisper'; Silero VAD.
See docs/PIXEL_VOICE_RUNBOOK.md and docs/EDGE_NATIVE_VOICE_NODE.md.
"""

from __future__ import annotations

import os
import sys
import json
import subprocess
import tempfile
import threading
import time
import re
from pathlib import Path

# Config: YAML optional
try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False

import numpy as np

# Audio
try:
    import sounddevice as sd
    HAS_SOUNDDEVICE = True
except ImportError:
    HAS_SOUNDDEVICE = False

# Wake word: OpenWakeWord (onnx) or Porcupine (no onnx; Termux-friendly)
try:
    from openwakeword.model import Model as OWWModel
    HAS_OWW = True
except ImportError:
    OWWModel = None
    HAS_OWW = False

try:
    import pvporcupine
    HAS_PORCUPINE = True
except ImportError:
    pvporcupine = None
    HAS_PORCUPINE = False

import requests

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------

DEFAULT_CONFIG = {
    "gateway_url": "http://127.0.0.1:18789",
    "gateway_agent_id": "main",
    "sample_rate": 16000,
    "ring_buffer_seconds": 2.0,
    "chunk_samples": 1280,
    "wakeword_models": [],
    "wakeword_threshold": 0.5,
    "wake_phrase": "Hey JARVIS",
    "wakeword_engine": "",  # "openwakeword" | "porcupine" (empty = auto: OWW if available else Porcupine)
    "porcupine_access_key": "",
    "porcupine_keyword_path": "",  # path to .ppn; if empty and engine=porcupine, use built-in "jarvis"
    "vad_silence_threshold": 0.08,
    "vad_silence_seconds": 0.7,
    "vad_max_utterance_seconds": 15.0,
    "whisper_cmd": "",
    "whisper_python": False,
    "tts_fifo": "",
    "tts_barge_in_signal": "__STOP__",
    "system_prompt": "You are a concise voice assistant. Reply in short, spoken sentences. Avoid lists and markdown.",
    "system_prompt_file": "",  # e.g. ~/.jarvis/SOUL.md — if set and file exists, used as system_prompt (voice: keep short or first N chars)
    "strip_wake_phrase_from_transcript": True,
}


def load_config() -> dict:
    paths = [
        os.path.expanduser("~/.jarvis/voice_node.yaml"),
        os.path.join(os.path.dirname(__file__), "voice_node_config.yaml"),
    ]
    config = dict(DEFAULT_CONFIG)
    for p in paths:
        if os.path.isfile(p):
            try:
                with open(p, "r") as f:
                    if p.endswith(".yaml") or p.endswith(".yml"):
                        if HAS_YAML:
                            data = yaml.safe_load(f) or {}
                        else:
                            data = {}
                    else:
                        data = json.load(f)
                for k, v in data.items():
                    if v is not None:
                        config[k] = v
            except Exception as e:
                print(f"Warning: could not load config {p}: {e}", file=sys.stderr)
            break
    # Env overrides
    if os.environ.get("GATEWAY_URL"):
        config["gateway_url"] = os.environ["GATEWAY_URL"].rstrip("/")
    if os.environ.get("TTS_FIFO"):
        config["tts_fifo"] = os.environ["TTS_FIFO"]
    # Optional: load system prompt from file (e.g. ~/.jarvis/SOUL.md)
    prompt_file = (config.get("system_prompt_file") or "").strip()
    if prompt_file:
        path = os.path.expanduser(prompt_file)
        if os.path.isfile(path):
            try:
                with open(path, "r") as f:
                    content = f.read()
                # For voice, use first 1500 chars to keep context small; full SOUL can live in gateway workspace
                config["system_prompt"] = content[:1500] if len(content) > 1500 else content
            except Exception as e:
                print(f"Warning: could not read system_prompt_file {path}: {e}", file=sys.stderr)
    if not config["tts_fifo"]:
        config["tts_fifo"] = os.path.expanduser("~/.tts_pipe")
    if os.environ.get("WHISPER_CMD"):
        config["whisper_cmd"] = os.environ["WHISPER_CMD"]
    return config


# -----------------------------------------------------------------------------
# Ring buffer (int16)
# -----------------------------------------------------------------------------

class RingBuffer:
    def __init__(self, size_samples: int):
        self.buf = np.zeros(size_samples, dtype=np.int16)
        self.size = size_samples
        self.pos = 0
        self.filled = 0

    def push(self, chunk: np.ndarray) -> None:
        n = len(chunk)
        if n >= self.size:
            self.buf[:] = chunk[-self.size:]
            self.pos = 0
            self.filled = self.size
            return
        if self.pos + n <= self.size:
            self.buf[self.pos : self.pos + n] = chunk
            self.pos += n
        else:
            first = self.size - self.pos
            self.buf[self.pos:] = chunk[:first]
            self.buf[: n - first] = chunk[first:]
            self.pos = n - first
        self.filled = min(self.filled + n, self.size)

    def get_all(self) -> np.ndarray:
        if self.filled < self.size:
            return self.buf[: self.filled].copy()
        return np.concatenate([self.buf[self.pos :], self.buf[: self.pos]])

    def clear(self) -> None:
        self.pos = 0
        self.filled = 0


# -----------------------------------------------------------------------------
# Simple energy VAD (no torch/silero required)
# -----------------------------------------------------------------------------

def rms(samples: np.ndarray) -> float:
    if len(samples) == 0:
        return 0.0
    return float(np.sqrt(np.mean(samples.astype(np.float32) ** 2)) / 32768.0)


def record_until_silence(
    stream,
    config: dict,
    stop_event: threading.Event,
    stream_callback_queue,
) -> np.ndarray:
    """Record from stream until silence for vad_silence_seconds or max length. Uses pre-filled queue chunks."""
    sr = config["sample_rate"]
    silence_thresh = config["vad_silence_threshold"]
    silence_sec = config["vad_silence_seconds"]
    max_sec = config["vad_max_utterance_seconds"]
    silence_samples = int(sr * silence_sec)
    max_samples = int(sr * max_sec)
    silence_count = 0
    chunks = []
    recent_max = 0.01
    while not stop_event.is_set():
        try:
            chunk = stream_callback_queue.get(timeout=0.2)
        except Exception:
            continue
        chunks.append(chunk)
        n = len(chunk)
        energy = rms(chunk)
        recent_max = max(recent_max, energy)
        if energy < silence_thresh * recent_max:
            silence_count += n
            if silence_count >= silence_samples:
                break
        else:
            silence_count = 0
        if sum(len(c) for c in chunks) >= max_samples:
            break
    if not chunks:
        return np.array([], dtype=np.int16)
    return np.concatenate(chunks)


# -----------------------------------------------------------------------------
# Wake word
# -----------------------------------------------------------------------------

def create_wake_model(config: dict):
    engine = (config.get("wakeword_engine") or "").strip().lower()
    # Porcupine path (no onnxruntime; works on Termux/ARM)
    if engine == "porcupine" or (not engine and not HAS_OWW and HAS_PORCUPINE):
        if not HAS_PORCUPINE:
            return None
        key = (config.get("porcupine_access_key") or os.environ.get("PORCUPINE_ACCESS_KEY") or "").strip()
        if not key:
            print("Warning: porcupine_access_key (or PORCUPINE_ACCESS_KEY) required for Porcupine.", file=sys.stderr)
            return None
        path = (config.get("porcupine_keyword_path") or "").strip()
        if path:
            path = os.path.expanduser(path)
        try:
            sensitivity = config.get("wakeword_threshold", 0.5)
            if path and os.path.isfile(path):
                return pvporcupine.create(access_key=key, keyword_paths=[path], sensitivities=[sensitivity])
            # Built-in "jarvis" (or "hey jarvis" depending on Picovoice version)
            return pvporcupine.create(access_key=key, keywords=["jarvis"], sensitivities=[sensitivity])
        except Exception as e:
            print(f"Warning: could not load Porcupine: {e}", file=sys.stderr)
            return None
    # OpenWakeWord path
    if not HAS_OWW:
        return None
    models = config.get("wakeword_models") or []
    try:
        if models:
            return OWWModel(wakeword_models=models, inference_framework="onnx")
        return OWWModel(inference_framework="onnx")
    except Exception as e:
        print(f"Warning: could not load OpenWakeWord: {e}", file=sys.stderr)
        return None


def check_wake(audio: np.ndarray, model, config: dict) -> bool:
    if model is None:
        return False
    # Porcupine: expects frames of model.frame_length (e.g. 512); our chunk may be 1280
    if HAS_PORCUPINE and hasattr(model, "frame_length"):
        try:
            fl = model.frame_length
            # Feed our chunk in frame_length-sized pieces
            for i in range(0, len(audio) - fl + 1, fl):
                frame = audio[i : i + fl]
                if len(frame) != fl:
                    break
                idx = model.process(frame.tolist())
                if idx >= 0:
                    return True
        except Exception:
            pass
        return False
    # OpenWakeWord
    try:
        pred = model.predict(audio)
        thresh = config.get("wakeword_threshold", 0.5)
        for scores in pred.values():
            if isinstance(scores, (list, tuple)) and scores and scores[-1] > thresh:
                return True
            if isinstance(scores, (int, float)) and scores > thresh:
                return True
    except Exception:
        pass
    return False


# -----------------------------------------------------------------------------
# STT
# -----------------------------------------------------------------------------

def transcribe(audio_path: str, config: dict) -> str:
    cmd = (config.get("whisper_cmd") or "").strip()
    if cmd:
        # whisper_cmd is "path/to/whisper-cli -m model -l en -otxt -f"; we append audio_path
        try:
            parts = cmd.split()
            args = parts + [audio_path]
            out = subprocess.run(args, capture_output=True, text=True, timeout=60)
            if out.returncode != 0:
                return ""
            # whisper-cli -otxt often writes to <audio_path>.txt; prefer that over stdout
            txt_path = audio_path + ".txt"
            if os.path.isfile(txt_path):
                try:
                    with open(txt_path, "r") as f:
                        text = f.read().strip()[:2000]
                    try:
                        os.unlink(txt_path)
                    except Exception:
                        pass
                    return text
                except Exception:
                    pass
            # Else parse stdout
            for line in (out.stdout or "").splitlines():
                line = line.strip()
                if line and not line.startswith("["):
                    return line[:2000]
            return (out.stdout or "").strip()[:2000]
        except Exception as e:
            print(f"Whisper command failed: {e}", file=sys.stderr)
            return ""
    if config.get("whisper_python"):
        try:
            import whisper
            model = whisper.load_model("base")
            r = model.transcribe(audio_path, fp16=False)
            return (r.get("text") or "").strip()[:2000]
        except Exception as e:
            print(f"Whisper Python failed: {e}", file=sys.stderr)
            return ""
    return ""


# -----------------------------------------------------------------------------
# Gateway (streaming) + TTS
# -----------------------------------------------------------------------------

def strip_wake_phrase_from_text(text: str, wake_phrase: str) -> str:
    """Remove wake phrase (and common variants) from the start of the transcript."""
    if not text or not (text := text.strip()):
        return ""
    lower = text.lower()
    # Try exact wake phrase (e.g. "Hey JARVIS") then "hey jarvis", then "jarvis"
    for prefix in (
        wake_phrase.strip(),
        "hey jarvis",
        "jarvis",
    ):
        if not prefix:
            continue
        if lower.startswith(prefix.lower()):
            rest = text[len(prefix) :].lstrip(" ,")
            return rest
    return text


def strip_for_tts(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r"`[^`]+`", " ", text)
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"\*([^*]+)\*", r"\1", text)
    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:3000]


def stream_and_speak(
    gateway_url: str,
    agent_id: str,
    messages: list[dict],
    system_prompt: str,
    tts_fifo_path: str,
    barge_signal: str,
    stop_tts_event: threading.Event,
    config: dict,
) -> str:
    """Stream reply from gateway and send sentences to TTS FIFO. Returns full reply text."""
    url = f"{gateway_url.rstrip('/')}/v1/chat/completions"
    headers = {"Content-Type": "application/json", "x-openclaw-agent-id": agent_id}
    payload = {
        "model": "openclaw:main",
        "messages": [{"role": "system", "content": system_prompt}] + messages,
        "stream": True,
        "user": "voice-node",
    }
    sentence_end = re.compile(r"[.!?]\s*")
    buf = []
    full_text = []
    fifo = None
    try:
        if os.path.exists(tts_fifo_path):
            fifo = open(tts_fifo_path, "w")
    except Exception as e:
        print(f"TTS FIFO open failed: {e}", file=sys.stderr)
    try:
        with requests.Session() as s:
            r = s.post(url, headers=headers, json=payload, stream=True, timeout=30)
            r.raise_for_status()
            for line in r.iter_lines():
                if stop_tts_event.is_set():
                    break
                if not line or not line.strip().startswith(b"data:"):
                    continue
                try:
                    raw = line.split(b"data:", 1)[1].strip()
                    if raw == b"[DONE]":
                        break
                    data = json.loads(raw)
                    delta = (data.get("choices") or [{}])[0].get("delta", {})
                    content = delta.get("content")
                    if not content:
                        continue
                    buf.append(content)
                    full_text.append(content)
                    text = "".join(buf)
                    parts = sentence_end.split(text)
                    if len(parts) > 1:
                        for sent in parts[:-1]:
                            sent = strip_for_tts(sent.strip())
                            if sent and fifo:
                                fifo.write(sent + "\n")
                                fifo.flush()
                        buf = [parts[-1]]
                except Exception:
                    continue
            if buf and fifo and not stop_tts_event.is_set():
                remainder = strip_for_tts("".join(buf).strip())
                if remainder:
                    fifo.write(remainder + "\n")
                    fifo.flush()
    except Exception as e:
        print(f"Gateway/TTS error: {e}", file=sys.stderr)
    finally:
        if fifo:
            try:
                fifo.close()
            except Exception:
                pass
    return "".join(full_text).strip()


# -----------------------------------------------------------------------------
# Main loop
# -----------------------------------------------------------------------------

def main() -> None:
    config = load_config()
    sr = config["sample_rate"]
    chunk = config["chunk_samples"]
    ring_len = int(config["ring_buffer_seconds"] * sr)
    wake_phrase = config["wake_phrase"]

    if not HAS_SOUNDDEVICE:
        print("Install sounddevice and start PulseAudio (see PIXEL_VOICE_RUNBOOK.md).", file=sys.stderr)
        sys.exit(1)
    # Wake word: OpenWakeWord (needs onnxruntime) or Porcupine (Termux-friendly). Else manual trigger.
    manual_trigger = os.environ.get("VOICE_NODE_MANUAL_TRIGGER", "").lower() in ("1", "true", "yes")
    wake_model = create_wake_model(config)
    if wake_model is None and not manual_trigger:
        print("No wake word engine available. Install openwakeword (+ onnxruntime) or pvporcupine (see PIXEL_WAKE_WORD_OPTIONS.md).", file=sys.stderr)
        print("Or run with VOICE_NODE_MANUAL_TRIGGER=1 for press-Enter-to-record.", file=sys.stderr)
        sys.exit(1)
    if wake_model is None:
        manual_trigger = True
    ring = RingBuffer(ring_len)
    tts_stop = threading.Event()
    # Queue for record_until_silence (chunks from stream callback); cap to ~16s
    import queue
    chunk_queue = queue.Queue(maxsize=200)

    def audio_callback(indata, frames, time_info, status):
        if status:
            print(status, file=sys.stderr)
        if frames == chunk and indata is not None:
            ring.push(indata[:, 0].astype(np.int16))
            try:
                chunk_queue.put_nowait(indata[:, 0].astype(np.int16).copy())
            except queue.Full:
                try:
                    chunk_queue.get_nowait()
                except queue.Empty:
                    pass
                try:
                    chunk_queue.put_nowait(indata[:, 0].astype(np.int16).copy())
                except queue.Full:
                    pass

    stream = sd.InputStream(
        samplerate=sr,
        channels=1,
        dtype="int16",
        blocksize=chunk,
        callback=audio_callback,
    )
    stream.start()
    if manual_trigger:
        print(f"Voice node: manual mode (press Enter to record). Gateway {config['gateway_url']}", flush=True)
    else:
        print(f"Voice node: listening for '{wake_phrase}' (gateway {config['gateway_url']})", flush=True)
    conversation = []

    try:
        while True:
            if manual_trigger:
                try:
                    input("Press Enter to record... ")
                except EOFError:
                    break
                print("Recording... (speak now; silence ends)", flush=True)
                pre_roll = ring.get_all()
                record_stop = threading.Event()
                while not chunk_queue.empty():
                    try:
                        chunk_queue.get_nowait()
                    except queue.Empty:
                        break
                recorded = record_until_silence(stream, config, record_stop, chunk_queue)
            else:
                # Get latest chunk from ring (same as what we push in callback)
                time.sleep(chunk / sr)
                latest = np.zeros(chunk, dtype=np.int16)
                all_buf = ring.get_all()
                if len(all_buf) >= chunk:
                    latest[:] = all_buf[-chunk:]
                else:
                    continue
                if not check_wake(latest, wake_model, config):
                    continue
                print(f"[{wake_phrase}] detected, recording...", flush=True)
                pre_roll = ring.get_all()
                record_stop = threading.Event()
                while not chunk_queue.empty():
                    try:
                        chunk_queue.get_nowait()
                    except queue.Empty:
                        break
                recorded = record_until_silence(stream, config, record_stop, chunk_queue)
            if len(recorded) < sr * 0.3:
                print("Too short, ignoring.", flush=True)
                continue
            full_audio = np.concatenate([pre_roll, recorded]) if len(pre_roll) > 0 else recorded
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                wav_path = f.name
            try:
                # Write WAV header + data
                import wave
                with wave.open(wav_path, "wb") as wav:
                    wav.setnchannels(1)
                    wav.setsampwidth(2)
                    wav.setframerate(sr)
                    wav.writeframes(full_audio.tobytes())
                text = transcribe(wav_path, config)
            finally:
                try:
                    os.unlink(wav_path)
                except Exception:
                    pass
            if not text or not text.strip():
                if not (config.get("whisper_cmd") or config.get("whisper_python")):
                    print("No STT configured. Set whisper_cmd or whisper_python in ~/.jarvis/voice_node.yaml. See PIXEL_VOICE_RUNBOOK.md.", flush=True)
                else:
                    print("No transcript.", flush=True)
                continue
            if config.get("strip_wake_phrase_from_transcript", True):
                text = strip_wake_phrase_from_text(text.strip(), wake_phrase)
            else:
                text = text.strip()
            if not text:
                print("(Wake phrase only, ignoring)", flush=True)
                continue
            print(f"User: {text}", flush=True)
            conversation.append({"role": "user", "content": text})
            if len(conversation) > 20:
                conversation = conversation[-20:]
            tts_stop.clear()
            reply = stream_and_speak(
                config["gateway_url"],
                config["gateway_agent_id"],
                conversation[-10:],
                config.get("system_prompt", ""),
                config["tts_fifo"],
                config.get("tts_barge_in_signal", "__STOP__"),
                tts_stop,
                config,
            )
            if reply:
                conversation.append({"role": "assistant", "content": reply})
                print(f"JARVIS: {reply[:200]}{'...' if len(reply) > 200 else ''}", flush=True)
    except KeyboardInterrupt:
        print("Stopping.", flush=True)
    finally:
        stream.stop()
        stream.close()
        if wake_model is not None and hasattr(wake_model, "delete"):
            try:
                wake_model.delete()
            except Exception:
                pass


if __name__ == "__main__":
    main()
