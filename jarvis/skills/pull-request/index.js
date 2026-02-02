/**
 * Pull-request skill — GitHub pull request workflow: list, create, get, merge, comment, review, request reviewers.
 * Uses GitHub API. Requires GITHUB_TOKEN in ~/.clawdbot/.env or environment.
 * API: https://api.github.com
 */

(function loadEnv() {
  const fs = require('fs');
  const path = require('path');
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const candidates = [
    path.join(home, '.clawdbot', '.env'),
    process.env.CLAWDBOT_ENV,
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '..', '.env'),
    path.join(process.cwd(), '..', '..', '.env'),
    path.join(process.cwd(), '..', '..', '..', '.env')
  ].filter(Boolean);
  for (const envPath of candidates) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (m) {
          const val = m[2].replace(/^["']|["']$/g, '').replace(/\r/g, '').trim();
          if (!process.env[m[1]] || process.env[m[1]].startsWith('your_')) process.env[m[1]] = val;
        }
      });
    } catch (_) {}
  }
})();

const API_BASE = 'https://api.github.com';

function getToken() {
  const v = process.env.GITHUB_TOKEN;
  if (!v || v.startsWith('your_')) throw new Error('GITHUB_TOKEN not set. Add it to ~/.clawdbot/.env');
  return v;
}

async function ghFetch(path, options = {}) {
  const token = getToken();
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...(options.body && typeof options.body === 'object' && !(options.body instanceof ArrayBuffer)
      ? { body: JSON.stringify(options.body) }
      : options.body
      ? { body: options.body }
      : {}),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || text || res.statusText;
    throw new Error(`GitHub API ${res.status}: ${msg}`);
  }
  return data;
}

function qs(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

module.exports = {
  async list_prs({ owner, repo, state = 'open', head, base, per_page = 20 } = {}) {
    if (!owner || !repo) throw new Error('owner and repo are required');
    const slug = `${owner}/${repo}`;
    const params = { state, per_page };
    if (head) params.head = head;
    if (base) params.base = base;
    const data = await ghFetch(`/repos/${slug}/pulls` + qs(params));
    return {
      success: true,
      owner,
      repo,
      count: Array.isArray(data) ? data.length : 0,
      pulls: (Array.isArray(data) ? data : []).map((p) => ({
        number: p.number,
        title: p.title,
        state: p.state,
        head: p.head && p.head.ref,
        base: p.base && p.base.ref,
        html_url: p.html_url,
        user: p.user && p.user.login,
      })),
    };
  },

  async get_pr({ owner, repo, pull_number } = {}) {
    if (!owner || !repo || pull_number == null) throw new Error('owner, repo, and pull_number are required');
    const slug = `${owner}/${repo}`;
    const data = await ghFetch(`/repos/${slug}/pulls/${pull_number}`);
    return {
      success: true,
      number: data.number,
      title: data.title,
      state: data.state,
      body: data.body,
      html_url: data.html_url,
      head: data.head && data.head.ref,
      base: data.base && data.base.ref,
      user: data.user && data.user.login,
      mergeable: data.mergeable,
      merged: data.merged,
    };
  },

  async create_pr({ owner, repo, title, body, head, base = 'main' } = {}) {
    if (!owner || !repo || !title || !head) throw new Error('owner, repo, title, and head are required');
    const slug = `${owner}/${repo}`;
    const data = await ghFetch(`/repos/${slug}/pulls`, {
      method: 'POST',
      body: { title, body: body || '', head, base },
    });
    return {
      success: true,
      number: data.number,
      title: data.title,
      html_url: data.html_url,
    };
  },

  async merge_pr({ owner, repo, pull_number, merge_method = 'merge', commit_title } = {}) {
    if (!owner || !repo || pull_number == null) throw new Error('owner, repo, and pull_number are required');
    const slug = `${owner}/${repo}`;
    const body = { merge_method };
    if (commit_title) body.commit_title = commit_title;
    const data = await ghFetch(`/repos/${slug}/pulls/${pull_number}/merge`, {
      method: 'PUT',
      body,
    });
    return {
      success: true,
      merged: true,
      message: data.message,
      sha: data.sha,
      html_url: data.html_url,
    };
  },

  async pr_comment({ owner, repo, pull_number, body } = {}) {
    if (!owner || !repo || pull_number == null || !body) throw new Error('owner, repo, pull_number, and body are required');
    const slug = `${owner}/${repo}`;
    const data = await ghFetch(`/repos/${slug}/issues/${pull_number}/comments`, {
      method: 'POST',
      body: { body },
    });
    return {
      success: true,
      comment_url: data.html_url,
    };
  },

  async pr_review({ owner, repo, pull_number, event = 'COMMENT', body } = {}) {
    if (!owner || !repo || pull_number == null) throw new Error('owner, repo, and pull_number are required');
    if (event === 'REQUEST_CHANGES' && !body) throw new Error('body is required for REQUEST_CHANGES');
    const slug = `${owner}/${repo}`;
    const data = await ghFetch(`/repos/${slug}/pulls/${pull_number}/reviews`, {
      method: 'POST',
      body: { event, body: body || '' },
    });
    return {
      success: true,
      id: data.id,
      state: data.state,
      body: data.body,
    };
  },

  async request_review({ owner, repo, pull_number, reviewers } = {}) {
    if (!owner || !repo || pull_number == null) throw new Error('owner, repo, and pull_number are required');
    if (!Array.isArray(reviewers) || reviewers.length === 0) throw new Error('reviewers (array of usernames) is required');
    const slug = `${owner}/${repo}`;
    const data = await ghFetch(`/repos/${slug}/pulls/${pull_number}/requested_reviewers`, {
      method: 'POST',
      body: { reviewers },
    });
    return {
      success: true,
      requested_reviewers: (data.requested_reviewers || []).map((r) => r.login),
    };
  },
};
