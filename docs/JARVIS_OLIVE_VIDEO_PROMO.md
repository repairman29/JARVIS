# JARVIS — Olive (shopolive.xyz) Video Promo

**Objective:** Promote Olive fully with MP4, GIFs, and related assets. JARVIS uses the video-creation skill and repo scripts to produce and refresh promo content.

---

## 1. What to produce

| Asset | Use | Spec |
|-------|-----|------|
| **Hero MP4** | Landing page, social, embed | 1280×720, 30–90 s, silent or voiceover |
| **Short MP4** | Twitter/LinkedIn/Instagram | 1080×1920 or 1280×720, &lt;60 s |
| **GIF (hero)** | Docs, README, tweets | From hero MP4, ~15–20 s loop, &lt;5 MB |
| **GIF (micro)** | Inline demos, “Add to cart” moment | 5–10 s, &lt;2 MB |
| **Screenshot carousel** | Optional: step-by-step as MP4 | 3 s per image |

**North star:** One hero MP4 and one hero GIF that show “list → Kroger cart” so anyone can see the product in under a minute.

---

## 2. Demo flow (what the video shows)

1. **Land on shopolive.xyz** — hero / value prop visible.
2. **Add items** — type or paste a short list (e.g. “milk, eggs, bread”); show Smart Paste or list UI.
3. **Connect Kroger** — show CTA / “Connect Kroger” (no real OAuth in automated recording).
4. **Add to Kroger cart** — show “Add to Kroger cart” and/or “Open cart” (or success state) if reachable without real auth.
5. **Outro** — shopolive.xyz and “Your kitchen list → Kroger cart.”

Recorded flow should be **repeatable** and **safe** (no real credentials). Use the Olive recording template; tune selectors in the template to match the live Olive UI.

---

## 3. How JARVIS produces assets

### 3.1 Tools and scripts

| Action | Tool / script |
|--------|----------------|
| Record browser demo (shopolive.xyz) | `skills/video-creation/` — Playwright + `templates/olive-shopolive.js` |
| Convert WebM → MP4 | `ffmpeg` (see `skills/video-creation/SKILL.md`) |
| Convert MP4 → GIF | `ffmpeg` (segment + palette) or `scripts/olive-promo-video.sh` |
| Optional voiceover | ElevenLabs + `create-website-demo.sh` (script.txt + `ELEVENLABS_API_KEY`) |
| One-shot pipeline (record + MP4 + GIF) | `scripts/olive-promo-video.sh` |

### 3.2 Repo script: Olive promo pipeline

From repo root:

```bash
./scripts/olive-promo-video.sh
```

- Runs the Olive recording template (Playwright → WebM).
- Converts to MP4 (hero).
- Exports a GIF from the MP4 (duration/size configurable).
- Outputs to `scripts/olive-promo-output/` (or configured dir). Commit or copy assets to Olive repo / CDN as needed.

JARVIS should prefer this script over ad-hoc commands when the user asks for “videos for Olive,” “Olive promo,” or “MP4/GIF for shopolive.xyz.”

### 3.3 Manual / custom recording

- **Custom steps:** Edit `skills/video-creation/templates/olive-shopolive.js` (demo steps and selectors).
- **Full website-demo pipeline (with voiceover):**  
  `skills/video-creation/create-website-demo.sh olive https://shopolive.xyz [script.txt] [voice-id]`  
  Then use `scripts/olive-promo-video.sh` or ffmpeg to produce GIFs from the resulting MP4.

---

## 4. Where assets live

- **Generated (this repo):** `scripts/olive-promo-output/` — commit here for versioned promo assets, or keep in `.gitignore` and copy to Olive.
- **Olive repo / production:** Copy MP4 and GIF into the Olive repo (e.g. `docs/` or `public/`) and reference from README, help page, or marketing site. Deploy via existing Olive/Vercel flow.
- **Social / external:** Upload hero MP4 and hero GIF to Twitter, LinkedIn, Instagram, etc.; link back to shopolive.xyz.

---

## 5. Success metrics

- **Output:** At least one hero MP4 and one hero GIF that clearly show the product flow.
- **Refresh:** Pipeline runnable anytime (e.g. after Olive UI changes) to regenerate assets.
- **Reuse:** Same pipeline usable for “short” variants (e.g. trim or resize in post) and for future Olive campaigns.

---

## 6. JARVIS instructions (summary)

- For **“videos for Olive,” “promo for shopolive.xyz,” “MP4 and GIF for Olive”**: run `./scripts/olive-promo-video.sh` from repo root (ensure Node, Playwright, ffmpeg available). Optionally run `create-website-demo.sh olive https://shopolive.xyz` for voiceover MP4, then produce GIFs from that MP4.
- Use **`skills/video-creation/`** (see `SKILL.md`) for details on recording, conversion, and voiceover.
- Put **outputs** in `scripts/olive-promo-output/`; suggest copying to Olive repo or uploading for social when done.

---

**See also:** `docs/OLIVE_PROJECT_README.md` (product overview), `skills/video-creation/SKILL.md` (video pipeline), `jarvis/TOOLS.md` (Video Creation / Olive promo).
