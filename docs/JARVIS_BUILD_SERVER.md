# JARVIS Build Server

A small HTTP service that runs **builds** (and optionally `npm install`) for configured repos. JARVIS can trigger builds via the **build-server** skill instead of running `npm run build` directly with exec.

---

## Why

- **Single place** for builds: one process, one port. Cron or autonomous scripts can POST to it; JARVIS uses the skill.
- **Controlled** timeout and log capture; no need to give JARVIS raw exec for every build.
- **Config-driven** repo paths: `build-server-repos.json` (or products.json + repos-cache) so the server knows where each repo lives.

---

## 1. Start the build server (default: run with JARVIS)

From the JARVIS repo root:

```bash
node scripts/build-server.js
```

- Listens on **http://127.0.0.1:18790** (or `BUILD_SERVER_PORT`).
- **Default:** Start in background so it is always available for JARVIS:

```bash
node scripts/start-build-server-background.js
```

- Or run in foreground in a separate terminal. JARVIS uses the build server for **build**, **test**, and **pipeline** (install → build → test) by default — see TOOLS.md → "Build, test, deploy — default flow".

**Start at login (macOS):** So the build server runs after every reboot:

```bash
node scripts/install-build-server-launchagent.js
```

Then the build server starts automatically at login. Restart it with: `launchctl kickstart -k gui/$(id -u)/com.jarvis.build-server`.

**When you open Cursor:** Use the task **Start JARVIS services** (see **.vscode/README.md**). It starts the build server and gateway if they’re not running. You can allow it to run automatically when you open the JARVIS folder (Tasks: Allow Automatic Tasks in Folder).

---

## 2. Configure repo paths

Optional: create **`build-server-repos.json`** in the JARVIS repo root:

```json
{
  "JARVIS": "/Users/you/JARVIS",
  "olive": "/Users/you/olive",
  "BEAST-MODE": "/Users/you/BEAST-MODE"
}
```

- If you omit it, the server uses **JARVIS** = this repo root and other names from **products.json** → **~/.jarvis/repos-cache/<repo>** (same layout as the indexer). So if you run `node scripts/index-repos.js`, those paths exist; otherwise add them to `build-server-repos.json`.

Copy from **`build-server-repos.json.example`** and edit paths.

---

## 3. Trigger a build

**From JARVIS (skill):**  
Say e.g. "build olive" or "run the build server for JARVIS". JARVIS calls **build_server_build** with `repo` (and optional `command: "install"`). The build server must be running.

**From the command line:**

```bash
curl -X POST http://127.0.0.1:18790/build \
  -H "Content-Type: application/json" \
  -d '{"repo":"JARVIS"}'
```

Optional: `{"repo":"olive","command":"install"}` for `npm install` only.

**Response:** JSON with `success`, `exitCode`, `durationMs`, `stdout`, `stderr` (last ~8k chars each).

---

## 4. Skill: build-server

- **build_server_build** — `repo` (required), `command` (optional: `"build"` | `"install"`). Runs the build (or install) and returns success/failure and a log tail.
- **build_server_health** — Check if the build server is reachable.

The gateway loads the skill from **skills/build-server/** (or via extraDirs). Restart the gateway after adding the skill if it was not already loaded.

---

## 5. Env

| Env | Meaning |
|-----|--------|
| **BUILD_SERVER_PORT** | Port for the server (default 18790). |
| **BUILD_SERVER_TIMEOUT_MS** | Max time per build (default 300000 = 5 min). |
| **BUILD_SERVER_URL** | URL the skill uses (default http://127.0.0.1:18790). Set if the server runs on another host/port. |

---

## Summary

| Step | Action |
|------|--------|
| Start server | `node scripts/build-server.js` |
| Repo paths | Optional `build-server-repos.json`; else JARVIS + products + repos-cache. |
| From JARVIS | "Build olive" → build_server_build(repo: "olive"). |
| From CLI | `curl -X POST http://127.0.0.1:18790/build -d '{"repo":"JARVIS"}'` |

The build server does **not** deploy; it only runs `npm install` and/or `npm run build` in the repo directory. Use **github_workflow_dispatch** or **exec** (e.g. `vercel deploy`) for deploy.
