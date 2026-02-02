# JARVIS UI — Design direction

**Goal:** Something people love using.

---

## Design principles

1. **Distinctive, not generic** — One strong font, one clear accent, subtle depth. No "template" feel.
2. **Motion with purpose** — Transitions on open/close and state changes. Respect `prefers-reduced-motion`.
3. **Depth and focus** — Elevation and focus states so hierarchy is obvious; primary actions feel clickable.
4. **Micro-delight** — Hover/focus on every interactive thing; small feedback (e.g. copy "Copied") so the UI feels responsive.

---

## Visual

- **Typography:** Display font for product/headings (e.g. Outfit). Clean sans for body. Monospace for code.
- **Accent:** One primary color (e.g. cyan/teal or a warmer blue) used for links, primary actions, focus rings.
- **Depth:** Soft shadows and slight elevation on header, modals, panels. Not flat.
- **Motion:** ~150–200ms ease for panels/modals; optional subtle message appear. No flashy animation.

---

## UX

- Keep **keyboard-first**, **accessible**, and **session-aware** (per JARVIS UI spec).
- Copy and empty states should be friendly and actionable.
- Errors: clear, one-line, with retry when relevant.

---

## What we're *not* doing

- No decorative animation or heavy branding. Stay professional.
- No breaking existing behavior or E2E tests.

---

*Living doc. Update as the product evolves.*
