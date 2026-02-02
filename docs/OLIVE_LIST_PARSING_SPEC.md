# Olive — List Parsing & Smart Paste: Parser, Not AI

**Requirement:** Olive’s list decoupling / Smart Paste (turning “milk, eggs, sourdough” into items) must use an **intelligent, deterministic parser** — **not AI/LLM** — to save cost and prevent abuse.

---

## 1. Why parser, not AI

- **Cost:** LLM calls per paste scale with usage; abuse (trash lists, huge pastes, bots) can blow the budget.
- **Abuse:** Users or bots can spam pastes; without rate limits and without expensive AI per request, abuse is cheaper to tolerate and to throttle.
- **Predictability:** A rule-based parser (split on delimiters, trim, normalize, optional dedupe) is deterministic and easier to reason about and debug.

**Use AI only where it clearly adds value and you can control cost** (e.g. optional “improve this list” or recipe extraction via a separate, rate-limited path).

---

## 2. What “intelligent parser” means here

- **Deterministic:** Same input → same list of items (or same normalized form). No LLM call for “paste → list of items.”
- **Rules:** Split on commas, newlines, “and”, etc.; trim whitespace; optional normalization (lowercase, singular/plural rules if you want); optional max items per paste; optional max length per item.
- **No per-paste API cost:** No OpenAI/Anthropic/etc. call for the core “paste → items” step. Spoonacular/recipe is a separate feature and can be rate-limited and documented as such.

---

## 3. Abuse and cost controls

- **Rate limits:** Per user or per session: e.g. max N pastes per minute/hour, or max M “Add” (submit list) actions per hour. Prevents runaway abuse and keeps cost bounded even if you later add optional AI features.
- **Input limits:** Max characters per paste, max items per list (e.g. 50–100). Reject or truncate with a clear message.
- **Trash / garbage:** Parser can reject or cap obviously bad input (e.g. all punctuation, no alphabetic tokens, or single giant token). Optionally log for tuning.
- **Auth:** For unauthenticated “Try the command flow,” consider stricter limits (e.g. 1 list per IP per hour) so anonymous users can’t abuse it.

---

## 4. Where this lives

- **Implementation:** In the **Olive repo** ([repairman29/olive](https://github.com/repairman29/olive)) — list parsing, Smart Paste, and any rate limiting are in that codebase, not in CLAWDBOT.
- **This doc:** Captures the product/architecture constraint so JARVIS and contributors know: list decoupling = parser, not AI; add rate limits and abuse controls.

---

## 5. Checklist (when working in Olive repo)

- [ ] List → items uses a **deterministic parser** (split, trim, normalize). No LLM call for that step.
- [ ] **Rate limits** on paste / “Add list” (per user or per session or per IP for anonymous).
- [ ] **Input limits:** max paste length, max items per list; reject or truncate with clear messaging.
- [ ] Optional: reject or cap obvious garbage (no valid tokens, single huge token).
- [ ] Recipe/Spoonacular (if used) is **separate**, rate-limited, and documented; list parsing itself stays parser-only.

---

**See also:** [docs/OLIVE_PROJECT_README.md](./OLIVE_PROJECT_README.md) (overview), [Olive repo](https://github.com/repairman29/olive) (implementation).
