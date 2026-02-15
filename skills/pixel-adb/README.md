# pixel-adb

Control the Android device (Pixel) via ADB: tap, swipe, type, screenshot, dump UI, launch apps. Part of [Sovereign Nexus](https://github.com/dscripka/openWakeWord) / Pixel Perfection.

**Requires:**

- ADB available in PATH (on Pixel: `pkg install android-tools` in Termux).
- Device reachable: enable **Wireless debugging** in Developer options, then `adb connect 127.0.0.1:<port>` (port shown in Wireless debugging). Or use USB and `adb devices`.
- Set `ADB_SERIAL=127.0.0.1:5555` (or your port) if not default.

**Tools:** `adb_tap`, `adb_swipe`, `adb_text`, `adb_screencap`, `adb_ui_dump`, `adb_launch_app`.
