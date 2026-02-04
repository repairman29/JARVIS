# Give JARVIS Full Access to Kroger

You’ve set credentials and installed the skill. For JARVIS to **use** Kroger, add the following to your **JARVIS workspace** (`~/jarvis` or wherever your bot runs from).

**Quick path:** This repo has ready-made files in **`jarvis/`** (TOOLS.md and AGENTS.md). Copy or merge them into `~/jarvis/` — see **`jarvis/README.md`**.

---

## 1. Add to `~/jarvis/TOOLS.md`

Add this section so the AI knows Kroger tools exist and when to use them:

```markdown
## Kroger / King Soopers (grocery)

**Skill:** `kroger` (installed). Use for any Kroger/King Soopers product search, prices, shopping lists, or store lookup.

| Tool | When to use |
|------|--------------|
| `kroger_search` | User asks for price or search: "price of milk at Kroger", "search Kroger for eggs" |
| `kroger_stores` | User asks for stores: "Kroger near 80202", "King Soopers stores 80123" |
| `kroger_shop` | User wants a list with prices: "shopping list for tacos", "Kroger shop milk eggs bread" |
| `kroger_cart` | User wants to open cart: "open my Kroger cart", "Kroger cart" |

**Env:** `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`, `KROGER_LOCATION_ID` (required for prices).
**Skill path:** `~/jarvis/skills/kroger` or installed via `clawdbot skills install`.
```

---

## 2. Add to `~/jarvis/AGENTS.md` (optional)

If the bot still doesn’t call Kroger, add under your main agent (e.g. “Replying in the current conversation” or “Default behavior”):

```markdown
- **Kroger / grocery:** For Kroger, King Soopers, or grocery prices/lists/stores, use the Kroger skill tools: `kroger_search`, `kroger_stores`, `kroger_shop`, `kroger_cart`. Call the tool and then summarize the result for the user.
```

---

## 3. Restart the gateway

After editing `TOOLS.md` and/or `AGENTS.md`:

```bash
clawdbot gateway restart
```

(or restart however you run the JARVIS gateway)

---

## Quick check

- **TOOLS.md** — Lists Kroger so the AI knows the tools exist.
- **AGENTS.md** — Tells the AI to actually call those tools for Kroger/grocery requests.
- **Gateway restart** — Reloads workspace files so the changes take effect.
