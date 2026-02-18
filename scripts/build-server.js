#!/usr/bin/env node
/**
 * JARVIS Build Server — HTTP service that runs builds for configured repos.
 * JARVIS (or cron) can POST to trigger a build; the server runs npm install / npm run build
 * in a child process and returns the result.
 *
 * Usage:
 *   node scripts/build-server.js                    # start server (port from BUILD_SERVER_PORT or 18790)
 *   curl -X POST http://localhost:18790/build -d '{"repo":"JARVIS"}' -H "Content-Type: application/json"
 *
 * Config: build-server-repos.json in repo root maps repo name -> absolute path. Example:
 *   { "JARVIS": "/path/to/JARVIS", "olive": "/path/to/olive" }
 * If missing, JARVIS = this repo root; others = ~/.jarvis/repos-cache/<repo> (from products.json).
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.BUILD_SERVER_PORT || '18790');
const BUILD_TIMEOUT_MS = Number(process.env.BUILD_SERVER_TIMEOUT_MS || '300000'); // 5 min
const REPOS_CACHE = path.join(os.homedir(), '.jarvis', 'repos-cache');

function loadReposConfig() {
  const configPath = path.join(REPO_ROOT, 'build-server-repos.json');
  const out = { JARVIS: REPO_ROOT };
  if (fs.existsSync(configPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      for (const [name, p] of Object.entries(data)) {
        out[name] = path.isAbsolute(p) ? p : path.resolve(REPO_ROOT, p);
      }
    } catch (_) {}
    return out;
  }
  // Fallback: products.json repo names -> repos-cache or JARVIS
  const productsPath = path.join(REPO_ROOT, 'products.json');
  if (fs.existsSync(productsPath)) {
    try {
      const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      for (const p of products) {
        const name = p.repo || p.name;
        if (!name || out[name]) continue;
        if (name === 'JARVIS') out[name] = REPO_ROOT;
        else out[name] = path.join(REPOS_CACHE, name);
      }
    } catch (_) {}
  }
  return out;
}

const reposConfig = loadReposConfig();

function runCommand(repoPath, command) {
  return new Promise((resolve) => {
    let cmd = 'npm';
    let args = [];
    if (command === 'install') args = ['install'];
    else if (command === 'build') args = ['run', 'build'];
    else if (command === 'test') args = ['run', 'test'];
    else args = ['run', command];
    const start = Date.now();
    const child = spawn(cmd, args.length ? args : ['run', 'build'], {
      cwd: repoPath,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => { stdout += c.toString(); });
    child.stderr.on('data', (c) => { stderr += c.toString(); });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({
        success: false,
        exitCode: null,
        stdout: stdout.slice(-8000),
        stderr: stderr.slice(-8000),
        durationMs: Date.now() - start,
        timeout: true,
      });
    }, BUILD_TIMEOUT_MS);
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      resolve({
        success: code === 0,
        exitCode: code,
        signal: signal || undefined,
        stdout: stdout.slice(-8000),
        stderr: stderr.slice(-8000),
        durationMs: Date.now() - start,
      });
    });
  });
}

const server = http.createServer((req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
    return send(200, { ok: true, service: 'jarvis-build-server', port: PORT });
  }

  if (req.method === 'POST' && req.url === '/build') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      let payload = {};
      try {
        payload = body ? JSON.parse(body) : {};
      } catch {
        return send(400, { error: 'Invalid JSON body' });
      }
      const repo = payload.repo && String(payload.repo).trim();
      const command = (payload.command && String(payload.command).trim()) || 'build';
      if (!repo) return send(400, { error: 'Missing "repo" in body' });
      if (!['build', 'install', 'test'].includes(command)) return send(400, { error: 'command must be "build", "install", or "test"' });

      const repoPath = reposConfig[repo];
      if (!repoPath) return send(404, { error: `Unknown repo: ${repo}. Known: ${Object.keys(reposConfig).join(', ')}` });
      if (!fs.existsSync(repoPath)) return send(404, { error: `Repo path does not exist: ${repoPath}` });
      const pkgPath = path.join(repoPath, 'package.json');
      if (!fs.existsSync(pkgPath)) return send(400, { error: `No package.json in ${repo}` });
      if (command === 'build') {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (!(pkg.scripts && pkg.scripts.build)) return send(400, { error: `No "build" script in ${repo}/package.json` });
        } catch (_) {}
      }
      if (command === 'test') {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (!(pkg.scripts && pkg.scripts.test)) return send(400, { error: `No "test" script in ${repo}/package.json` });
        } catch (_) {}
      }

      runCommand(repoPath, command).then((result) => {
        send(200, { repo, command, ...result });
      });
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/pipeline') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', async () => {
      let payload = {};
      try {
        payload = body ? JSON.parse(body) : {};
      } catch {
        return send(400, { error: 'Invalid JSON body' });
      }
      const repo = payload.repo && String(payload.repo).trim();
      if (!repo) return send(400, { error: 'Missing "repo" in body' });
      const repoPath = reposConfig[repo];
      if (!repoPath) return send(404, { error: `Unknown repo: ${repo}. Known: ${Object.keys(reposConfig).join(', ')}` });
      if (!fs.existsSync(repoPath)) return send(404, { error: `Repo path does not exist: ${repoPath}` });
      const pkgPath = path.join(repoPath, 'package.json');
      if (!fs.existsSync(pkgPath)) return send(400, { error: `No package.json in ${repo}` });

      const steps = [];
      let totalMs = 0;
      for (const cmd of ['install', 'build', 'test']) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
          if (cmd === 'build' && !(pkg.scripts && pkg.scripts.build)) continue;
          if (cmd === 'test' && !(pkg.scripts && pkg.scripts.test)) continue;
        } catch (_) {
          if (cmd !== 'install') continue;
        }
        const result = await runCommand(repoPath, cmd);
        steps.push({ command: cmd, success: result.success, exitCode: result.exitCode, durationMs: result.durationMs });
        totalMs += result.durationMs || 0;
        if (!result.success) {
          return send(200, { repo, success: false, steps, totalMs, failedStep: cmd, ...result });
        }
      }
      send(200, { repo, success: true, steps, totalMs });
    });
    return;
  }

  send(404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`JARVIS Build Server listening on http://127.0.0.1:${PORT}`);
  console.log('POST /build with body { "repo": "JARVIS" } or { "repo": "olive", "command": "build" }');
});
