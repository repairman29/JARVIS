# Custom Wake Word Training (OpenWakeWord)

This guide covers building a **custom wake word** (e.g. "Hey Clawd" or "Hey JARVIS") with [openWakeWord](https://github.com/dscripka/openWakeWord) and using it in the JARVIS voice node. A lightweight **wake word engine** acts as a gatekeeper so you don't run Whisper 24/7—saving battery and avoiding Tensor G3 overload.

---

## 1. Why a gatekeeper?

| State | Engine | CPU / battery |
|-------|--------|----------------|
| **Idle / listening** | OpenWakeWord (80 ms frames) | &lt; 2% CPU, low drain |
| **Active speech** | VAD + Whisper + gateway | Moderate (short burst) |
| **Reasoning** | InferrLM / Clawdbot | High (burst) |

OpenWakeWord runs on CPU via **onnxruntime**, processes a **2-second ring buffer** in real time, and only when the score exceeds a threshold do you switch to "active listening" (VAD → Whisper → gateway → TTS).

---

## 2. Architecture in JARVIS (voice_node.py)

When OpenWakeWord is available (e.g. on a machine with `pip install onnxruntime`), the voice node already implements:

- **Ring buffer:** Last 2 seconds of 16 kHz mono audio (config: `ring_buffer_seconds: 2.0`).
- **Continuous monitoring:** Each 80 ms chunk (`chunk_samples: 1280`) is pushed to the buffer and evaluated by OpenWakeWord.
- **Pre-roll capture:** On wake-word detection, the node **prepends** the full ring buffer to the next recording. That way, if you say "Hey Clawd, what's the weather?", the start of the command is not clipped.
- **Active listening:** After trigger, energy-based VAD (or optional Silero) detects end-of-utterance, then Whisper → gateway → TTS.

On **Termux (Pixel)** there is no official onnxruntime wheel for ARM/Android, so the voice node falls back to **manual trigger** (press Enter to record). Once onnxruntime is available on Termux (e.g. via a future Termux package or custom build), the same script will use the wake word without code changes.

---

## 3. Training a custom phrase ("Hey Clawd" / "Hey JARVIS")

openWakeWord supports custom ONNX models so you can use your own phrase instead of the bundled "hey jarvis".

### 3.1 Colab notebook (recommended)

1. Open the **automatic model training** notebook:  
   [openWakeWord — automatic_model_training.ipynb](https://github.com/dscripka/openWakeWord/blob/main/notebooks/automatic_model_training.ipynb)  
   (Run it in [Google Colab](https://colab.research.google.com/) so Piper TTS and GPU are available.)

2. Run the **Environment setup** and **Download Data** cells (RIRs, Audioset, FMA, validation features, ACAV100M features) as in the notebook.

3. In the **Define Training Configuration** section, instead of the notebook’s example, use a config for your phrase. For **"Hey Clawd"** you can use the provided config in this repo:

   - Copy [../scripts/wakeword_training_config_hey_clawd.yaml](../scripts/wakeword_training_config_hey_clawd.yaml) into the Colab runtime (or create `my_model.yaml` with the same structure).

   - Main fields to set:
     - `target_phrase`: `["hey clawd"]` (or `["hey jarvis"]` if you prefer the default phrase name).
     - `model_name`: `hey_clawd` (must match the key you’ll use in Python; use underscores, no spaces).
     - Paths for `rir_paths`, `background_paths`, `false_positive_validation_data_path`, and `feature_data_files` must match the directories/files produced by the notebook’s download cells (e.g. `./mit_rirs`, `./audioset_16k`, `./fma`, `./validation_set_features.npy`, `./openwakeword_features_ACAV100M_2000_hrs_16bit.npy`).

4. Run the training steps in order (openWakeWord uses **train.py** with three separate flags, not a single `train_wakeword.py`):
   - **Generate clips:** `train.py --training_config my_model.yaml --generate_clips`
   - **Augment clips:** `train.py --training_config my_model.yaml --augment_clips`
   - **Train model:** `train.py --training_config my_model.yaml --train_model`

5. After training, the notebook writes the model under `./my_custom_model/` (or the `output_dir` in your config), e.g.:
   - `my_custom_model/hey_clawd.onnx`
   - `my_custom_model/hey_clawd.tflite`

6. Download the **.onnx** file to your machine, then copy it to the Pixel (e.g. via `adb push` or Termux `~/storage/downloads`). Place it where the voice node can load it (see §4).

### 3.2 Training config reference

The repo includes a sample config for "Hey Clawd": [../scripts/wakeword_training_config_hey_clawd.yaml](../scripts/wakeword_training_config_hey_clawd.yaml). It is intended to be used **inside the Colab notebook** after you’ve run the data-download cells. Adjust paths if your notebook uses different directory names. Key fields:

- **target_phrase:** list of phrases to trigger on (e.g. `["hey clawd"]`).
- **model_name:** identifier for the model file (e.g. `hey_clawd` → `hey_clawd.onnx`).
- **n_samples / n_samples_val:** number of synthetic positive samples (notebook often uses smaller values for a quick run; 20k+ recommended for production).
- **steps:** training steps (e.g. 10k for a quick test, 50k for better quality).
- **rir_paths, background_paths, false_positive_validation_data_path, feature_data_files:** must match the data you downloaded in the notebook.

For full options, see the [openWakeWord custom_model.yml](https://github.com/dscripka/openWakeWord/blob/main/examples/custom_model.yml) example.

### 3.3 Colab copy-paste: correct pipeline (model synthesis)

openWakeWord does **not** provide a single `train_wakeword.py` or a config with `wakeword_name` / `model_type: "tiny_embedding"`. Training uses the **automatic_model_training** notebook flow: Piper TTS (via piper-sample-generator) generates synthetic variations, then `openwakeword/openwakeword/train.py` with a YAML that matches the [example custom_model.yml](https://github.com/dscripka/openWakeWord/blob/main/examples/custom_model.yml) schema.

**Option A — Use the official notebook (recommended):**  
Open [automatic_model_training.ipynb](https://github.com/dscripka/openWakeWord/blob/main/notebooks/automatic_model_training.ipynb) in Colab, run Environment setup and Download Data, then in the "Define Training Configuration" cell replace the example with the contents of [../scripts/wakeword_training_config_hey_clawd.yaml](../scripts/wakeword_training_config_hey_clawd.yaml) (save as `my_model.yaml`) and run the three `train.py` steps. Download `my_custom_model/hey_clawd.onnx`.

**Option B — Colab cells that match the real pipeline:**  
Run these in order. First cell: clone and env (Piper + openWakeWord + deps). Second: download data (RIRs, Audioset, FMA, validation/ACAV100M .npy). Third: write our Hey Clawd YAML and run generate → augment → train. Fourth: download the .onnx.

```python
# === Cell 1: Clone + environment (run first) ===
!git clone https://github.com/dscripka/openWakeWord.git
%cd openWakeWord
!git clone https://github.com/rhasspy/piper-sample-generator
!wget -O piper-sample-generator/models/en_US-libritts_r-medium.pt 'https://github.com/rhasspy/piper-sample-generator/releases/download/v2.0.0/en_US-libritts_r-medium.pt'
!pip install -q piper-phonemize webrtcvad
!pip install -e .  # openWakeWord
!pip install -q mutagen==1.47.0 torchinfo torchmetrics speechbrain audiomentations torch-audiomentations acoustics pronouncing datasets deep-phonemizer
# Download openWakeWord resource models (required by train pipeline)
import os
os.makedirs("./openwakeword/resources/models", exist_ok=True)
!wget -q https://github.com/dscripka/openWakeWord/releases/download/v0.5.1/embedding_model.onnx -O ./openwakeword/resources/models/embedding_model.onnx
!wget -q https://github.com/dscripka/openWakeWord/releases/download/v0.5.1/melspectrogram.onnx -O ./openwakeword/resources/models/melspectrogram.onnx
```

```python
# === Cell 2: Download data (RIRs, Audioset, FMA, validation + ACAV100M features) ===
# See the notebook for full downloads; abbreviated here. You need: mit_rirs/, audioset_16k/, fma/, validation_set_features.npy, openwakeword_features_ACAV100M_2000_hrs_16bit.npy
!wget -q https://huggingface.co/datasets/davidscripka/openwakeword_features/resolve/main/validation_set_features.npy
!wget -q https://huggingface.co/datasets/davidscripka/openwakeword_features/resolve/main/openwakeword_features_ACAV100M_2000_hrs_16bit.npy
# RIRs and background: run the notebook's "Download Data" cells for mit_rirs, audioset, fma (or reuse from notebook).
```

```python
# === Cell 3: Write Hey Clawd config and run training (paths must match your data) ===
# After running the full notebook Download Data cells you should have: mit_rirs/, audioset_16k/, fma/, validation_set_features.npy, openwakeword_features_ACAV100M_2000_hrs_16bit.npy
import yaml
config = {
    "model_name": "hey_clawd",
    "target_phrase": ["hey clawd", "hey claud"],
    "custom_negative_phrases": [],
    "n_samples": 5000,
    "n_samples_val": 1000,
    "steps": 10000,
    "tts_batch_size": 50,
    "augmentation_batch_size": 16,
    "piper_sample_generator_path": "./piper-sample-generator",
    "output_dir": "./my_custom_model",
    "rir_paths": ["./mit_rirs"],
    "background_paths": ["./audioset_16k", "./fma"],
    "background_paths_duplication_rate": [1, 1],
    "false_positive_validation_data_path": "./validation_set_features.npy",
    "augmentation_rounds": 1,
    "feature_data_files": {"ACAV100M_sample": "./openwakeword_features_ACAV100M_2000_hrs_16bit.npy"},
    "batch_n_per_class": {"ACAV100M_sample": 1024, "adversarial_negative": 50, "positive": 50},
    "model_type": "dnn",
    "layer_size": 32,
    "max_negative_weight": 1500,
    "target_false_positives_per_hour": 0.2,
    "target_accuracy": 0.6,
    "target_recall": 0.25,
}
with open("my_model.yaml", "w") as f:
    yaml.dump(config, f)
import subprocess
for step in ["--generate_clips", "--augment_clips", "--train_model"]:
    subprocess.run([__import__("sys").executable, "openwakeword/train.py", "--training_config", "my_model.yaml", step], check=True)
```

```python
# === Cell 4: Download the model for the Pixel ===
from google.colab import files
files.download("my_custom_model/hey_clawd.onnx")
```

**Note:** Cell 2 is abbreviated; the full notebook downloads MIT RIRs, Audioset, and FMA into `mit_rirs/`, `audioset_16k/`, `fma/`. For a complete run, use the notebook’s Download Data cells or add equivalent wget/dataset steps so those directories exist before training. The config in [wakeword_training_config_hey_clawd.yaml](../scripts/wakeword_training_config_hey_clawd.yaml) uses both **"hey clawd"** and **"hey claud"** so one model triggers on either spelling.

---

## 4. Using the custom model in the voice node

1. Copy the trained **.onnx** file to the Pixel (e.g. `~/.jarvis/models/hey_clawd.onnx` or next to your JARVIS repo).

2. In **~/.jarvis/voice_node.yaml** (or your active config), set:

   ```yaml
   wakeword_models: ["/path/to/hey_clawd.onnx"]   # full path to your .onnx
   wake_phrase: "Hey Clawd"                        # for logs only
   wakeword_threshold: 0.8                         # 0.8 recommended for always-on (fewer false positives)
   ```

3. Run the voice node **without** manual trigger (so it uses OpenWakeWord):
   - On a system where `import onnxruntime` works (e.g. desktop or future Termux with onnxruntime):
     ```bash
     unset VOICE_NODE_MANUAL_TRIGGER
     python3 scripts/voice_node.py
     ```
   - On Termux today, onnxruntime is usually not available, so the script will still use manual trigger; once onnxruntime is installable on Termux, the same config will enable hands-free "Hey Clawd".

---

## 5. Threshold (wakeword_threshold)

- **0.5 (default):** more sensitive; more false triggers.
- **0.8:** recommended for always-on; fewer false positives, may need a clearer enunciation.

Tune in your environment; the value is in `voice_node_config.example.yaml` and overridable in `~/.jarvis/voice_node.yaml`.

### 5.1 Vulkan profiling (Termux)

So that once the voice node hands off to Whisper or InferrLM, the Mali GPU is used instead of CPU-only, set the Vulkan loader in Termux before running Whisper/llama:

```bash
export VK_ICD_FILENAMES=/vendor/etc/vulkan/icd.d/mali.json
```

If your device uses a different ICD path, check `ls /vendor/etc/vulkan/icd.d/` or `ls /vendor/lib64/hw/vulkan*.so`. See [EDGE_NATIVE_VOICE_NODE.md §2](./EDGE_NATIVE_VOICE_NODE.md#2-hardware-and-environment-tied-to-this-repo) and [PIXEL_GOD_MODE.md §5.2](./PIXEL_GOD_MODE.md#52-tensor-g3-gpu-and-cpu).

### 5.2 Pre-roll verification (without onnxruntime)

Even with **manual trigger** (press Enter), `voice_node.py` uses the same **2-second pre-roll** path: it flushes the ring buffer into `pre_roll`, then records until VAD silence, then concatenates `pre_roll + recorded` before sending to Whisper. So you can verify pre-roll behavior today: run the voice node in manual mode, press Enter, say "Hey Clawd, what time is it?" and confirm the transcript includes the start of the phrase. No code change needed; when onnxruntime is available, the only difference is that the trigger will be OpenWakeWord instead of Enter.

---

## 6. Android 14: keeping the mic available

Android blocks background apps from using the microphone. For always-on wake word you need one of:

- **Termux:Float:** Run the voice node in a **floating** Termux window so the app stays in the foreground and the mic stays available.
- **Fake standby:** Use a black overlay app (e.g. Extinguish) so the screen is logically "on" (mic path open) while the OLED pixels are off.

See [PIXEL_VOICE_RUNBOOK.md §11](./PIXEL_VOICE_RUNBOOK.md#11-microphone-in-background-android-14) and [PIXEL_GOD_MODE.md §5.1](./PIXEL_GOD_MODE.md#51-bypass-the-android-jail).

---

## 7. Summary

| Step | Action |
|------|--------|
| 1 | Run openWakeWord [automatic_model_training.ipynb](https://github.com/dscripka/openWakeWord/blob/main/notebooks/automatic_model_training.ipynb) in Colab; use [wakeword_training_config_hey_clawd.yaml](../scripts/wakeword_training_config_hey_clawd.yaml) (or your phrase) and match data paths. |
| 2 | Download the generated **.onnx** and copy it to the Pixel. |
| 3 | Set `wakeword_models: ["/path/to/hey_clawd.onnx"]` and `wakeword_threshold: 0.8` in `~/.jarvis/voice_node.yaml`. |
| 4 | Run the voice node without `VOICE_NODE_MANUAL_TRIGGER` on a system with onnxruntime; on Termux use manual trigger until onnxruntime is available. |

This gives you a true **gatekeeper** flow: ring buffer → OpenWakeWord → pre-roll + VAD → Whisper → gateway → TTS, with your own "Hey Clawd" (or other) phrase.
