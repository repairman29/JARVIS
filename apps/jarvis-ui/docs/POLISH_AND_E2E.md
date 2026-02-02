# JARVIS UI — Polish & E2E testing

How we polish the experience and how to run and extend E2E tests.

---

## 1. Polish: interactive surfaces

**Goal:** Every clickable thing feels responsive and visible (hover, focus, transitions).

### Design tokens (globals.css)

- **Surfaces:** `--bg`, `--bg-elevated`, `--border`
- **Accent:** `--accent`, `--accent-hover`, `--accent-glow` (focus ring)
- **Motion:** `--transition-fast`, `--transition-normal`, `--ease`
- **Depth:** `--radius-sm/md/lg`, `--shadow-sm/md/lg`

Use these in components instead of hard-coded values so light/dark and motion prefs stay consistent.

### CSS classes

- **`.btn-surface`** — Buttons and button-like controls. Adds:
  - Transition on background, color, border, box-shadow
  - Hover: slightly elevated background
  - `:focus-visible`: 2px accent outline + soft glow (keyboard users)

- **`.composer-input`** — Main message textarea. Adds:
  - Transition on border and box-shadow
  - `:focus-visible`: accent border + glow

Apply `btn-surface` to every header/tool button (Session, Copy thread, Save transcript, Skills, Settings, Done, Close, session list options). Use `composer-input` on the composer textarea.

### Motion

- Modals/panels: overlay fades in; content uses `modal-in` (scale) or `panel-slide-in` (slide from right).
- `prefers-reduced-motion: reduce` disables those animations (keyframes still defined; duration set to 0 in globals).

### Checklist when adding new UI

1. Use design tokens for color, radius, shadow.
2. Add `btn-surface` to new buttons (or a dedicated class for primary/secondary if needed).
3. Add `data-testid` for any element E2E will need to click or assert on.
4. Ensure focus order and one visible focus ring (e.g. `:focus-visible`) for keyboard users.

---

## 2. E2E testing with Playwright

### Run tests

From repo root or `apps/jarvis-ui`:

```bash
cd apps/jarvis-ui
npm run test:e2e
```

Playwright will start the dev server on port 3001 if it isn’t already running (`reuseExistingServer: true`). No gateway or Edge required for the current specs.

### What’s covered

| Spec | What it tests |
|------|----------------|
| **smoke.spec.ts** | Load, JARVIS header, composer, session dropdown, status, Settings/Skills buttons, empty state |
| **composer.spec.ts** | Input, slash hint, `/clear`, `/tools` opens Skills, Escape clears |
| **settings.spec.ts** | Open Settings modal, Session ID + Backend, Done closes, Escape closes |
| **skills.spec.ts** | Open Skills panel, skill list, Close closes, Escape closes |
| **session.spec.ts** | Session dropdown, New session, switch session |
| **export.spec.ts** | Copy thread / Save transcript appear after at least one message |

All use **Chromium** only. See `playwright.config.ts` for baseURL (default `http://localhost:3001`), timeouts, and webServer.

### How to add or change tests

1. **Selectors:** Prefer `page.getByTestId('...')` for stability. Add `data-testid` in components when needed.
2. **Timing:** Use `await expect(...).toBeVisible({ timeout: 5000 })` (or 10000 for first paint) instead of raw `page.waitForTimeout`.
3. **Flakiness:** If a test fails only sometimes, wait for a specific element (e.g. modal content) before asserting, and use test IDs.
4. **New flows:** Add a new `test.describe` in the right spec file (or a new file under `e2e/`). Follow the same pattern: goto `/`, wait for key element, interact, assert.

### CI

Set `CI=true` when running in CI. The config then uses 2 retries and 1 worker. Optional: set `PLAYWRIGHT_BASE_URL` if the app is served elsewhere.

### Manual check

See [MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md) for a human checklist (including gateway/Edge flows). The bash script `scripts/e2e.sh` hits HTTP endpoints only; Playwright covers the UI.

---

## 3. Quick reference

| Task | Command |
|------|--------|
| Run E2E | `cd apps/jarvis-ui && npm run test:e2e` |
| E2E with UI | `npm run test:e2e:ui` |
| Dev server | `npm run dev` (port 3001) |
| Fresh dev (clear cache) | `npm run dev:fresh` |

After changing polish (e.g. new classes or tokens), run `npm run test:e2e` once to confirm nothing breaks.
