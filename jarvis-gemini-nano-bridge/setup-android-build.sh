#!/usr/bin/env bash
# Set up Android build without Android Studio: Java, Android SDK (command-line), Gradle wrapper, then build.
# Run from repo root: bash jarvis-gemini-nano-bridge/setup-android-build.sh
# Or from this dir: bash setup-android-build.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
cd "$SCRIPT_DIR"

# ---------------------------------------------------------------------------
# 1. Java 17+
# ---------------------------------------------------------------------------
check_java() {
  if command -v java >/dev/null 2>&1; then
    local ver
    ver=$(java -version 2>&1 | head -1)
    if java -version 2>&1 | grep -qE "1[7-9]|2[0-9]"; then
      echo "Java OK: $ver"
      return 0
    fi
  fi
  echo "Java 17+ is required. Install with:"
  echo "  brew install openjdk@17"
  echo "  echo 'export PATH=\"/opt/homebrew/opt/openjdk@17/bin:\$PATH\"' >> ~/.zshrc"
  exit 1
}
check_java

# ---------------------------------------------------------------------------
# 2. Gradle wrapper (generate gradle-wrapper.jar if missing)
# Use Gradle 8.2 from distribution so Android plugin resolves (Homebrew Gradle is 9.x and incompatible).
# ---------------------------------------------------------------------------
if [ ! -f "gradle/wrapper/gradle-wrapper.jar" ]; then
  echo "Gradle wrapper JAR missing. Bootstrapping with Gradle 8.2..."
  GRADLE_ZIP="gradle-8.2-bin.zip"
  GRADLE_URL="https://services.gradle.org/distributions/$GRADLE_ZIP"
  GRADLE_DIR="$SCRIPT_DIR/.gradle-bootstrap"
  mkdir -p "$GRADLE_DIR"
  if [ ! -f "$GRADLE_DIR/$GRADLE_ZIP" ]; then
    echo "Downloading Gradle 8.2..."
    curl -L -o "$GRADLE_DIR/$GRADLE_ZIP" "$GRADLE_URL"
  fi
  if [ ! -x "$GRADLE_DIR/gradle-8.2/bin/gradle" ]; then
    echo "Unpacking Gradle 8.2..."
    unzip -q -o "$GRADLE_DIR/$GRADLE_ZIP" -d "$GRADLE_DIR"
  fi
  "$GRADLE_DIR/gradle-8.2/bin/gradle" wrapper --gradle-version=8.2
  echo "Gradle wrapper ready."
  # Keep .gradle-bootstrap so daemon/cache don't reference missing paths; optional: rm -rf .gradle-bootstrap later
else
  echo "Gradle wrapper already present."
fi

# ---------------------------------------------------------------------------
# 3. Android SDK (command-line tools)
# ---------------------------------------------------------------------------
ANDROID_SDK_ROOT="${ANDROID_HOME:-$HOME/android-sdk}"
export ANDROID_HOME="$ANDROID_SDK_ROOT"

if [ ! -d "$ANDROID_SDK_ROOT/cmdline-tools/latest" ]; then
  echo "Android SDK command-line tools not found. Installing to $ANDROID_SDK_ROOT ..."
  mkdir -p "$ANDROID_SDK_ROOT"
  # Stable Mac command-line tools (version number may change; check developer.android.com if URL fails)
  CMDLINE_URL="https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"
  CMDLINE_ZIP="$ANDROID_SDK_ROOT/cmdline-tools.zip"
  echo "Downloading command-line tools..."
  curl -L -o "$CMDLINE_ZIP" "$CMDLINE_URL"
  mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"
  unzip -q -o "$CMDLINE_ZIP" -d "$ANDROID_SDK_ROOT/cmdline-tools"
  rm -f "$CMDLINE_ZIP"
  # Rename to "latest" so sdkmanager finds it
  if [ -d "$ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools" ]; then
    mv "$ANDROID_SDK_ROOT/cmdline-tools/cmdline-tools" "$ANDROID_SDK_ROOT/cmdline-tools/latest"
  fi
  echo "Command-line tools installed."
fi

SDKMANAGER="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin/sdkmanager"
if [ ! -x "$SDKMANAGER" ]; then
  echo "sdkmanager not found at $SDKMANAGER. Fix Android SDK layout and re-run."
  exit 1
fi

# Accept licenses (non-interactive)
yes 2>/dev/null | "$SDKMANAGER" --sdk_root="$ANDROID_SDK_ROOT" --licenses 2>/dev/null || true

# Install platform and build-tools
echo "Installing Android platform 34 and build-tools..."
"$SDKMANAGER" --sdk_root="$ANDROID_SDK_ROOT" \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0"

# ---------------------------------------------------------------------------
# 4. Build
# ---------------------------------------------------------------------------
echo ""
echo "Building APK (ANDROID_HOME=$ANDROID_HOME)..."
./gradlew assembleDebug

echo ""
echo "Done. APK: app/build/outputs/apk/debug/app-debug.apk"
echo "Install on device: adb install -r app/build/outputs/apk/debug/app-debug.apk"
