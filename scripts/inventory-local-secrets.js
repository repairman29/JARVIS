#!/usr/bin/env node
/**
 * Inventory Local Secrets (read-only)
 * Discovers repo roots under a home dir, scans for secret-bearing files,
 * produces a redacted report (paths + key names + hash/last-4 only).
 * Plan: Supabase Vault Migration.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOME = process.env.USERPROFILE || process.env.HOME || require('os').homedir();
const ROOT = process.argv[2] || HOME;

const MAX_REPOS = 100;
const MAX_DEPTH = 8;
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.cache', '.npm', '.yarn', 'vendor', '__pycache__',
  'dist', 'build', '.next', '.nuxt', '.output', 'coverage', '.turbo',
  'AppData', 'Library', '.cursor', '.vscode'
]);
const SKIP_PREFIXES = ['.', 'AppData\\', 'Library\\', 'node_modules'];

const SECRET_FILE_PATTERNS = [
  /^\.env$/i,
  /^\.env\./i,
  /\.env\.example$/i,
  /\.pem$/i,
  /\.key$/i,
  /^id_rsa/i,
  /credentials\.json$/i,
  /service-account.*\.json$/i,
  /\.pfx$/i
];

const SENSITIVE_KEY_PATTERN = /(password|secret|token|api_key|apikey|private_key|credential|auth)/i;

function redact(value) {
  if (typeof value !== 'string' || value.length === 0) return { last4: null, hash: null };
  const trimmed = value.trim();
  const last4 = trimmed.length >= 4 ? trimmed.slice(-4) : '****';
  const hash = crypto.createHash('sha256').update(trimmed, 'utf8').digest('hex').slice(0, 12);
  return { last4, hash };
}

function isSecretFileName(name) {
  return SECRET_FILE_PATTERNS.some((re) => re.test(name));
}

function findRepoRoots(dir, depth, repos) {
  if (depth > MAX_DEPTH || repos.length >= MAX_REPOS) return;
  if (!fs.existsSync(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const name = e.name.toLowerCase();
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full);
    if (SKIP_PREFIXES.some((p) => rel.startsWith(p.replace(/\\/g, path.sep)))) continue;
    if (fs.existsSync(path.join(full, '.git'))) {
      repos.push(full);
      continue;
    }
    findRepoRoots(full, depth + 1, repos);
  }
}

function scanDirForSecretFiles(dir, results) {
  if (!fs.existsSync(dir)) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const name = e.name.toLowerCase();
      if (SKIP_DIRS.has(name)) continue;
      scanDirForSecretFiles(full, results);
    } else if (e.isFile() && isSecretFileName(e.name)) {
      results.push({ path: full, name: e.name });
    }
  }
}

function parseEnvFile(filePath) {
  const out = [];
  if (!fs.existsSync(filePath)) return out;
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch {
    return out;
  }
  const normalized = text.replace(/^\uFEFF/, '');
  for (const line of normalized.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      const value = match[2].replace(/^["']|["']$/g, '').trim();
      if (SENSITIVE_KEY_PATTERN.test(key) || value.length > 0) {
        out.push({ key, ...redact(value) });
      }
    }
  }
  return out;
}

function main() {
  const report = {
    root: ROOT,
    generatedAt: new Date().toISOString(),
    repoRoots: [],
    envFiles: [],
    secretFiles: [],
    knownEnvLocation: path.join(HOME, '.clawdbot', '.env')
  };

  const repos = [];
  findRepoRoots(ROOT, 0, repos);
  report.repoRoots = repos.map((r) => path.relative(ROOT, r));

  const secretFileEntries = [];
  for (const repo of repos) {
    scanDirForSecretFiles(repo, secretFileEntries);
  }
  const knownEnv = path.join(HOME, '.clawdbot', '.env');
  if (fs.existsSync(knownEnv) && !secretFileEntries.some((e) => e.path === knownEnv)) {
    secretFileEntries.push({ path: knownEnv, name: '.env' });
  }

  for (const { path: filePath, name } of secretFileEntries) {
    const rel = path.relative(ROOT, filePath);
    if (/\.env/i.test(name)) {
      const keys = parseEnvFile(filePath);
      report.envFiles.push({
        path: rel,
        keys: keys.map((k) => ({ key: k.key, last4: k.last4, hash: k.hash }))
      });
    } else {
      report.secretFiles.push({ path: rel, type: 'file', name });
    }
  }

  const reportPath = path.join(__dirname, 'inventory-local-secrets-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Redacted report written to:', reportPath);
  console.log('Repo roots:', report.repoRoots.length);
  console.log('Env files:', report.envFiles.length);
  console.log('Other secret files:', report.secretFiles.length);
}

main();
