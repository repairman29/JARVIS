# Dev and delivery tools: go faster

**How we improve development speed and delivery.** Use this to pick tooling that fits the JARVIS stack (Node/Next, monorepo-friendly, Vercel/Railway, BEAST MODE, build server).

**Related:** [jarvis/CODE_QUALITY.md](../jarvis/CODE_QUALITY.md) (gates before ship), [RUNBOOK.md](../RUNBOOK.md) (day-to-day ops).

---

## 1. What we just did

- **jarvis-ui:** Migrated **middleware → proxy** (Next 16). Renamed `middleware.ts` → `proxy.ts`, `middleware()` → `proxy()`. Build is clean; no deprecation warning.
- **jarvis-ui:** Lint fixed and enforced: ESLint 9 flat config (TypeScript + React), `npm run lint` runs before ship. See [jarvis/CODE_QUALITY.md](../jarvis/CODE_QUALITY.md).

---

## 2. Current stack (already speeding us up)

| Layer | What we use | Why it helps |
|-------|-------------|--------------|
| **Build / test** | build_server_pipeline(repo), npm run lint / test | Single command; no skipping. |
| **Quality** | BEAST MODE (quality score, janitor), Code Roach (PR/health) | Automated review and cleanup before ship. |
| **Deploy** | Vercel (jarvis-ui), Railway (gateway), GitHub Actions (Pages, skills tests) | Preview URLs, one-command deploy, path-based CI. |
| **Lint** | ESLint + typescript-eslint + React (jarvis-ui), next/core-web-vitals–style rules | Catch bugs and style issues before merge. |
| **Orchestration** | workflow_dispatch, sessions_spawn, PREBUILT_WORKFLOWS | JARVIS runs quality and deploy; less manual handoff. |
| **Knip bot** | `.github/workflows/knip-bot.yml` | On PRs that touch `apps/jarvis-ui`, runs Knip and posts/updates a single comment with unused files, deps, exports. No merge block; report only. |
| **CodeQL** | `.github/workflows/codeql.yml` | Security/code scanning on push/PR + weekly; results in Security tab. |
| **E2E on preview** | `.github/workflows/jarvis-ui-e2e-preview.yml` | On jarvis-ui PRs: build → Vercel preview deploy → Playwright. Needs VERCEL_TOKEN. |

**CI vs pre-ship gate:** CI (lint, build, Knip, CodeQL) runs on push/PR. JARVIS still runs **build_server_pipeline** and **BEAST MODE** before deploy so the pre-ship quality gate is consistent whether changes come from a human or from JARVIS.

---

## 3. Tool landscape (investigated)

### 3.1 Monorepo build cache (faster CI and local)

- **Turborepo** – Task cache keyed by inputs; remote cache (e.g. Vercel). Good for `npm run build` / `lint` / `test` across apps. Setup: `npx create-turbo@latest` or add `turbo.json` to existing repo.
- **Nx** – Similar idea; often **faster in large monorepos** (smarter restore, optional distributed runs). More features (e.g. module boundaries, e2e splitting) and steeper config.
- **When to add:** If we add more apps or CI runs get slow, introduce Turborepo first (simpler); consider Nx if the repo grows a lot and we need advanced caching/features.

### 3.2 Lint / format / hygiene (run in CI and pre-commit)

- **ESLint + Prettier** – What we use in jarvis-ui (ESLint flat config; Prettier optional). Keep as baseline.
- **Biome** – Single tool for lint + format (replaces ESLint + Prettier). Faster runs, one config. Tradeoff: different rule set and migration effort.
- **Trunk Check** – Runs 50+ linters/formatters in one CLI; CI integration (`trunk check --ci`), caching, PR annotations. Good if we want one command to run ESLint, Prettier, typecheck, etc., with minimal per-repo config.
- **Recommendation:** Stay on ESLint for now; add **Trunk** only if we want a single “run everything” entrypoint and PR decorations without changing rules.

### 3.3 Dead code and dependencies (less noise, smaller bundles)

- **Knip** – Finds unused files, exports, and dependencies in TS/JS. Can auto-fix and integrate with Biome/Prettier. Fits our Node/Next apps.
- **dependency-cruiser** – Enforces dependency rules (no circular deps, layering). Optional for stricter architecture.
- **Recommendation:** Add **Knip** (e.g. `npx knip`) to jarvis-ui and root; run in CI or before ship to trim unused deps and exports.

### 3.4 Deep analysis and security (quality gates)

- **SonarQube / SonarCloud** – Quality gates, duplication, security hotspots, PR decoration. Cloud free tier for public repos.
- **Semgrep** – SAST; custom rules; CI integration; good for security and custom patterns.
- **CodeQL (GitHub)** – Semantic code analysis; security alerts and PR checks. Free for public repos.
- **Recommendation:** If we want a single “quality gate” number: **SonarCloud** (or SonarQube self-hosted). For security-only: **CodeQL** + **Semgrep** in GitHub Actions.

