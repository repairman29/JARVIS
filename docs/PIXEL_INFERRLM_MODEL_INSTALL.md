# Put an InferrLM model on the Pixel and test it

Get one of the recommended GGUF models onto the device, load it in the **InferrLM** app, then verify with JARVIS.

---

## Option A: InferrLM in-app download (easiest)

1. Open **InferrLM** on the Pixel.
2. Use the app’s **model download** or **Add model** (if available) to download a model over Wi‑Fi.
3. When the model is ready, set it as the **default** and turn **Server ON** (port 8889).
4. Run the test below.

---

## Option B: Download on Mac, push to Pixel, then load in InferrLM

Use the script from the Mac to download a GGUF and push it to the Pixel’s Download folder. Then in InferrLM you open/load that file.

### 1. Push a model from the Mac

From the JARVIS repo (Mac):

```bash
cd ~/JARVIS
./scripts/pixel-push-inferrlm-model.sh [pixel-ip]
```

- **Default:** downloads **Gemma 3 1B** (Q4_K_M, ~0.9 GB) and pushes to the Pixel.
- **4B:** use `./scripts/pixel-push-inferrlm-model.sh 4b [pixel-ip]` for **Gemma 3 4B** (~2.5 GB).

Pixel must be on the same Wi‑Fi and Termux **sshd** running (or use ADB; script will try SSH first). If Termux hasn’t run `termux-setup-storage`, the script may push to `~/JARVIS/models/` instead; you can then move the file in a file manager or load it from there in InferrLM if the app can browse that path.

### 2. On the Pixel: load the model in InferrLM

1. Open **InferrLM** and go to the **Chat** section (model selection is there, not in Settings/Models).
2. Use the model selector or **Load model** to pick a GGUF; go to **Download** (or the folder the script reported) and select the `.gguf` file.
3. Wait for the model to load, set it as active if needed, then turn **Server ON** (port 8889).

### 3. Test from the Pixel (or Mac)

**On the Pixel (Termux):**

```bash
cd ~/JARVIS && node scripts/pixel-llm-speed-test.js
```

**From the Mac (SSH):**

```bash
ssh -p 8022 u0_a310@<pixel-ip> "cd ~/JARVIS && node scripts/pixel-llm-speed-test.js"
```

Or chat in the UI: **Chrome → http://127.0.0.1:18888** and send a message.

---

## Recommended models (from PIXEL_LLM_MODEL_GUIDE)

| Model | Size (approx) | Best for |
|-------|----------------|----------|
| **Gemma 3 1B** (Q4_K_M) | ~0.9 GB | Fast chat, simple Q&A |
| **Gemma 3 4B** (Q4_K_M) | ~2.5 GB | Tasks, reasoning, tools |
| **Granite 4.0 Helper 1B** | ~1 GB | Fast chat, tool-calling |
| **VibeThinker 1.5B** | ~1 GB | Math/code reasoning (slower) |

The push script currently supports **1B** and **4B** Gemma 3; other models you can download manually (e.g. from Hugging Face) and put in **Download** or the folder InferrLM uses, then load in the app.

---

## Troubleshooting

- **“No such file or directory” when pushing:** Run `termux-setup-storage` in Termux once so `~/storage/downloads` exists; then re-run the script.
- **InferrLM doesn’t see the file:** Use the app’s file picker and go to **Download** (or **Documents**). If you used `~/JARVIS/models/`, try opening that path if the picker allows.
- **Server ON but speed test fails:** Ensure the JARVIS stack is running (`bash ~/JARVIS/scripts/run-jarvis-in-proot.sh` or `start-jarvis-pixel.sh`) so the adapter (8888) and gateway (18789) are up.

---

## Swapping models


**Where to select:** Load/select the model in the **Chat** section of the app (not in a separate Settings or Models screen). Use the model selector or "Load model" there to pick a GGUF (e.g. from Download). Set it as active and leave **Server ON** (8889).

1. **Open a GGUF from the system file picker**  
   In the app, look for **Settings**, **Models**, or a **“+” / “Load”** entry that opens a file picker. If you can open a `.gguf` from Download (or another folder), that might load and activate that model. We pushed Gemma 1B and 4B to `~/storage/downloads` on the Pixel; in the app, try opening one of those files if the app offers “Open file” or “Import model”.

2. **API (if the server supports it)**  
   InferrLM’s HTTP server (8889) may expose:
   - **GET /models** — lists the current model (and possibly others if the app has them).
   - **POST /models/load** — we got 404 on one device; your build might have it. From Termux on the Pixel you could try:  
     `curl -X POST http://127.0.0.1:8889/models/load -H "Content-Type: application/json" -d '{"model":"gemma-3-1b-it-Q4_K_M.gguf"}'`  
     (Use the exact model name as returned by `GET http://127.0.0.1:8889/models` if the format differs.)

3. **Ask InferrLM for a model selector**  
   If the app truly has no way to pick a model, the only long-term fix is for the app to add one (e.g. a list of loaded/available models, or “Load from file”). Consider leaving feedback in the Play Store or contacting the developer.

**Router env vars** (`PIXEL_LLM_PRIMARY_CHAT_MODEL`, `PIXEL_LLM_PRIMARY_TASK_MODEL`) only help if the server at 8889 honors the `model` field in chat requests; on the build we tested it did not.

See [PIXEL_LLM_MODEL_GUIDE.md](./PIXEL_LLM_MODEL_GUIDE.md) for which model to use for chat vs tasks, and [PIXEL_LLM_SPEED_AND_PRIORITY.md](./PIXEL_LLM_SPEED_AND_PRIORITY.md) for routing (e.g. chat → Nano, tasks → InferrLM).
