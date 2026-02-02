# Pull request (GitHub) — list, create, merge, review

Use this skill for **GitHub pull requests**: list, create, get, merge, comment, submit review, and request reviewers. JARVIS can drive the full PR lifecycle with GITHUB_TOKEN.

## Setup

1. Add **GITHUB_TOKEN** to `~/.clawdbot/.env` (same as GitHub skill). Do not commit the token.
2. PAT needs: `repo` (read/write for PRs, merge, reviews).
3. Restart gateway after adding the skill.

## When to use

- **"List open PRs in owner/repo"**, **"PRs for branch X"** → `list_prs`
- **"Get PR #5"**, **"Details of PR 12"** → `get_pr`
- **"Create a PR from branch feature to main"** → `create_pr`
- **"Merge PR #7"**, **"Squash and merge PR #3"** → `merge_pr`
- **"Comment on PR #5: LGTM"** → `pr_comment`
- **"Approve PR #5"**, **"Request changes on PR #3"** → `pr_review`
- **"Request review from alice and bob on PR #5"** → `request_review`

## Tools

| Tool | Use for |
|------|---------|
| `list_prs` | List PRs (open/closed/all, optional head/base filter) |
| `get_pr` | Get one PR by number |
| `create_pr` | Create a PR (title, head, base, body) |
| `merge_pr` | Merge a PR (merge, squash, or rebase) |
| `pr_comment` | Add a general comment to a PR |
| `pr_review` | Submit review: APPROVE, REQUEST_CHANGES, or COMMENT |
| `request_review` | Request reviewers by username |

**Path:** `skills/pull-request/` — distinct from **PR (Public Relations / comms)** in `skills/pr/`.