### 3.5 CI/CD and previews (faster, reliable delivery)

- **GitHub Actions** – We already use it (test-skills, upshift-app-scan, jarvis-ui E2E, etc.). Site/docs deploy is via Vercel; no GitHub Pages. Add jobs for jarvis-ui lint/build and optional E2E as needed.
- **Vercel for GitHub** – Auto preview per PR; no extra workflow needed for jarvis-ui if repo is connected.
- **Vercel + Actions (advanced)** – Use `vercel build` + `vercel deploy --prebuilt` when we need custom steps before deploy; use a **preview URL poller** so E2E runs only when the preview is ready (avoids flaky “deploy not ready” failures).
- **Railway** – Preview deploys via GitHub integration or actions like `railway-preview-deploy` for PRs.
- **Recommendation:** Ensure jarvis-ui is wired to Vercel with previews; add a **jarvis-ui CI workflow** that runs `npm run lint` and `npm run build` on push/PR to `apps/jarvis-ui` (and optionally E2E against preview URL).

### 3.6 AI-assisted review and fixes

- **GitHub Copilot / Cursor** – In-editor; we already use Cursor. No extra pipeline.
- **Propel Code, etc.** – Automated PR review and fix suggestions. Use if we want bot comments with fix diffs; combine with deterministic lint/test, don’t rely on AI alone for gates.
- **Recommendation:** Keep human + BEAST MODE + lint/test as source of truth; use AI for suggestions and speed, not as the only quality gate.

---

## 4. Prioritized next steps

| Priority | Action | Impact | Effort |
|----------|--------|--------|--------|
| **1** | Add **GitHub Actions workflow for jarvis-ui**: lint + build on push/PR to `apps/jarvis-ui` (and root if it affects the app). | Catch breaks before merge; no manual “did you run lint?” | Low |
| **2** | ~~Run Knip in CI~~ **Done:** Knip in jarvis-ui CI + **Knip bot** posts report on PRs (`.github/workflows/knip-bot.yml`). Optionally run `knip --fix` locally or add a JARVIS-invokable “knip report” workflow. | Visibility on PRs; optional auto-fix later. | — |
| **3** | **Done:** Vercel previews when project connected. **E2E on preview:** `.github/workflows/jarvis-ui-e2e-preview.yml` (build → deploy → Playwright). Requires **VERCEL_TOKEN**. See § 4b. | Faster feedback. | — |
| **4** | Consider **Turborepo** at repo root if we add more apps or CI time grows: cache `build`/`lint`/`test` per package. | Faster CI and local runs. | Medium |
| **5** | **Done:** **CodeQL** (`.github/workflows/codeql.yml`) on push/PR + weekly. Results in Security → Code scanning. SonarCloud still optional. | Security visibility. | — |

---


## 4b. Vercel previews and E2E on preview

- **Preview URLs:** Connect the Vercel project for jarvis-ui to this repo (Vercel → Project → Settings → Git). Each PR gets a preview deployment; Vercel posts the URL in the PR or deployment status.
- **E2E against preview:** Workflow **jarvis-ui E2E (preview)** runs on PRs that change `apps/jarvis-ui`: build → `vercel deploy --prebuilt` → Playwright with `PLAYWRIGHT_BASE_URL` set to that URL. Add **VERCEL_TOKEN** to repo secrets to enable. Optionally **VERCEL_ORG_ID** and **VERCEL_PROJECT_ID** if the project is not linked. Without the token, the deploy step fails; disable or add the token as needed.

---

## 5. What we’re not changing (by design)

- **BEAST MODE and build server** – Remain the canonical “quality + build” path for JARVIS-driven work. CI and tools complement them, not replace.
- **Orchestration** – workflow_dispatch, sessions_spawn, and PREBUILT_WORKFLOWS stay; tools run inside or alongside them.
- **Vercel + Railway** – No need to switch; we optimize for faster feedback and clearer gates on top of them.

---

## 6. References

- [Next 16: middleware → proxy](https://nextjs.org/docs/messages/middleware-to-proxy)
- [Turborepo caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Nx caching](https://nx.dev/docs/concepts/how-caching-works)
- [Trunk Check CI](https://docs.trunk.io/code-quality/ci-setup/manual-setup)
- [Knip](https://knip.dev)
- [SonarQube quality gates](https://docs.sonarsource.com/sonarqube-server/latest/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates)
- [Semgrep in CI](https://semgrep.dev/docs/kb/semgrep-ci)
- [Vercel + GitHub Actions](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [jarvis/CODE_QUALITY.md](../jarvis/CODE_QUALITY.md) – Gates before ship; lint/test/BEAST MODE.

---

**TL;DR:** jarvis-ui: proxy, lint, CI (lint + build + Knip). Knip bot comments on PRs; CodeQL runs on push/PR + weekly; E2E-on-preview workflow (needs VERCEL_TOKEN). Next: Turborepo if CI gets slow. Keep BEAST MODE and build server as main quality path.
