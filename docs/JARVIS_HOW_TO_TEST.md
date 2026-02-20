# How to test JARVIS (Pixel LLM, parallel delegation, web repo access)

One-place checklist to verify: Pixel/model routing, parallel delegation, and web UI repo access.

---

## Prerequisites

- **Gateway:** Running (local: `node scripts/start-gateway-with-vault.js` from repo root; or cloud gateway that your UI/Edge use).
- **Pixel (optional):** Stack running, SSH on (e.g. `sshd` in Termux), `.pixel-ip` or `JARVIS_PIXEL_IP` set if testing from Mac.
- **Web UI (optional):** `apps/jarvis-ui` dev server or deployed app; if cloud, Edge redeployed so web gets repo-access prompt.

---

## 1. Test Pixel LLM speed and model routing

**From Mac (Pixel on same network, SSH on):**
```bash
cd ~/JARVIS
./scripts/pixel-llm-speed-test-from-mac.sh
```
**Success:** Prints latency for each backend (8888, 8887, 8890); fastest is listed.

**Test each InferrLM model by name (on Pixel):**
```bash
ssh -p 8022 u0_a310@<pixel-ip> "cd ~/JARVIS && node scripts/pixel-llm-test-models.js"
```
**Success:** Each model (e.g. Gemma 4B, Gemma 1B, Granite 1B) returns a completion when requested by id.

**Chat from Mac → Pixel:** Run chat GUI, send a message, get a reply.
```bash
./scripts/jarvis-chat-gui
# Open http://localhost:9191, send e.g. "What's the time?"
```
**Success:** Reply comes back (from Nano or InferrLM depending on chat-task routing).

---

## 2. Test parallel delegation

**One-shot (time + repo summary):**
```bash
cd ~/JARVIS
./scripts/jarvis-test-parallel-delegation.sh
```
**Success:** One reply with (1) current time and (2) a short JARVIS repo summary.

**Other tests (see doc for full prompts):**
```bash
./scripts/jarvis-test-parallel-delegation.sh 2   # time + DECISIONS.md
./scripts/jarvis-test-parallel-delegation.sh 3   # spawn two subagents
./scripts/jarvis-test-parallel-delegation.sh 4   # quality + health (needs BEAST MODE / Code Roach)
```

Full prompts and success criteria: **docs/JARVIS_PARALLEL_DELEGATION.md** § 7.

---

## 3. Test web UI repo access

**In the web UI (browser):** Open your JARVIS UI (e.g. localhost:3001 or deployed URL). Send:

- *"Give me a one-sentence repo_summary of the JARVIS repo."*
- *"Search the JARVIS repo for 'parallel delegation' and tell me what you find."*

**Success:** JARVIS uses repo tools and returns a summary or search result (and cites, e.g. "From repo_summary(JARVIS): …"). He does **not** say "I don't have repo access" or "use Cursor for that."

**If he still says no repo access:** Ensure (1) gateway has `agents.defaults.workspace` set (e.g. to `.../JARVIS/jarvis`), (2) repo index has been run (`node scripts/index-repos.js` or `--repo JARVIS`), (3) gateway restarted and, if using cloud, Edge redeployed. See **RUNBOOK.md** → "Web UI says no repo access."

---

## 4. Quick smoke (no Pixel)

**Chat one-shot (local gateway):**
```bash
cd ~/JARVIS
./scripts/jarvis-chat "What's the current time?"
```
**Success:** A time string in the reply.

**Parallel delegation Test 1 (time + repo summary):**
```bash
./scripts/jarvis-test-parallel-delegation.sh 1
```
**Success:** One reply with time and a JARVIS repo summary.

---

## 5. Where things live

| What | Doc / script |
|------|----------------|
| Pixel speed test | `scripts/pixel-llm-speed-test-from-mac.sh`, `scripts/pixel-llm-speed-test.js` |
| Pixel model test (per-model by name) | `scripts/pixel-llm-test-models.js` |
| Model guide (what each model is for) | `docs/PIXEL_LLM_MODEL_GUIDE.md` |
| Parallel delegation tests | `scripts/jarvis-test-parallel-delegation.sh`, `docs/JARVIS_PARALLEL_DELEGATION.md` § 7 |
| Web repo access | Updated prompts in `apps/jarvis-ui/app/api/chat/route.ts` and `supabase/functions/jarvis/index.ts`; RUNBOOK "Web UI says no repo access" |
| Pixel phase tests (full device) | `scripts/pixel-phase-tests.sh`, `scripts/pixel-test-phases-on-device.sh` |
