# UpshiftAI.dev — Remove Fake Quotes / Trust Section

**Summary:** The live site at [upshiftai.dev](https://upshiftai.dev) has a "Trusted by developers at" section that lists placeholder company names (**Startup Inc**, **TechFlow**, **DevCorp**). These are not real endorsements and should not stay on the site.

## Where the site lives

- **Live site:** https://upshiftai.dev  
- **Source code:** **upshift** repo (not CLAWDBOT)  
  - GitHub: upshift (repo available to contributors)  
  - Local clone: `/Users/jeffadkins/upshift`

## What to change

1. **Open the upshift repo** (e.g. in Cursor: File → Open Folder → `~/upshift` or `/Users/jeffadkins/upshift`).
2. **Search the codebase** for:
   - `Trusted by developers at`
   - or `Startup Inc` / `TechFlow` / `DevCorp`
3. **Fix it** by either:
   - **Removing** the whole "Trusted by" block until you have real logos/quotes, or  
   - **Replacing** with honest copy (e.g. "Built for developers who care about dependency hygiene") and removing the fake company names.

## Reference (live copy as of review)

- Heading: **Trusted by developers at**
- Companies shown: **Startup Inc** · **TechFlow** · **DevCorp**

---

*Doc added so we don’t ship fake social proof on upshiftai.dev. Edit the site in the upshift repo, not in CLAWDBOT.*
