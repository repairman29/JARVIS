# JARVIS GitHub Skill

Connect JARVIS to your GitHub account using a Personal Access Token (PAT). Use it to list repos, manage issues and PRs, and **trigger workflow_dispatch** (workers/subagents) so JARVIS can drive GitHub Actions and coordinate work.

## Setup

1. **Create a GitHub PAT** (classic or fine-grained):
   - Classic: [GitHub → Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens). Scopes: `repo`, `workflow` (for workflow_dispatch).
   - Fine-grained: Repository permissions: Contents (read), Issues (read/write), Pull requests (read/write), Actions (read/write if dispatching workflows).

2. **Store the token** (do not commit):
   - Add to `~/.clawdbot/.env` (Linux/macOS) or `%USERPROFILE%\.clawdbot\.env` (Windows):
   ```bash
   GITHUB_TOKEN=ghp_xxxxxxxxxxxx
   ```
   - Or set in your environment.

3. **Install the skill**: Copy `skills/github` into your JARVIS skills directory, or use your gateway’s skill loader.

4. Restart the gateway so it picks up the skill and env.

## Tools

| Tool | Use for |
|------|---------|
| `github_status` | Check if GITHUB_TOKEN is set and API works |
| `github_repos` | List your or an org’s repositories |
| `github_issues` | List, create, comment on, or get issues |
| `github_pulls` | List, create, or get pull requests |
| `github_workflow_dispatch` | Trigger a workflow_dispatch (workers/subagents) |
| `github_branches` | List branches in a repo |
| `github_workflows` | List workflow files (to find workflow_id for dispatch) |

## Driving work / workers / subagents

- **Issues**: Create issues as work items; comment to assign or update. Use `github_issues` with `action: "create"` or `action: "comment"`.
- **PRs**: Create or list PRs with `github_pulls`.
- **Workers (GitHub Actions)**: Use `github_workflow_dispatch` to run a workflow. The workflow must have `workflow_dispatch` in its YAML. Use `github_workflows` to see available workflow IDs (e.g. `deploy.yml`).

Example: *"Trigger a workflow on JARVIS repo"* → `github_workflow_dispatch({ owner: "repairman29", repo: "JARVIS", workflow_id: "test-skills.yml", ref: "main" })`. (Site deploy is via Vercel; use workflow_dispatch for test-skills or other Actions.)

## Env

- **GITHUB_TOKEN** (required): Personal Access Token with `repo` and `workflow` (or equivalent fine-grained permissions).
