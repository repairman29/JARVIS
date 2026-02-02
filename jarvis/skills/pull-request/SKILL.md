# Pull request (GitHub) — list, create, merge, review

Use this skill for **GitHub pull requests**: list, create, get, merge, comment, submit review, and request reviewers. JARVIS can drive the full PR lifecycle with GITHUB_TOKEN.

**Not to be confused with PR (Public Relations / comms)** — that skill is in `jarvis/skills/pr/`.

## When to use

- **"List open PRs in owner/repo"**, **"PRs for branch X"** → `list_prs`
- **"Get PR #5"**, **"Details of PR 12"** → `get_pr`
- **"Create a PR from branch feature to main"** → `create_pr`
- **"Merge PR #7"**, **"Squash and merge PR #3"** → `merge_pr`
- **"Comment on PR #5: LGTM"** → `pr_comment`
- **"Approve PR #5"**, **"Request changes on PR #3"** → `pr_review`
- **"Request review from alice and bob on PR #5"** → `request_review`

**Path:** `skills/pull-request/` — distinct from **PR (Public Relations / comms)** in `skills/pr/`.
