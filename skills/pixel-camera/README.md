# pixel-camera

Take a photo on the Pixel using Termux and termux-api. For "what am I holding?", Sentry mode, or feeding images to a vision model.

**Requires:** Termux, `pkg install termux-api`, and the Termux:API app with camera permission.

**Tools:** `take_photo` — optional `camera_id` (0 back, 1 front) and `path` (absolute path for JPEG). Returns the file path on device; use with gateway/vision for description.
