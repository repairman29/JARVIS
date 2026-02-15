# Get logs from the Pixel without copy/paste

Two ways: **ADB fetch** (one command on the Mac) or **SSH into Termux** (full shell from the Mac).

---

## Option A: Fetch logs from the Mac (ADB)

With the Pixel connected (USB or `adb connect <ip>:5555`), run on the **Mac**:

```bash
cd /Users/jeffadkins/JARVIS
./scripts/fetch-pixel-logs.sh
```

That script will:
1. Push `termux-gather-logs.sh` to the Pixel’s Download folder (if needed).
2. Trigger Termux to run it (writes gateway log, plan-execute log, and curl checks to a file).
3. Pull that file to the Mac and print it.

You get the log bundle on the Mac with no copy/paste. If the auto-trigger doesn’t work, run the gather script **on the Pixel in Termux**:

```bash
bash ~/storage/downloads/termux-gather-logs.sh
```

Then on the Mac:

```bash
adb pull /sdcard/Download/jarvis-logs.txt /tmp/
cat /tmp/jarvis-logs.txt
```

---

## Option B: SSH into Termux (full access from the Mac)

Once SSH is set up, you can open a real shell on the Pixel from the Mac and run any command (e.g. `tail ~/gateway.log`, start/stop the gateway, edit files).

**On the Pixel, in Termux (one-time setup):**

```bash
pkg install openssh
passwd          # set a password for the current user
whoami          # note the username (e.g. u0_a258)
sshd            # start the SSH server (listens on port 8022)
```

**On the Mac (easiest):**

```bash
cd /Users/jeffadkins/JARVIS
./scripts/ssh-pixel.sh
```

Uses the same IP as the log script (ADB or cache). You get an interactive shell and stay in until you type `exit`. If your password has `!`, type it as `yourpass\!`.

**Or manually:**

```bash
ssh -p 8022 <username>@<pixel-ip>
# Example: ssh -p 8022 jefe@192.168.86.209
```

Use the password you set. Then you’re in a Termux shell and can run:

- `tail -50 ~/gateway.log`
- `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:18789/`
- `bash ~/JARVIS/scripts/start-jarvis-pixel.sh`
- etc.

**Passwordless SSH (so scripts run without typing a password):**

Run once from the Mac (you’ll be asked for the Termux password one time; after that, never again):

```bash
cd /Users/jeffadkins/JARVIS
./scripts/setup-ssh-keys-to-pixel.sh
```

Then `ssh-pixel-logs-full.sh`, `ssh-pixel-start-jarvis.sh`, `ssh-pixel-diagnose.sh`, and `ssh-pixel.sh` all work without a prompt. If the copy fails, on the Pixel run: `mkdir -p ~/.ssh && chmod 700 ~/.ssh`, then run the setup script again.

**Notes:**  
- Pixel and Mac must be on the same network.  
- `sshd` stops when Termux is killed; run it again after reopening Termux (or use Termux:Boot to run it on start).  
- To find the Pixel IP: in Termux run `ifconfig` or check Wi‑Fi settings on the phone.

---

## Summary

| Goal | Use |
|------|-----|
| **One-time: no password for SSH** | Mac: `./scripts/setup-ssh-keys-to-pixel.sh` (enter password once) |
| Full logs (all stack logs) | Mac: `./scripts/ssh-pixel-logs-full.sh` |
| Quick log snapshot (no shell) | Mac: `./scripts/ssh-pixel-logs.sh` |
| **Interactive shell (stay in)** | Mac: `./scripts/ssh-pixel.sh` |
| Run any command on the Pixel from the Mac | Enable SSH in Termux, then `./scripts/ssh-pixel.sh` or `ssh -p 8022 user@pixel-ip` |
