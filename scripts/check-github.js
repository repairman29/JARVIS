#!/usr/bin/env node
/**
 * Check GitHub token via GitHub API: verify token and show authenticated user.
 * Uses same token resolution as gateway (Vault then ~/.clawdbot/.env then env).
 *
 * Run: node scripts/check-github.js
 * Requires: GITHUB_TOKEN in Vault (env/clawdbot/GITHUB_TOKEN) or ~/.clawdbot/.env
 */

const https = require('https');
const { loadEnvFile, resolveEnv } = require('./vault.js');

function get(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'JARVIS-check-github/1.0 (https://github.com/repairman29/JARVIS)',
      },
    };
    https.get(opts, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`${res.statusCode} ${body.slice(0, 300)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const env = loadEnvFile();
  const token =
    (await resolveEnv('GITHUB_TOKEN', env)) ||
    process.env.GITHUB_TOKEN ||
    env.GITHUB_TOKEN;
  if (!token) {
    console.error(
      'GITHUB_TOKEN not set. Add it to Vault (env/clawdbot/GITHUB_TOKEN) or ~/.clawdbot/.env'
    );
    console.error('Create a PAT: GitHub → Settings → Developer settings → Personal access tokens');
    process.exit(1);
  }

  console.log('Checking GitHub token via API...\n');

  try {
    const user = await get('https://api.github.com/user', token);
    console.log('GitHub user (token valid):');
    console.log('  Login:', user.login);
    console.log('  Name:', user.name || '(not set)');
    console.log('  ID:', user.id);
    console.log('');

    const repos = await get('https://api.github.com/user/repos?per_page=5&sort=updated', token);
    console.log('Recent repos (sample):', Array.isArray(repos) ? repos.length : 0);
    if (Array.isArray(repos)) {
      repos.slice(0, 5).forEach((r) => console.log('  -', r.full_name));
    }
    console.log('');
    console.log('JARVIS can use this token for: repo list, issues, PRs, workflow_dispatch.');
  } catch (e) {
    console.error('GitHub API error:', e.message);
    if (e.message.includes('401'))
      console.error('Token invalid or expired. Create a new PAT with repo scope.');
    process.exit(1);
  }
}

main();
