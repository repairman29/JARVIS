#!/usr/bin/env node
/**
 * Add missing LICENSE and README.md across repairman29 repos via GitHub API.
 * Uses gh CLI authentication.
 */

const { execSync } = require('child_process');

const OWNER = 'repairman29';
const BATCH_SIZE = Number.parseInt(process.env.BATCH_SIZE || '10', 10);

function ghJson(command, allowFailure = false) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return JSON.parse(output);
  } catch (error) {
    if (allowFailure) return null;
    throw error;
  }
}

function ghOk(command) {
  try {
    execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
}

function flattenRepos(raw) {
  if (!Array.isArray(raw)) return [];
  if (Array.isArray(raw[0])) return raw.flat();
  return raw;
}

function listRepos() {
  const output = execSync(
    'gh api --paginate --slurp "user/repos?per_page=100"',
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  );
  return flattenRepos(JSON.parse(output));
}

function fileExists(repo, path) {
  return ghOk(`gh api "repos/${OWNER}/${repo}/contents/${path}"`);
}

function getDescription(repo) {
  const info = ghJson(`gh api "repos/${OWNER}/${repo}"`, true);
  return info && info.description ? info.description : '';
}

function detectPrimaryLanguage(repo) {
  const info = ghJson(`gh api "repos/${OWNER}/${repo}"`, true);
  return info && info.language ? info.language : 'Unknown';
}

function getQuickStart(language) {
  const lang = (language || '').toLowerCase();
  if (lang.includes('typescript') || lang.includes('javascript')) {
    return [
      '```bash',
      'npm install',
      'npm run dev',
      '```'
    ].join('\n');
  }
  if (lang.includes('python')) {
    return [
      '```bash',
      'python -m venv .venv',
      '.venv\\Scripts\\activate',
      'pip install -r requirements.txt',
      '```'
    ].join('\n');
  }
  if (lang.includes('rust')) {
    return [
      '```bash',
      'cargo build --release',
      '```'
    ].join('\n');
  }
  if (lang.includes('go')) {
    return [
      '```bash',
      'go build ./...',
      '```'
    ].join('\n');
  }
  return [
    '```bash',
    '# See repository docs for setup instructions.',
    '```'
  ].join('\n');
}

function buildReadme({ repo, description, language, isPrivate, licenseLabel }) {
  const desc = description || 'Project description coming soon.';
  const quickStart = getQuickStart(language);
  const visibility = isPrivate ? 'Private repository' : 'Public repository';
  return [
    `# ${repo}`,
    '',
    desc,
    '',
    `Status: ${visibility}`,
    '',
    '## Quick Start',
    quickStart,
    '',
    '## License',
    licenseLabel,
    ''
  ].join('\n');
}

function buildLicense({ isPrivate, year, owner }) {
  if (isPrivate) {
    return [
      `Copyright (c) ${year} ${owner}`,
      '',
      'All rights reserved.',
      '',
      'This software and associated documentation files are proprietary and confidential.',
      'Unauthorized copying, modification, distribution, or use is strictly prohibited.'
    ].join('\n');
  }
  return [
    'MIT License',
    '',
    `Copyright (c) ${year} ${owner}`,
    '',
    'Permission is hereby granted, free of charge, to any person obtaining a copy',
    'of this software and associated documentation files (the "Software"), to deal',
    'in the Software without restriction, including without limitation the rights',
    'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
    'copies of the Software, and to permit persons to whom the Software is',
    'furnished to do so, subject to the following conditions:',
    '',
    'The above copyright notice and this permission notice shall be included in all',
    'copies or substantial portions of the Software.',
    '',
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
    'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
    'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
    'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
    'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
    'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
    'SOFTWARE.'
  ].join('\n');
}

function putFile(repo, path, content, message) {
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const cmd = [
    'gh api',
    `repos/${OWNER}/${repo}/contents/${path}`,
    '--method PUT',
    `-f message="${message}"`,
    `-f content="${encoded}"`
  ].join(' ');
  execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function processRepo(repoInfo) {
  const repo = repoInfo.name;
  const isPrivate = Boolean(repoInfo.private);
  const description = repoInfo.description || '';
  const language = detectPrimaryLanguage(repo);
  const year = new Date().getFullYear();
  const licenseLabel = isPrivate ? 'Proprietary' : 'MIT';

  const hasReadme = fileExists(repo, 'README.md') || fileExists(repo, 'readme.md');
  const hasLicense = fileExists(repo, 'LICENSE') || fileExists(repo, 'LICENSE.md');

  const actions = [];

  if (!hasLicense) {
    const licenseContent = buildLicense({ isPrivate, year, owner: OWNER });
    putFile(repo, 'LICENSE', licenseContent, 'Add LICENSE');
    actions.push('LICENSE');
  }

  if (!hasReadme) {
    const readme = buildReadme({
      repo,
      description,
      language,
      isPrivate,
      licenseLabel
    });
    putFile(repo, 'README.md', readme, 'Add README');
    actions.push('README');
  }

  return actions;
}

function main() {
  const repos = listRepos().sort((a, b) => {
    const aTime = new Date(a.updated_at || 0).getTime();
    const bTime = new Date(b.updated_at || 0).getTime();
    return bTime - aTime;
  });

  let processed = 0;
  let updated = 0;

  for (const repo of repos) {
    const actions = processRepo(repo);
    processed += 1;
    if (actions.length > 0) {
      updated += 1;
      console.log(`${repo.name}: added ${actions.join(' + ')}`);
    } else {
      console.log(`${repo.name}: ok`);
    }

    if (processed % BATCH_SIZE === 0) {
      console.log(`--- batch complete: ${processed} repos processed ---`);
    }
  }

  console.log(`Done. Repos processed: ${processed}. Updated: ${updated}.`);
}

main();
