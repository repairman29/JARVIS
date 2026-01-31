const path = require('path');
const { loadEnvFile, resolveEnv } = require('../../scripts/vault.js');

const DEFAULT_SUPABASE_TIMEOUT_MS = 15000;
const DEFAULT_OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

async function supabaseRequest(supabase, pathSuffix, method, body, query) {
  const queryString = query ? `?${query}` : '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_SUPABASE_TIMEOUT_MS);
  try {
    const response = await fetch(`${supabase.url}/rest/v1/${pathSuffix}${queryString}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        apikey: supabase.key,
        Authorization: `Bearer ${supabase.key}`,
        Prefer: 'return=representation'
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Supabase ${method} ${pathSuffix} failed: ${response.status} ${text}`);
    }
    return text ? JSON.parse(text) : [];
  } finally {
    clearTimeout(timeout);
  }
}

async function generateEmbedding(text, model) {
  const response = await fetch(`${DEFAULT_OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text })
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Ollama embeddings failed: ${response.status} ${body}`);
  }
  const data = await response.json();
  return data.embedding;
}

async function getSupabaseConfig() {
  const env = loadEnvFile();
  const supabaseUrl = await resolveEnv('SUPABASE_URL', env);
  const supabaseKey =
    (await resolveEnv('SUPABASE_SERVICE_ROLE_KEY', env)) ||
    (await resolveEnv('SUPABASE_ANON_KEY', env));
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set. Use ~/.clawdbot/.env or Vault.');
  }
  return { url: supabaseUrl, key: supabaseKey };
}

async function getRepoId(supabase, repo) {
  const rows = await supabaseRequest(supabase, 'repo_sources', 'GET', null, `name=eq.${encodeURIComponent(repo)}&select=id`);
  if (!rows || rows.length === 0) {
    throw new Error(`Repo not found in index: ${repo}`);
  }
  return rows[0].id;
}

const tools = {
  repo_search: async ({ query, repo, limit = 6 }) => {
    try {
      const supabase = await getSupabaseConfig();
      const embedding = await generateEmbedding(query, 'nomic-embed-text');
      const rows = await supabaseRequest(
        supabase,
        'rpc/match_repo_chunks',
        'POST',
        {
          query_embedding: embedding,
          match_count: limit,
          repo_filter: repo || null
        }
      );
      return { success: true, results: rows, query, repo: repo || null };
    } catch (error) {
      return { success: false, message: error.message, query, repo: repo || null };
    }
  },

  repo_summary: async ({ repo }) => {
    try {
      const supabase = await getSupabaseConfig();
      const repoId = await getRepoId(supabase, repo);
      const rows = await supabaseRequest(supabase, 'repo_summaries', 'GET', null, `repo_id=eq.${repoId}&select=summary,updated_at`);
      if (!rows || rows.length === 0) {
        return { success: false, message: `No summary found for ${repo}` };
      }
      return { success: true, repo, summary: rows[0].summary, updatedAt: rows[0].updated_at };
    } catch (error) {
      return { success: false, message: error.message, repo };
    }
  },

  repo_file: async ({ repo, path: filePath, limit = 4 }) => {
    try {
      const supabase = getSupabaseConfig();
      const repoId = await getRepoId(supabase, repo);
      const fileRows = await supabaseRequest(
        supabase,
        'repo_files',
        'GET',
        null,
        `repo_id=eq.${repoId}&path=ilike.*${encodeURIComponent(filePath)}*&select=id,path&limit=1`
      );
      if (!fileRows || fileRows.length === 0) {
        return { success: false, message: `File not indexed: ${filePath}`, repo };
      }
      const fileId = fileRows[0].id;
      const chunks = await supabaseRequest(
        supabase,
        'repo_chunks',
        'GET',
        null,
        `file_id=eq.${fileId}&select=content,created_at&limit=${limit}`
      );
      return { success: true, repo, path: fileRows[0].path, chunks };
    } catch (error) {
      return { success: false, message: error.message, repo, path: filePath };
    }
  },

  repo_map: async ({ repo, limit = 60 }) => {
    try {
      const supabase = await getSupabaseConfig();
      const repoId = await getRepoId(supabase, repo);
      const files = await supabaseRequest(
        supabase,
        'repo_files',
        'GET',
        null,
        `repo_id=eq.${repoId}&select=path&limit=${limit}`
      );
      return { success: true, repo, files: files.map((file) => file.path) };
    } catch (error) {
      return { success: false, message: error.message, repo };
    }
  }
};

module.exports = { tools };
