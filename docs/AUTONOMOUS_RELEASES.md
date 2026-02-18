# Autonomous Releases — How Close Are We?

**Goal:** The team (JARVIS + BEAST MODE, Code Roach, etc.) builds and deploys; releases can happen with **no human in the loop** when conditions are met (e.g. main green, quality pass).

---

## 1. What “autonomous release” means here

- **Build** — Install, build, test (build server or CI).
- **Quality** — BEAST MODE (and optionally Code Roach) run before deploy.
- **Deploy** — Push to prod via `workflow_dispatch` or platform CLI (Vercel, Railway, etc.).
- **Optional:** Version bump, tag, changelog, GitHub release.

**Autonomous** = the **trigger** doesn’t require a human in the loop. Examples: cron runs “release if main is green,” or JARVIS plan-execute is allowed to run the full build → quality → deploy flow when the plan says so.

---

## 2. What’s already in place (team building and deploying)

| Piece | Status | Notes |
|-------|--------|--------|
| **Build** | ✅ | **build_server_pipeline(repo)** (install → build → test). Build server can be called by JARVIS or by scripts. **jarvis-autonomous-build.js** runs build for JARVIS repo on a schedule (no deploy). |
| **Quality before ship** | ✅ | **run-team-quality.js** (BEAST MODE). **run-team-pipeline.js** runs safety net → BEAST → Code Roach → Echeo in sequence. JARVIS is instructed to run BEAST MODE before ship (JARVIS_AGENT_ORCHESTRATION.md). |
| **Deploy** | ✅ | JARVIS can **workflow_dispatch** (deploy workflow in repo) or **exec** (vercel deploy, railway up). Requires **shipAccess** in products.json and elevated exec. **deploy-jarvis.sh** / **jarvis-admin.js** exist for JARVIS repo (GitHub deploy, release, report). |
| **In-chat “ship”** | ✅ | When user says “ship [product],” JARVIS runs build_server_pipeline → then deploy (TOOLS.md, DEEP_WORK_PRODUCT.md). So **human-triggered** build + deploy is there. |
| **Plan-execute** | ⚠️ | Can run tools (github_status, exec, etc.) but **guardrails** say prefer read-only, no force-push, no destructive; “safe write” (draft PR, comment) is ok. So plan-execute is **not** explicitly allowed to run a full “build → quality → deploy” release today; it’s biased toward triage and low-risk steps. |

So: **team building and deploying** = yes when a human says “ship” or “deep work and ship.” **Autonomous** (triggered without human) = only partly: autonomous **build** (jarvis-autonomous-build.js) exists; autonomous **release** (build + quality + deploy in one triggered run) is not wired end-to-end.

---

## 3. Gap to autonomous releases

| Gap | What’s missing |
|-----|----------------|
| **Single “release” flow** | One script or workflow that runs: build (or use CI result) → quality (run-team-quality or BEAST) → deploy (workflow_dispatch or exec). Today build, quality, and deploy are separate; you chain them in chat or run pipeline (which does **not** deploy). |
| **Trigger** | Something that starts that flow without a human: e.g. cron (“daily at 10 AM run release for product X if main is green”), or plan-execute with explicit “you may run the release flow for [product]” and a narrow scope. |
| **Version / tag (optional)** | If “release” means “tag + GitHub release + deploy,” then a version-bump step (or calling a workflow that bumps and tags) is needed. deploy-jarvis.sh creates a release; a generic “release this repo” could call a repo-specific workflow or script. |
| **Guardrails for autonomous deploy** | Plan-execute today is cautious. To allow autonomous releases you either: (a) add a **dedicated script** that only runs build → quality → deploy (no arbitrary exec), or (b) give plan-execute a **clear scope** (“may trigger deploy workflow for repo X when build and quality pass”) and keep other guardrails. |

---

## 4. How close are we? (summary)

| Question | Answer |
|----------|--------|
| **Team building?** | Yes — build server, jarvis-autonomous-build, run-team-pipeline (quality steps). |
| **Team deploying?** | Yes when **you** say “ship” — JARVIS runs build → deploy (and can run quality first). |
| **Autonomous releases?** | **Close.** We have all the pieces (build, quality, deploy); we’re missing a **single triggered flow** and a **trigger** (cron or scoped plan-execute). |

Rough distance: **one script + one trigger** (e.g. cron or “release” mode in plan-execute). Optionally add version/tag to that flow.

