# Public repo checklist — JARVIS / CLAWDBOT

Use this checklist when **keeping the public repo updated** with only public-facing docs and stripping anything that shouldn’t be there.

---

## 1. Strip / exclude (do not publish as-is)

| Item | Action |
|------|--------|
| **Real Supabase project refs** | All docs must use `YOUR_PROJECT_REF` (or similar), not a real project ID. Run “Replace” below. |
| **Internal-only docs** | **SUPABASE_MCP_SETUP.md** (root) — if it references internal project names or apps (e.g. “smuggler”), either redact to generic (YOUR_PROJECT_REF, “your app”) or do not publish; use **docs/JARVIS_MCP_SUPABASE.md** and **docs/JARVIS_MCP_CURSOR.md** for public MCP setup. |
| **repos.json** | Contains full org repo list (including private). For public: replace with **repos.json.example** (or your own public-only list) before pushing. |
| **products.json** | Contains internal product list. For public: replace with **products.json.example** (or your own public-only list) before pushing. |
| **Secrets / credentials** | `.env`, `.env.*`, `.clawdbot/`, `CREDENTIALS_NOTE.md`, `secrets/` — already in `.gitignore`. Never commit. |
| **User-specific paths** | No hardcoded `c:\Users\jeffa\...` or `/Users/yourname/...`. Use placeholders: “the JARVIS repo folder”, `%USERPROFILE%`, `~/.clawdbot/`. |
| **Private strategy / internal** | `private_strategy/`, `EBAY_*.md`, `reports/`, inventory/DB reports — already in `.gitignore`. |

---

## 2. Replace (before public push)

| Find | Replace with |
|------|------------------|
| `rbfzlqmkwhbvrrfdcain` (project ref) | `YOUR_PROJECT_REF` |
| `https://rbfzlqmkwhbvrrfdcain.supabase.co` | `https://YOUR_PROJECT_REF.supabase.co` |
| `https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain` | `https://supabase.com/dashboard/project/YOUR_PROJECT_REF` |
| `mgeydloygmoiypnwaqmn` (in VAULT_WHY_NOT_AVAILABLE) | `your_other_project_ref` or `YOUR_CURRENT_PROJECT_REF` |

**Files to check:** All of `docs/`, `supabase/README.md`, root `SUPABASE_MCP_SETUP.md`, `olive-e2e/docs/`, `skills/*/` (e.g. KROGER_STATUS.md). Search for any remaining real project refs.

---

## 3. Public-facing only (include)

| Category | Include |
|---------|---------|
| **Docs** | README, DEVELOPER_GUIDE, RUNBOOK, CONTRIBUTING, LICENSE; **docs/** — REPO_INDEX, DOCUMENTATION_MAP, CURSOR_SESSION_ONBOARDING, JARVIS_EDGE_*, JARVIS_MCP_*, JARVIS_UI_*, supabase/README, VAULT_* (with placeholders), Olive docs, BRAVE_SEARCH_SETUP, SETUP_VAULT_AND_ACCESS (placeholders only). |
| **Code** | jarvis/, skills/, apps/jarvis-ui/, supabase/functions/, scripts/ (no scripts that dump secrets or internal DBs). |
| **Config examples** | .env.example, apps/jarvis-ui/.env.example; **repos.json.example**, **products.json.example** (public-safe samples). |
| **Cursor** | .cursor/rules (product-manager.mdc — OK); .cursor/mcp.json is gitignored; ship **.cursor/mcp.json.example** if you have one. |

---

## 4. Before each public push

- [ ] Search repo for `rbfzlqmkwhbvrrfdcain` and `mgeydloygmoiypnwaqmn` — replace with placeholders.
- [ ] **repos.json** — Replace with contents of **repos.json.example** (or your public-only list). *(In this repo, repos.json is currently public-safe.)*
- [ ] **products.json** — Replace with contents of **products.json.example** (or your public-only list). *(In this repo, products.json is currently public-safe.)*
- [ ] **SUPABASE_MCP_SETUP.md** — Redact to generic (YOUR_PROJECT_REF, “your app”) or remove from public branch.
- [ ] No real tokens, API keys, or service role keys in any file.
- [ ] No user-specific paths (use placeholders).
- [ ] `.gitignore` is up to date (`.env`, `.clawdbot/`, `CREDENTIALS_NOTE.md`, `reports/`, etc.).

---

## 5. Example files (public-safe)

- **repos.json.example** — Sample list with only public repos (e.g. JARVIS, olive, echeo, MythSeeker). Users copy to `repos.json` and edit.
- **products.json.example** — Sample product list (public products only). Users copy to `products.json` and edit.

See repo root for these files; reference them in README or DEVELOPER_GUIDE so users know how to set up their own lists.

---

## 6. Quick scan commands

```bash
# Find real project refs (should be zero in public branch)
rg -n 'rbfzlqmkwhbvrrfdcain|mgeydloygmoiypnwaqmn' --type-add 'md:*.md' -t md .

# Find possible secrets (audit only)
rg -n 'service_role|SERVICE_ROLE_KEY|Bearer [a-zA-Z0-9_-]{20,}' --type-add 'md:*.md' -t md .

# Find links to repairman29 repos (check which are public vs private)
rg -n 'repairman29/[a-zA-Z0-9_-]+' --type-add 'md:*.md' -t md .
```

---

## 7. repairman29 repo links (public vs private)

**Public repairman29 repos** (safe to link in README, DEVELOPER_GUIDE, docs): **JARVIS**, **olive**, **echeo**, **MythSeeker**, **jarvis-rog-ed**, **sheckleshare**.

**Private repairman29 repos** (do **not** link in main public-facing docs — external users get “Repository not found”): BEAST-MODE, code-roach, echeovid, project-forge, upshift, JARVIS-Premium, echeo-web, and others in repos.json with `"visibility":"PRIVATE"`.

**Before public push:**

- [ ] **README.md** and **DEVELOPER_GUIDE.md** — Only link to public repos above. For private repos (BEAST-MODE, Code Roach, Echeovid, Project Forge, Upshift), use product name + description **without** a GitHub URL, or “(repo available to contributors)” so we don’t expose private repo names.
- [ ] **repos.json** — Use **repos.json.example** (public repos only); see §1 and §4.
- [ ] **products.json** — Use **products.json.example** (public products only); see §1 and §4.

Internal docs (jarvis/AGENTS.md, scripts/PM_BEAST_MODE_CLI.md, etc.) may still reference private repos for org use; keep those out of the “first screen” for public visitors.

---

*Use this checklist on every release or before pushing to a public mirror. Keep docs/DOCUMENTATION_MAP.md and docs/REPO_INDEX.md updated so public docs stay the single source of truth.*
