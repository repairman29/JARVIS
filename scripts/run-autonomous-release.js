#!/usr/bin/env node
/**
 * Autonomous release: build → quality → deploy for one product (no human in the loop).
 * Use from cron or GitHub Action to run releases when conditions are met.
 *
 * Usage:
 *   node scripts/run-autonomous-release.js                    # first product with shipAccess, or JARVIS_RELEASE_PRODUCT
 *   node scripts/run-autonomous-release.js --product olive
 *   node scripts/run-autonomous-release.js --no-quality       # skip BEAST MODE (e.g. CI already ran quality)
 *   node scripts/run-autonomous-release.js --no-deploy         # build + quality only
 *   node scripts/run-autonomous-release.js --dry-run          # print steps, do not run
 *   node scripts/run-autonomous-release.js --tag              # after deploy, create git tag from version (optional)
 *
 * Env:
 *   JARVIS_RELEASE_PRODUCT     — repo name (e.g. olive, JARVIS). Overrides --product and products.json.
 *   BUILD_SERVER_PORT          — default 18790.
 *   JARVIS_FOCUS_REPO          — passed to run-team-quality.js (default: same as product).
 *   JARVIS_DEPLOY_CMD          — optional: shell command to run for deploy (e.g. "gh workflow run deploy.yml -R owner/repo").
 *   JARVIS_REPO_ROOT           — optional: parent dir of product repos (default: repo root's parent, e.g. .. from JARVIS).
 *   JARVIS_GIT_TAG_PUSH        — if set with --tag, also push the new tag (e.g. git push origin v1.2.3).
 *   GITHUB_TOKEN               — for gh workflow run or API (if not using JARVIS_DEPLOY_CMD).
 *
 * Writes: ~/.jarvis/last-release.json (product, timestamp, version?, build/quality/deploy result).
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const buildServerPort = Number(process.env.BUILD_SERVER_PORT || '18790');
const statusDir = path.join(process.env.HOME || process.env.USERPROFILE, '.jarvis');
const statusPath = path.join(statusDir, 'last-release.json');

function getProduct() {
  if (process.env.JARVIS_RELEASE_PRODUCT) return process.env.JARVIS_RELEASE_PRODUCT.trim();
  const idx = process.argv.indexOf('--product');
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1].trim();
  const productsPath = path.join(repoRoot, 'products.json');
  if (!fs.existsSync(productsPath)) return null;
  try {
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const first = Array.isArray(products) ? products.find((p) => p.shipAccess || p.deepWorkAccess) || products[0] : null;
    return first && first.repo ? first.repo : null;
  } catch {
    return null;
  }
}

function getProductRepoDir(product) {
  const root = (process.env.JARVIS_REPO_ROOT || path.join(repoRoot, '..')).replace(/\/$/, '');
  return path.join(root, product);
}

function readVersion(product) {
  const dir = getProductRepoDir(product);
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg && typeof pkg.version === 'string') return pkg.version.trim();
    } catch {}
  }
  const verPath = path.join(dir, 'VERSION');
  if (fs.existsSync(verPath)) {
    try {
      return fs.readFileSync(verPath, 'utf8').trim();
    } catch {}
  }
  return null;
}

function createTag(product, version) {
  const dir = getProductRepoDir(product);
  if (!fs.existsSync(path.join(dir, '.git'))) return { ok: false, err: 'Not a git repo' };
  const tagName = `v${version}`;
  const run = (cmd) => {
    try {
      return { ok: true, out: execSync(cmd, { encoding: 'utf8', cwd: dir, timeout: 10000 }).trim() };
    } catch (e) {
      return { ok: false, err: e.message || String(e) };
    }
  };
  const r = run(`git tag ${tagName}`);
  if (!r.ok) return r;
  if (process.env.JARVIS_GIT_TAG_PUSH === '1' || process.env.JARVIS_GIT_TAG_PUSH === 'true') {
    const push = run(`git push origin ${tagName}`);
    if (!push.ok) return push;
  }
  return { ok: true, out: tagName };
}

function httpGet(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: pathname || '/health',
        method: 'GET',
        timeout: 5000,
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            if (res.statusCode === 200 && pathname === '/pipeline') resolve(JSON.parse(body));
            else resolve(res.statusCode === 200 ? body : null);
          } catch {
            resolve(res.statusCode === 200 ? body : null);
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function httpPost(port, pathname, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
        timeout: 300000,
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, body: b ? JSON.parse(b) : {} });
          } catch {
            resolve({ statusCode: res.statusCode, body: b });
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

function exec(cmd, opts = {}) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', cwd: repoRoot, timeout: 300000, ...opts });
    return { ok: true, out: out.trim() };
  } catch (e) {
    return { ok: false, err: e.message || String(e) };
  }
}

function writeStatus(result) {
  if (!fs.existsSync(statusDir)) fs.mkdirSync(statusDir, { recursive: true });
  fs.writeFileSync(statusPath, JSON.stringify(result, null, 2), 'utf8');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const noQuality = process.argv.includes('--no-quality');
  const noDeploy = process.argv.includes('--no-deploy');

  const product = getProduct();
  if (!product) {
    console.error('No product. Set JARVIS_RELEASE_PRODUCT or use --product <repo> or add shipAccess in products.json.');
    process.exit(1);
  }

  const doTag = process.argv.includes('--tag');
  const result = {
    product,
    timestamp: new Date().toISOString(),
    version: null,
    build: { success: false },
    quality: { success: false, skipped: noQuality },
    deploy: { success: false, skipped: noDeploy },
    tag: null,
  };

  if (dryRun) {
    console.log('[dry-run] Product:', product);
    console.log('[dry-run] Steps: build → quality → deploy; optional --tag to create git tag from version');
    if (noQuality) console.log('[dry-run] Quality skipped');
    if (noDeploy) console.log('[dry-run] Deploy skipped');
    if (doTag) console.log('[dry-run] Tag: would read version from product repo and create v<version>');
    return;
  }

  console.log('Autonomous release:', product);
  console.log('');

  // 1. Build
  try {
    const health = await httpGet(buildServerPort, '/health');
    if (!health) {
      console.log('Build server not reachable on port', buildServerPort);
      result.build.error = 'Build server not running';
      writeStatus(result);
      process.exit(1);
    }
    const pipeline = await httpPost(buildServerPort, '/pipeline', { repo: product });
    const success = pipeline.statusCode === 200 && pipeline.body && pipeline.body.success !== false;
    result.build.success = success;
    if (success) {
      console.log('Build: OK');
      result.version = readVersion(product);
      if (result.version) console.log('Version:', result.version);
    } else {
      console.log('Build: FAILED', pipeline.body || pipeline.statusCode);
      writeStatus(result);
      process.exit(1);
    }
  } catch (e) {
    result.build.error = e.message;
    console.log('Build: ERROR', e.message);
    writeStatus(result);
    process.exit(1);
  }

  // 2. Quality
  if (!noQuality) {
    const focusRepo = process.env.JARVIS_FOCUS_REPO || product;
    const run = exec(`node scripts/run-team-quality.js "${product}"`, { env: { ...process.env, JARVIS_FOCUS_REPO: focusRepo } });
    result.quality.success = run.ok;
    if (run.ok) {
      console.log('Quality: OK');
    } else {
      console.log('Quality: FAILED', run.err);
      writeStatus(result);
      process.exit(1);
    }
  } else {
    result.quality.skipped = true;
    console.log('Quality: skipped');
  }

  // 3. Deploy
  if (!noDeploy) {
    const deployCmd = process.env.JARVIS_DEPLOY_CMD;
    if (deployCmd) {
      const run = exec(deployCmd);
      result.deploy.success = run.ok;
      if (run.ok) {
        console.log('Deploy: OK');
      } else {
        console.log('Deploy: FAILED', run.err);
        result.deploy.error = run.err;
        writeStatus(result);
        process.exit(1);
      }
    } else {
      console.log('Deploy: skipped (no JARVIS_DEPLOY_CMD). Set JARVIS_DEPLOY_CMD to run deploy (e.g. gh workflow run deploy.yml -R owner/repo).');
      result.deploy.skipped = true;
    }
  }

  // 4. Optional: git tag from version
  if (doTag && result.version) {
    const tagResult = createTag(product, result.version);
    result.tag = tagResult.ok ? tagResult.out : tagResult.err;
    if (tagResult.ok) {
      console.log('Tag:', tagResult.out, process.env.JARVIS_GIT_TAG_PUSH ? '(pushed)' : '(local only)');
    } else {
      console.log('Tag: skipped or failed:', tagResult.err);
    }
  }

  console.log('');
  console.log('Release complete:', product);
  writeStatus(result);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
