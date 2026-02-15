# Pixel gateway: clipboard module fix

Clawdbot depends on a native clipboard module that has no Android/Termux build. On the Pixel the gateway can fail with:

```
Cannot find module '@mariozechner/clipboard-android-arm64'
```
or (if Node reports Linux) `clipboard-linux-arm64-gnu` / `clipboard-linux-arm64-musl`.

**Fix:** We ship stub packages so the require succeeds. Clipboard won't work on the Pixel, but the gateway will start.

**Automatic:** Both **setup-jarvis-termux.sh** and **start-jarvis-pixel.sh** copy all three stubs from `scripts/pixel-stubs/` into `node_modules/@mariozechner/` before starting the gateway:

- `clipboard-android-arm64` (Node reports `platform === 'android'`)
- `clipboard-linux-arm64-gnu` (Node reports Linux + glibc)
- `clipboard-linux-arm64-musl` (Node reports Linux + musl)

After a fresh push, run setup or start once; the gateway should then return `200` on port 18789.

**Manual (if needed):**

```bash
mkdir -p ~/JARVIS/node_modules/@mariozechner
for s in clipboard-android-arm64 clipboard-linux-arm64-gnu clipboard-linux-arm64-musl; do
  [ -d ~/JARVIS/scripts/pixel-stubs/$s ] && cp -r ~/JARVIS/scripts/pixel-stubs/$s ~/JARVIS/node_modules/@mariozechner/
done
cd ~/JARVIS && export PORT=18789 && nohup npx clawdbot gateway run --allow-unconfigured --port 18789 >> ~/gateway.log 2>&1 &
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/
```
