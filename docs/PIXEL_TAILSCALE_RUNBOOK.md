# JARVIS on Pixel via Tailscale

Use your Pixel as a JARVIS node reachable over **Tailscale** so you can sync, SSH, chat, and use the gateway from your Mac (or any device on your tailnet) without being on the same Wi‑Fi.

---

## 1. Prerequisites

- JARVIS already runs on the Pixel (Termux + Proot by default: `bash ~/JARVIS/scripts/pixel-proot-bootstrap-and-start.sh`, or fallback `start-jarvis-pixel.sh`). If not, follow [PIXEL_ONE_PLAN_BADASS_GOD_MODE.md](./PIXEL_ONE_PLAN_BADASS_GOD_MODE.md) or [PIXEL_MAKE_IT_WORK.md](./PIXEL_MAKE_IT_WORK.md) first.
- **On the Pixel:** Termux has `sshd` running (port 8022) so the Mac can SSH in.

---

## 2. Install Tailscale

**On the Pixel**

- Install the Tailscale app: [https://tailscale.com/download/android](https://tailscale.com/download/android) (or Play Store / F-Droid).
- Open Tailscale, sign in with your account, and approve the device if your tailnet requires it.
- Note the **Tailscale IP** shown in the app (e.g. `100.75.3.115`). You’ll use this from the Mac.

**On the Mac**

- Install Tailscale: [https://tailscale.com/download](https://tailscale.com/download) (macOS).
- Sign in with the **same** Tailscale account as the Pixel.

---

## 3. Use the Tailscale IP (or Wi‑Fi IP)

The JARVIS stack binds to all interfaces (`BIND_LAN=1`), so it’s reachable on **both** the Pixel’s Wi‑Fi IP (e.g. `192.168.86.209`) and its Tailscale IP (e.g. `100.75.3.115`).

- **Same Wi‑Fi:** Use the Wi‑Fi IP (Settings → Wi‑Fi → your network). Faster, no Tailscale needed.
- **Away / different network:** Use the Tailscale IP so the Mac can reach the Pixel over your tailnet.

**Option A — Set IP once, all scripts use it**

From the repo root on your Mac:

```bash
./scripts/pixel-refresh-ip.sh 100.75.3.115
```

Replace `100.75.3.115` with the IP from the Tailscale app on the Pixel. This writes to `.pixel-ip`. Scripts that read `.pixel-ip` or `JARVIS_PIXEL_IP` will then use the Tailscale IP:

- **SSH:** `./scripts/ssh-pixel.sh`, `./scripts/ssh-pixel-logs.sh`, `./scripts/ssh-pixel-start-jarvis.sh`, `./scripts/pixel-sync-and-start.sh`
- **Chat from Mac:** `./scripts/jarvis-chat "hello"`, `./scripts/jarvis-chat-gui`
- **Health check:** `./scripts/pixel-health-check-and-restart.sh`
- **Hybrid UI:** `./scripts/start-jarvis-ui-hybrid.sh`

**Option B — Pass IP per command**

```bash
./scripts/ssh-pixel.sh 100.75.3.115
./scripts/pixel-sync-and-start.sh 100.75.3.115
JARVIS_PIXEL_IP=100.75.3.115 ./scripts/jarvis-chat "hello"
```

**Option C — Use the browser on the Mac**

- **Chat:** http://100.75.3.115:18888  
- **Gateway:** http://100.75.3.115:18789  

(Replace with your Pixel’s Tailscale IP.)

---

## 4. Quick checks

| Check | Command |
|-------|--------|
| SSH reachable | `nc -z 100.75.3.115 8022` or `./scripts/ssh-pixel.sh 100.75.3.115` |
| Chat server | `curl -s -o /dev/null -w "%{http_code}" http://100.75.3.115:18888/` (expect 200) |
| Gateway | `curl -s http://100.75.3.115:18789/` (expect response) |

If SSH fails, on the Pixel open Termux and run `sshd`. If chat/gateway fail, on the Pixel run `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`.

---

## 5. Sync and start from Mac (over Tailscale)

Once `.pixel-ip` is set to the Tailscale IP (or you pass it):

```bash
./scripts/pixel-sync-and-start.sh
```

You’ll be prompted for your Termux SSH password unless you’ve run `./scripts/setup-ssh-keys-to-pixel.sh` with that IP. SSH works over Tailscale the same as over Wi‑Fi (port 8022).

---

## 6. Troubleshooting

- **“No other devices” on Mac in Tailscale:** Same account on Pixel and Mac; complete sign-in on Pixel until it shows “Connected” and a 100.x.x.x IP; approve the device at [admin.tailscale.com](https://admin.tailscale.com) if your tailnet uses approval.
- **Connection refused on 18888/18789:** JARVIS stack not running on the Pixel. In Termux: `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`.
- **SSH connection refused (8022):** In Termux on the Pixel run `sshd`; ensure Tailscale is connected so the Pixel has a 100.x.x.x address.

---

## See also

- [PIXEL_OPTIONAL_STEPS.md §2 — Tailscale](./PIXEL_OPTIONAL_STEPS.md#2-tailscale-remote-access-to-jarvis): short version (chat/gateway URLs).
- [JARVIS_CHAT_FROM_MAC.md](./JARVIS_CHAT_FROM_MAC.md): jarvis-chat and jarvis-chat-gui (work with any Pixel IP, including Tailscale).
- [JARVIS_EDGE_AND_PIXEL_FARM.md](./JARVIS_EDGE_AND_PIXEL_FARM.md): using the Pixel gateway from the deployed app via Tailscale.
