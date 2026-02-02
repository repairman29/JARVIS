# Pull request skill (GitHub)

GitHub pull request workflow for JARVIS: list, create, get, merge, comment, submit review, request reviewers.

**Not to be confused with PR (Public Relations / comms)** — that skill is in `skills/pr/`.

## Requirements

- **GITHUB_TOKEN** in `~/.clawdbot/.env`. PAT needs `repo` scope (or fine-grained: Pull requests read + write).

## Tools

See **SKILL.md** for when to use each tool. JARVIS will call these tools when the user asks to list PRs, create a PR, merge, approve, request changes, or request reviewers on GitHub.
