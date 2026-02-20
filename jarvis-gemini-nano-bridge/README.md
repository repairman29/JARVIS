# JARVIS Gemini Nano Bridge

Android app that exposes **Gemini Nano** (AICore) as an **OpenAI-compatible** `POST /v1/chat/completions` endpoint on **localhost:8890** so the JARVIS gateway or router can use it like any other LLM adapter.

**See:** [docs/PIXEL_GEMINI_NANO_BRIDGE.md](../docs/PIXEL_GEMINI_NANO_BRIDGE.md) for architecture and API contract.

## Requirements

- Android device with **AICore** / Gemini Nano (e.g. Pixel 8+, Samsung S24+).
- Min SDK 24; target 34.
- App runs as **foreground service** so the HTTP server is not killed.

## Build and run

### Option A: Without Android Studio (recommended if you don’t have it)

From the **JARVIS repo root** (or from this directory):

```bash
bash jarvis-gemini-nano-bridge/setup-android-build.sh
```

This script will:

1. Check for **Java 17+** (suggests `brew install openjdk@17` if missing).
2. Generate the **Gradle wrapper** (installs Gradle via Homebrew if needed so `gradle-wrapper.jar` is created).
3. Install the **Android SDK command-line tools** to `~/android-sdk` if not present (downloads from Google, installs platform 34 and build-tools).
4. Run **`./gradlew assembleDebug`** to build the APK.

Then install on the Pixel: `adb install -r app/build/outputs/apk/debug/app-debug.apk`

**One-time:** Add to your `~/.zshrc` (or `~/.bashrc`) so future builds see the SDK:

```bash
export ANDROID_HOME=$HOME/android-sdk
```

### Option B: With Android Studio

Open this folder in Android Studio, then **Build → Build Bundle(s) / APK(s) → Build APK(s)**, or run:

```bash
cd jarvis-gemini-nano-bridge && ./gradlew assembleDebug
```

(If `./gradlew` says `gradle-wrapper.jar` not found, run `setup-android-build.sh` once to generate it.)

### Install and run on device

1. Install on the Pixel: `adb install -r app/build/outputs/apk/debug/app-debug.apk`
2. Launch the app and tap **Start bridge** — it binds `127.0.0.1:8890` and shows a persistent notification.
3. From Termux on the same device (or from Mac with port forward): `curl -X POST http://127.0.0.1:8890/v1/chat/completions -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"Hello"}],"stream":false}'`

## JARVIS integration

- Add a third adapter pointing at `http://127.0.0.1:8890/v1` (e.g. in router or `NEURAL_FARM_BASE_URL` fallback).
- Or set `JARVIS_GEMINI_NANO_URL=http://127.0.0.1:8890` and have the gateway use it for simple/local tasks.

## Project layout

- `app/src/main/java/.../BridgeService.kt` — NanoHTTPD server + request/response mapping.
- `app/src/main/java/.../GeminiNano.kt` — Calls AICore / ML Kit GenAI (implement with your device’s SDK).
- `app/src/main/AndroidManifest.xml` — Foreground service permission and export.
