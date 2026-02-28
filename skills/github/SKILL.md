# GitHub — Connect with PAT, Drive Work / Workers / Subagents

Use this skill for **GitHub**: list repos, manage **issues** and **PRs**, and **trigger workflow_dispatch** (workers/subagents) so JARVIS can drive GitHub Actions and coordinate work.

## Setup

1. Add **GITHUB_TOKEN** to `~/.clawdbot/.env` (or `%USERPROFILE%\.clawdbot\.env` on Windows). Do not commit the token.
2. PAT needs: `repo` (and `workflow` for triggering Actions), or equivalent fine-grained permissions.
3. Restart gateway after adding the skill.

## When to use

- **"List my GitHub repos"**, **"repos for org X"** → `github_repos`
- **"Create a GitHub issue in owner/repo"**, **"Comment on issue #5"** → `github_issues` (action: create, comment, list, get)
- **"Open a PR from branch X"**, **"List open PRs"** → `github_pulls`
- **"Trigger the deploy workflow"**, **"Run the worker on main"** → `github_workflow_dispatch`
- **"Branches in owner/repo"** → `github_branches`
- **"What workflows exist in this repo?"** → `github_workflows`
- **"Is GitHub connected?"** → `github_status`

## Tools

| Tool | Use for |
|------|---------|
| `github_status` | Check PAT and API connectivity |
| `github_repos` | List repos (user or org) |
| `github_issues` | List / create / comment / get issues |
| `github_pulls` | List / create / get PRs |
| `github_workflow_dispatch` | Trigger workflow_dispatch (workers/subagents) |
| `github_branches` | List branches |
| `github_workflows` | List workflow files (for dispatch) |

## Examples

- **"Create an issue in repairman29/JARVIS: Add dark mode"**  
  `github_issues({ action: "create", owner: "repairman29", repo: "JARVIS", title: "Add dark mode" })`

- **"Trigger a workflow on JARVIS"** (e.g. test-skills or a repo’s deploy workflow)  
  `github_workflow_dispatch({ owner: "repairman29", repo: "JARVIS", workflow_id: "test-skills.yml", ref: "main" })`

- **"List open PRs in repairman29/JARVIS"**  
  `github_pulls({ action: "list", owner: "repairman29", repo: "JARVIS", state: "open" })`
