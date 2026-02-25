# JARVIS Owns Shipping

**Goal:** JARVIS is the **single owner** of the ship flow. When the user says "ship [product]" or when in deep-work execution, JARVIS runs build → quality → deploy end-to-end and reports. He does not defer the mechanics of shipping to the user.

---

## 1. What “JARVIS owns shipping” means

- **Owner** = JARVIS runs the full flow (build, quality, deploy) when it’s in scope. He does not say “I can’t deploy” or “you’ll need to run the deploy step” unless a guardrail blocks it (e.g. missing token, destructive action).
- **In scope** = The product has **shipAccess: true** in products.json (or the user is in deep-work execution for a product with deepWorkAccess/shipAccess), and the user said “ship,” “release,” “deploy,” or the plan includes shipping.
- **Flow** = (1) Build (build_server_pipeline), (2) Quality (BEAST MODE before deploy), (3) Deploy (workflow_dispatch or platform CLI). See **jarvis/TOOLS.md** → Build, test, deploy — default flow. **Quality gate:** Before deploy, the BEAST MODE quality gate must pass (e.g. quality score acceptable or quality workflow success); do not deploy if it failed or was skipped.
- **Guardrails** = No force-push, no committing secrets, no destructive actions without explicit user ask. If something is blocked (e.g. no GITHUB_TOKEN), JARVIS says so and gives the one fix or alternative.

---

## 2. Where it’s written

| Place | What it says |
|-------|----------------|
| **jarvis/IDENTITY.md** | “You own shipping” — for products with shipAccess, JARVIS runs build → quality → deploy; he does not defer to the user. |
| **jarvis/SOUL.md** | “You own shipping” — when user says ship or in execution, JARVIS runs the flow; single owner. |
| **jarvis/AGENTS.md** | “JARVIS owns shipping” — run build_server_pipeline → quality → deploy; do not hand off to the user for the deploy step. |
| **jarvis/TOOLS.md** | Build server and deploy as default flow; shipAccess in products.json. |
| **docs/JARVIS_FULL_ACCESS_ONE_PRODUCT.md** | How to give a product shipAccess and elevated exec. |

---

## 3. Enabling shipping for a product

1. **products.json** — Set **`"shipAccess": true`** on the product. Only then is JARVIS allowed to commit, push, and deploy for that repo (within guardrails).
2. **Gateway** — Elevated exec allowed for the channel (Discord, web, CLI) so JARVIS can run git, deploy CLIs, and scripts. See **docs/JARVIS_FULL_ACCESS_ONE_PRODUCT.md**.
3. **Secrets** — GITHUB_TOKEN (and any deploy tokens, e.g. Vercel, Railway) available to the gateway (e.g. ~/.clawdbot/.env or Vault).
4. **Build server** — Running (e.g. LaunchAgent) so **build_server_pipeline(repo)** works. If it’s down, JARVIS reports that and suggests starting it.

---

## 4. Autonomous shipping (no human in the loop)

When you want **releases without a human trigger**, use **scripts/run-autonomous-release.js**: build → quality → deploy for one product, triggered by cron or GitHub Action. JARVIS “owns” that flow in chat; the script owns it on a schedule. See **docs/AUTONOMOUS_RELEASES.md**.

---

## 5. Summary

- **JARVIS owns shipping** = He runs build → quality → deploy when the user says ship (or in execution) for products with shipAccess. He executes and reports; he does not hand off the deploy step to the user.
- **Enable per product** = shipAccess in products.json + elevated exec + secrets + build server.
- **Autonomous** = run-autonomous-release.js on a schedule; same flow, no human in the loop.
