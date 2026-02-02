# Decision Memory — Remembering What We Decided

**Goal:** When the user says "remember this decision" or "we decided X," JARVIS stores it somewhere durable so it can be referenced later (planning, deep work, or "what did we decide about Y?").

---

## Convention

- **Where:** A **DECISIONS.md** file in the repo root (or in the product repo when the decision is product-specific). Format: date, one-line summary, optional 1–2 sentences.
- **When:** User says "remember this decision," "we decided X," "document this decision," or similar.
- **What JARVIS does:** Append to DECISIONS.md (or create it) with a short entry: date, decision summary, optional context. When planning or answering "what did we decide about X?", JARVIS can **repo_search** for "decision" or **repo_file** for DECISIONS.md and use it as context.

---

## Example entry

```markdown
## 2025-02-01 — Use Vercel for Olive frontend deploys
We use Vercel for olive (shopolive.xyz) frontend; Railway for backend. Don't suggest Netlify for olive.
```

---

## Instructions for JARVIS

- When the user says **"remember this decision"** or **"we decided X"**: Append to **DECISIONS.md** in the current repo (or product repo if in deep work) with today's date and a one-line summary (and 1–2 sentences if needed). If the file doesn't exist, create it with a short heading (e.g. "# Decisions") and the entry.
- When **planning** or when the user asks **"what did we decide about X?"**: Use **repo_search** for "decision" or **repo_file** for DECISIONS.md to recall relevant decisions and use them as context.
- Keep entries **short** so the file stays scannable.

---

## Optional: product-specific decisions

For product-specific decisions (e.g. "we decided olive uses Kroger OAuth only"), put **DECISIONS.md** in that product's repo (e.g. olive) so when JARVIS does deep work on that product, repo_summary/repo_file will include it. Or keep one DECISIONS.md in JARVIS repo and use sections per product.

**TL;DR:** DECISIONS.md = durable memory for "we decided X." JARVIS appends when the user asks to remember; JARVIS reads it (repo_search/repo_file) when planning or when the user asks what we decided.