---

## 5. Path to autonomous releases

### Option A: Dedicated “autonomous release” script (recommended)

Add a script, e.g. **scripts/autonomous-release.js** (or **run-autonomous-release.js**), that:

1. Reads **product** from env (e.g. `JARVIS_RELEASE_PRODUCT=olive`) or products.json (first with shipAccess).
2. **Build** — Calls build server pipeline for that repo (or exits if build server is down). Alternatively, assume CI already ran (e.g. on push to main) and only run quality + deploy.
3. **Quality** — Runs **run-team-quality.js** for that repo (BEAST MODE). Exits with non-zero if quality fails (or make it configurable).
4. **Deploy** — Calls **github_workflow_dispatch** for that repo’s deploy workflow, or runs a repo-specific deploy command (from config or products.json).
5. Writes a short **status file** (e.g. `~/.jarvis/last-release.json`) with product, timestamp, build/quality/deploy result.
6. Optional: **Version** — Before deploy, run a version-bump script or trigger a workflow that bumps and tags; then deploy.

Trigger: **cron** (e.g. daily at 10 AM) or a GitHub Action that runs on a schedule or on “release” label. No human in the loop.

Guardrails: Script only does the above steps; no arbitrary exec. Safe for autonomous use.

### Option B: Plan-execute with “release” scope

- Add a **second prompt** or mode for plan-execute, e.g. “AUTONOMOUS_RELEASE” or “Today you may run the release flow for [product]: build (or assume CI passed), run quality (run-team-quality), then trigger deploy workflow. No force-push, no secrets.”
- Plan-execute then **decides** when to run each step and calls build_server_pipeline, exec (run-team-quality.js), and workflow_dispatch. Broader than Option A (JARVIS can adapt) but requires trusting the model with deploy.

### Option C: GitHub Actions only

- Each product repo has a **workflow** that runs on schedule (or on workflow_dispatch): build → test → quality (e.g. call BEAST MODE or a shared job) → deploy. JARVIS doesn’t run the steps; he only triggers **workflow_dispatch** when you ask, or a cron job triggers the workflow. So “autonomous” = cron triggers the workflow; no JARVIS in the loop.

---

## 6. Implemented: run-autonomous-release.js

**scripts/run-autonomous-release.js** runs build → quality → deploy for one product (product from env, `--product`, or products.json). Build via build server `/pipeline`; quality via `run-team-quality.js`; deploy via `JARVIS_DEPLOY_CMD` if set. **Version:** After build, reads version from product repo (`package.json` or `VERSION`), writes to `last-release.json`. **Tag:** Use `--tag` to create git tag `v<version>` in the product repo (set `JARVIS_GIT_TAG_PUSH=1` to push). Writes `~/.jarvis/last-release.json`. Use `--no-quality`, `--no-deploy`, or `--dry-run`. **Cron:** Set `JARVIS_RELEASE_PRODUCT` and `JARVIS_DEPLOY_CMD` and run on a schedule. See script header and ORCHESTRATION_SCRIPTS.md.

---

## 7. Recommended next steps

1. **Done:** `scripts/run-autonomous-release.js` (Option A). one product from env/products.json → build (build server) → quality (run-team-quality) → deploy (workflow_dispatch or configurable exec). Status file when done.
2. **Document** the **trigger** (cron example, or “run from GitHub Action on schedule”).
3. **Optional:** Add version/tag step (or call a workflow that does it) before deploy.
4. **Optional:** Let plan-execute run this script (exec `node scripts/run-autonomous-release.js`) when the plan says “run release for [product]” so JARVIS can decide *when* in a plan, but the *what* is fixed by the script.

Then the team is **building and deploying**, and **autonomous releases** are one cron (or one plan-execute run) away.

---

## 8. References

- Build: **docs/JARVIS_BUILD_SERVER.md**, **jarvis/TOOLS.md** (build_server_pipeline).
- Quality: **scripts/run-team-quality.js**, **scripts/run-team-pipeline.js**, **docs/JARVIS_OPTIMAL_TEAM_SETUP.md**.
- Deploy: **jarvis/TOOLS.md** (workflow_dispatch, platform CLIs), **jarvis/DEEP_WORK_PRODUCT.md** (execution phase).
- Guardrails: **docs/JARVIS_AUTONOMOUS_AGENT.md** (plan-execute guardrails), **jarvis/AGENTS.md** (ship access, destructive).
