# SSH next steps (you already ran `sshd` in Termux)

Do these **on your Mac**, in order.

**Two IPs:** If your Pixel has **Tailscale**, you have two IPs. Use **Wi‑Fi IP** (e.g. `192.168.86.209`) when Mac and Pixel are on the same network; use **Tailscale IP** (e.g. `100.75.3.115`) when you’re away so the Mac can reach the Pixel over the tailnet. Set whichever you use most in Step 2; you can switch later with `./scripts/pixel-refresh-ip.sh <ip>`.

---

## Step 1: Get your Pixel’s IP address

**Easiest:** On the phone go to **Settings → Network & internet → Wi‑Fi → tap your network** and note the IP (e.g. **192.168.86.209**).

**Or in Termux** (if `ip` says “cannot bind netlink socket”, use `ifconfig` instead):

```bash
ifconfig wlan0 | grep "inet "
```

You’ll see something like `inet 192.168.86.209`. That number is your IP.

---

## Step 2: Put your Mac’s key on the Pixel (one time)

**On the Mac**, in Terminal, go to the JARVIS folder and run (use your Pixel’s IP from Step 1):

```bash
cd ~/JARVIS
bash scripts/setup-ssh-keys-to-pixel.sh 192.168.86.209
```

Replace **192.168.86.209** with your Pixel’s IP if it’s different.

- When it asks for a **password**, type the password you set in Termux (with `passwd`). If you never set one, in Termux run `passwd` first and choose a password.
- If it says **Permission denied (publickey)**: on the **Pixel** in Termux run once:  
  `mkdir -p ~/.ssh && chmod 700 ~/.ssh`  
  then run the Mac command again.
- If it says **Who are you?** or the username is wrong: in Termux run `whoami` and note the result (e.g. `u0_a310`). Then on the Mac run:  
  `TERMUX_USER=that_username bash scripts/setup-ssh-keys-to-pixel.sh 192.168.86.209`

When it says **Done**, you won’t need to type the password again for SSH. Your Pixel IP is saved so you don’t have to type it every time.

---

## Step 3: Start JARVIS and see logs from the Mac

**On the Mac**:

```bash
cd ~/JARVIS
bash scripts/pixel-do-it-all.sh
```

(If you didn’t run Step 2 with your IP, add it: `bash scripts/pixel-do-it-all.sh 192.168.86.209`.)

This will push code (if needed), start JARVIS in Proot on the Pixel, and show you the logs.  
On the Pixel you can open **Chrome → http://127.0.0.1:18888** to use JARVIS.

---

## Later: only tail logs (no start)

```bash
cd ~/JARVIS
bash scripts/tail-pixel-jarvis-boot.sh
```

Add your Pixel IP if needed: `bash scripts/tail-pixel-jarvis-boot.sh 192.168.86.209`.  
Add `--follow` to keep updating: `bash scripts/tail-pixel-jarvis-boot.sh --follow`

---

## Clean up Pixel Download folder

After JARVIS is installed and running, remove one-time tarballs and scripts from the Pixel’s Download folder (from the Mac):

```bash
cd ~/JARVIS
bash scripts/pixel-cleanup-downloads-remote.sh
```

This removes: `JARVIS.tar.gz`, `neural-farm.tar.gz`, `setup-jarvis-termux.sh`, launcher/copy scripts, and copied log files. It does not touch `~/JARVIS` or `~/neural-farm` on the Pixel.

---

**Summary:** Step 1 = get IP. Step 2 = run `setup-ssh-keys-to-pixel.sh <IP>` (one time, enter Termux password). Step 3 = run `pixel-do-it-all.sh <IP>`.
