#!/usr/bin/env node
/**
 * Add a repo to repos.json and products.json, optionally index it, and set it as focus.
 * Use when you want JARVIS to "work on" a repo that isn't yet in the product list.
 *
 * Usage:
 *   node scripts/add-repo-and-focus.js <repo> [description]
 *   node scripts/add-repo-and-focus.js acme "Acme app — new product"
 *   node scripts/add-repo-and-focus.js my-repo --no-index   # skip indexing (e.g. index later)
 *
 * Options:
 *   --no-index   Do not run index-repos.js (repo_summary/repo_search won't work until you index)
 *   --org <org>  GitHub org (default: repairman29)
 *
 * If the repo is not in repos.json, the script tries `gh repo view <org>/<repo>` to get sshUrl
 * and adds it. Then adds to products.json (or moves to top if already there), optionally indexes,
 * and sets focus so plan-execute and "work top down" use this repo.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const repoRoot = path.resolve(__dirname, '..');
const productsPath = path.join(repoRoot, 'products.json');
const reposPath = path.join(repoRoot, 'repos.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const noIndex = args.includes('--no-index');
  const orgIdx = args.indexOf('--org');
  const org = orgIdx >= 0 && args[orgIdx + 1] ? args[orgIdx + 1] : 'repairman29';
  const rest = args.filter((a, i) => a !== '--no-index' && (orgIdx < 0 || i !== orgIdx && i !== orgIdx + 1));
  const repo = rest[0] ? rest[0].trim() : null;
  const description = rest[1] ? rest.slice(1).join(' ').trim() : null;
  return { repo, description, noIndex, org };
}

function safeExec(cmd, opts = {}) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...opts }).trim() };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function main() {
  const { repo, description, noIndex, org } = parseArgs();
  if (!repo) {
    console.error('Usage: node scripts/add-repo-and-focus.js <repo> [description] [--no-index] [--org <org>]');
    process.exit(1);
  }

  if (!fs.existsSync(productsPath)) {
    console.error('products.json not found at', productsPath);
    process.exit(1);
  }

  let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  if (!Array.isArray(products)) {
    console.error('products.json must be an array');
    process.exit(1);
  }

  let repos = [];
  if (fs.existsSync(reposPath)) {
    repos = JSON.parse(fs.readFileSync(reposPath, 'utf8'));
    if (!Array.isArray(repos)) repos = [];
  }

  const existingProduct = products.find((p) => p.repo === repo || p.name === repo);
  const existingRepo = repos.find((r) => r.name === repo);

  if (!existingRepo) {
    const ghSlug = `${org}/${repo}`;
    const result = safeExec(`gh repo view "${ghSlug}" --json name,sshUrl,visibility`);
    if (!result.ok) {
      console.error(`Repo ${ghSlug} not found or gh failed:`, result.error);
      console.error('Create the repo first (e.g. node scripts/create-new-repo.js ' + repo + ') or add it to repos.json manually.');
      process.exit(1);
    }
    const info = JSON.parse(result.output);
    repos.push({
      name: info.name || repo,
      sshUrl: info.sshUrl || `git@github.com:${ghSlug}.git`,
      visibility: (info.visibility || 'PUBLIC').toUpperCase(),
    });
    fs.writeFileSync(reposPath, JSON.stringify(repos, null, 2) + '\n', 'utf8');
    console.log('Added', repo, 'to repos.json');
  }

  if (!existingProduct) {
    const displayName = repo.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    products.unshift({
      name: displayName,
      repo,
      description: description || `User-requested repo: ${repo}`,
      status: 'active',
    });
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n', 'utf8');
    console.log('Added', repo, 'to products.json and set as focus (first in list).');
  } else {
    const idx = products.findIndex((p) => p.repo === repo || p.name === repo);
    if (idx > 0) {
      const [item] = products.splice(idx, 1);
      if (description) item.description = description;
      products.unshift(item);
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2) + '\n', 'utf8');
      console.log('Moved', repo, 'to focus (first in products.json).');
    } else {
      console.log(repo, 'is already focus.');
    }
  }

  if (!noIndex) {
    console.log('Indexing repo for repo_summary/repo_search...');
    const indexResult = safeExec(`node scripts/index-repos.js --repo "${repo}"`, { cwd: repoRoot, stdio: 'inherit' });
    if (!indexResult.ok) {
      console.error('Index step failed (Ollama/Supabase may be needed). Run later: node scripts/index-repos.js --repo', repo);
    }
  } else {
    console.log('Skipped indexing (--no-index). Run later: node scripts/index-repos.js --repo', repo);
  }

  console.log('Focus is now', repo + '. Plan-execute, heartbeat, and "work top down" will use this repo.');
}

main();
