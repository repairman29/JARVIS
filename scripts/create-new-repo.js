#!/usr/bin/env node
/**
 * Create a new GitHub repo (repairman29/<name>) and add it to JARVIS (repos.json, products.json, focus).
 * Use for a net-new product so you can say "work on <name>" and JARVIS has it.
 *
 * Usage:
 *   node scripts/create-new-repo.js <repo-name> [description]
 *   node scripts/create-new-repo.js acme "Acme app"
 *   node scripts/create-new-repo.js my-product --private
 *
 * Options:
 *   --private   Create as private repo (default: public)
 *   --org <org> GitHub org (default: repairman29)
 *
 * Requires: gh CLI logged in (gh auth status). After create, runs add-repo-and-focus.js so the repo
 * is in repos.json, products.json, and set as focus; then indexes it for repo_summary/repo_search.
 */

const path = require('path');
const { execSync } = require('child_process');
const repoRoot = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const isPrivate = args.includes('--private');
  const orgIdx = args.indexOf('--org');
  const org = orgIdx >= 0 && args[orgIdx + 1] ? args[orgIdx + 1] : 'repairman29';
  const rest = args.filter((a, i) => a !== '--private' && (orgIdx < 0 || i !== orgIdx && i !== orgIdx + 1));
  const repo = rest[0] ? rest[0].trim() : null;
  const description = rest[1] ? rest.slice(1).join(' ').trim() : '';
  return { repo, description, isPrivate, org };
}

function main() {
  const { repo, description, isPrivate, org } = parseArgs();
  if (!repo) {
    console.error('Usage: node scripts/create-new-repo.js <repo-name> [description] [--private] [--org <org>]');
    process.exit(1);
  }

  const slug = `${org}/${repo}`;
  const visibility = isPrivate ? '--private' : '--public';
  const ghArgs = ['repo', 'create', slug, visibility];
  if (description) ghArgs.push('--description', description);

  try {
    execSync('gh ' + ghArgs.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' '), {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: true,
    });
  } catch (e) {
    console.error('gh repo create failed. Ensure gh is logged in (gh auth status) and the repo name is available.');
    process.exit(1);
  }

  console.log('Created', slug + '. Adding to JARVIS and setting focus...');
  const addArgs = ['scripts/add-repo-and-focus.js', repo];
  if (description) addArgs.push(description);
  addArgs.push('--org', org);
  try {
    execSync('node ' + addArgs.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' '), {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: true,
    });
  } catch (e) {
    console.error('add-repo-and-focus failed. You can run it manually: node scripts/add-repo-and-focus.js', repo);
    process.exit(1);
  }

  console.log('Done. Repo', repo, 'is created, in products.json, and set as focus. Clone and push when ready.');
}

main();
