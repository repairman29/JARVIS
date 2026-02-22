# Code quality: JARVIS and the ops team

How JARVIS, BEAST MODE, and the rest of the operations team **write and ship better code**.

---

## 1. Gates before ship (non-negotiable)

- **Build + test:** Use **build_server_pipeline(repo)** (install → build → test) before deploy. Do not skip. If the pipeline fails, fix the failure before proceeding.
- **Quality:** Run **BEAST MODE** (e.g. `beast-mode quality score` or workflow_dispatch for BEAST-MODE) before deploy. Do not skip the quality step. If quality fails, fix issues before deploying.
- **Lint:** When a repo has `npm run lint` (or equivalent), run it as part of the pipeline or before marking implementation done. Fix lint errors; do not commit with lint failures.

So: **lint/build/test → BEAST MODE quality → deploy**. No shortcuts.

---

## 2. When implementing (JARVIS and subagents)

- **Before marking implementation done:** Run **build_server_pipeline(repo)** or at least `npm run lint` and `npm test` (or the repo’s equivalent). Fix any failures.
- **New behavior:** Add or update tests for new code paths or user-facing behavior. Prefer small, focused tests.
- **Errors:** Handle errors explicitly; avoid silent failures. Log or return clear messages so failures are debuggable.
- **Secrets:** Never commit API keys, tokens, or passwords. Use env, Vault, or repo secrets. If you’re not sure, don’t put it in code.

---

## 3. Code style (readability and maintainability)

- **Names:** Use clear, consistent names (variables, functions, files). Avoid single-letter names except trivial loop indices.
- **Functions:** Prefer small, single-purpose functions. If a function does more than one logical thing, consider splitting it.
- **Comments:** Comment *why* when it’s non-obvious; avoid restating *what* the code does when the code is clear.
- **Types:** In TypeScript or JSDoc repos, add or update types for new code; avoid `any` unless necessary.

---

## 4. Using the quality stack

| Tool / system | When to use |
|---------------|-------------|
| **build_server_pipeline(repo)** | Before every ship; also after significant implementation. |
| **BEAST MODE** (quality score, janitor, vibe restore) | Before deploy; optionally after big refactors. |
| **Code Roach** (analyze pr, health, crawl) | On PRs and when checking codebase health. |
| **workflow_dispatch** (quality/deploy workflows) | When the repo has GitHub Actions for lint/test/quality; use instead of or in addition to local run. |

JARVIS is the **conductor**: he runs these gates and does not skip them when shipping. See **jarvis/AGENTS.md** and **docs/JARVIS_OWNS_SHIPPING.md**.

---

## 5. Cursor / human edits

When **you** (or Cursor) edit code in JARVIS or BEAST-MODE:

- Run **`npm run lint`** and **`npm test`** (or the repo’s scripts) before committing.
- Consider adding a **Cursor rule** (e.g. in `.cursor/rules/`) that says: run lint and test before marking done; follow CODE_QUALITY.md. See **.cursor/skills/create-rule/SKILL.md** if you use it.

---

**TL;DR:** Lint and test before marking done; run BEAST MODE before deploy; don’t skip quality. Write clear names, small functions, explicit error handling, and tests for new behavior. No secrets in code.
