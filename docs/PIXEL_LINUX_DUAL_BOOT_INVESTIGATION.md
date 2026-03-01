# Linux on Pixel 8 Pro — Investigation (dual boot & native options)

**Goal:** Understand what Linux variants can be installed on the **Pixel 8 Pro** (codename *husky*), including dual boot with Android, and what’s practical as of **Feb 2026**.

---

## Bottom line

- **Native Linux (replace or dual-boot Android):** Not practical on Pixel 8 Pro today. No mainline/postmarketOS boot, no MultiROM-style dual boot.
- **Best practical options:** Stay on Android and run Linux in a container (Termux + proot-distro) or use Google’s Terminal app for graphical Linux apps on Pixels (Android 15+).

---

## 1. Native / dual-boot Linux on Pixel 8 Pro

### postmarketOS (google-husky / google-shiba)

- **Devices:** Pixel 8 Pro = `google-husky`, Pixel 8 = `google-shiba` in postmarketOS.
- **Status:** Both are in **testing**; documented as **not booting**. No pre-built images, no mainline kernel support for these devices.
- **Why:** Tensor G3 (same SoC on 8 and 8 Pro) has limited mainline Linux driver support. postmarketOS is moving to generic/mainline kernels, but Pixel 6/7/8 series are not there yet. Camera and other hardware often lack mainline drivers.
- **Contrast:** Pixel 3a is in **community** with working images and even mainline camera support (v24.12); newer Pixels are not.

**Conclusion:** You cannot reliably install and boot postmarketOS on Pixel 8 Pro today.

### Ubuntu Touch

- **Status:** Pixel 8 and Pixel 8 Pro are **not supported**.
- **Supported Pixels:** Only Pixel 3a / 3a XL (community devices). Newer Pixels depend on volunteer ports; no active port for 8 or 8 Pro.

### Dual boot (MultiROM / kexec, etc.)

- **MultiROM:** Uses kexec to choose OS at boot. Historically supported older Nexus and some third-party devices. **No indication of Pixel 8 or 8 Pro support** in current repos/forums; focus is on older devices.
- **Android Boot Manager (ABM):** Bootloader-level multiboot; only Volla Phone is listed as ready—no Pixel 8 Pro.
- **Reality:** Dual boot (Android + Linux) on Pixel 8 Pro is not a supported, documented path. No maintained method found.

---

## 2. Why Pixel 8 Pro is hard (Tensor G3)

- **SoC:** Google Tensor G3 (same on 8 and 8 Pro); GPU (Mali), ISP, and other blocks are not fully mainline-Linux friendly.
- **Kernel:** Main development is Android kernel trees and vendor drivers. Mainline has some progress (e.g. DWC3 USB for Tensor) but not a full, stable stack for Pixel 8 Pro.
- **Community:** Most custom work is Android ROMs (LineageOS, CalyxOS, etc.) that **replace** Android, not dual boot with it.

---

## 3. Practical “Linux on Pixel 8 Pro” options (keep Android)

These keep Android as the host and add Linux on top.

| Option | What it is | Dual boot? | Best for |
|--------|------------|------------|----------|
| **Termux + proot-distro** | Full userspace Linux (e.g. Ubuntu/Debian) in a proot under Termux. | No (runs alongside Android) | Full glibc/apt parity, CLI and services; JARVIS already uses Termux on Pixel 8 Pro; see [PIXEL_PROOT_DISTRO.md](./PIXEL_PROOT_DISTRO.md). |
| **Google Terminal app (Android 15+)** | Debian-based environment with Wayland; runs graphical Linux apps (e.g. GIMP) with GPU acceleration. | No | Easiest “Linux apps on Pixel” with a good UX. |
| **Termux + VNC + proot** | Proot distro + TigerVNC (or similar) for a desktop in an app. | No | Full desktop in a window; heavier, more setup. |

So: **no true dual boot**, but you can keep Android and run “Linux” as an environment or app layer.

---

## 4. If you want native Linux or dual boot in the future

- **Watch postmarketOS:** [Pixel 8 Pro (google-husky)](https://wiki.postmarketos.org/wiki/Google_Pixel_8_Pro_(google-husky)), [Pixel 8 (google-shiba)](https://wiki.postmarketos.org/wiki/Google_Pixel_8_(google-shiba)), [pmOS install](https://postmarketos.org/install/), and release notes (e.g. “generic kernels”, device status). Pixel 8 Pro would need to move from “not booting” to at least “booting” with a published image.
- **Watch mainline:** Tensor G3 mainline progress (USB, display, GPU, etc.) would need to mature before a solid native Linux or dual-boot story.
- **Device choice:** If native or dual-boot Linux is a hard requirement **soon**, consider devices already supported by postmarketOS/Ubuntu Touch (e.g. Pixel 3a, or other listed community devices) rather than Pixel 8 Pro.

---

## 5. References (summary)

- postmarketOS: Pixel 8 Pro (google-husky) and Pixel 8 (google-shiba) in testing, not booting; Pixel 7 (google-panther) also testing/not booting; Pixel 3a has working images.
- Ubuntu Touch: Only Pixel 3a/3a XL in supported list; no Pixel 8 or 8 Pro.
- MultiROM / kexec: No Pixel 8 or 8 Pro support found.
- Tensor G3: Android/vendor kernel focus; mainline in progress but not complete for Pixel 8 Pro.
- Termux + proot: [PIXEL_PROOT_DISTRO.md](./PIXEL_PROOT_DISTRO.md). Google Terminal: “Android Terminal” + graphical Linux apps on Pixels (Android 15+).

---

**Next action:** For JARVIS on **Pixel 8 Pro**, continue using **Android + Termux** (and optionally proot when you need glibc/Ubuntu). Revisit native/dual-boot when postmarketOS or mainline status for Pixel 8 Pro improves.
