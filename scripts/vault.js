/**
 * Vault resolution for JARVIS scripts.
 * Resolves logical secret names via app_secrets + vault.decrypted_secrets.
 * Loads ~/.clawdbot/.env for Supabase URL/key; prefers Vault when app_secrets has an entry.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function loadEnvFile() {
  const candidates = [
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.clawdbot', '.env') : null,
    process.env.HOME ? path.join(process.env.HOME, '.clawdbot', '.env') : null,
    path.join(os.homedir(), '.clawdbot', '.env')
  ].filter(Boolean);
  const envPath = candidates.find((c) => fs.existsSync(c));
  if (!envPath) return {};
  const text = fs.readFileSync(envPath, 'utf8');
  const out = {};
  const normalized = text.replace(/^\uFEFF/, '');
  for (const line of normalized.split(/\r?\n/)) {
    const match = line.trimEnd().match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
  for (const [k, v] of Object.entries(out)) {
    if (typeof process.env[k] === 'undefined') process.env[k] = v;
  }
  return out;
}

function getSupabaseConfig(env) {
  const e = env || loadEnvFile();
  const url = process.env.SUPABASE_URL || e.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    e.SUPABASE_SERVICE_ROLE_KEY ||
    e.SUPABASE_SERVICE_KEY;
  return { url, key };
}

async function callRpc(supabaseUrl, serviceKey, fnName, payload) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload || {})
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

/**
 * Fetch decrypted secret by UUID from vault.decrypted_secrets.
 * @param {string} supabaseUrl
 * @param {string} serviceKey
 * @param {string} secretId - UUID from app_secrets.secret_id
 * @returns {Promise<string|null>} decrypted value or null
 */
async function getDecryptedSecret(supabaseUrl, serviceKey, secretId) {
  const data = await callRpc(supabaseUrl, serviceKey, 'get_vault_secret', { secret_id: secretId });
  if (data == null) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

/**
 * Resolve logical name via app_secrets then vault.decrypted_secrets.
 * @param {string} supabaseUrl
 * @param {string} serviceKey
 * @param {string} name - e.g. env/clawdbot/SUPABASE_SERVICE_ROLE_KEY
 * @returns {Promise<string|null>}
 */
async function getSecretByName(supabaseUrl, serviceKey, name) {
  const data = await callRpc(supabaseUrl, serviceKey, 'get_vault_secret_by_name', { secret_name: name });
  if (data == null) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

/**
 * Resolve env key: try Vault name env/clawdbot/<KEY>, then process.env / fallback env.
 * @param {string} key - e.g. SUPABASE_SERVICE_ROLE_KEY
 * @param {object} fallbackEnv - optional env map (e.g. from loadEnvFile())
 * @returns {Promise<string|undefined>}
 */
async function resolveEnv(key, fallbackEnv) {
  const config = getSupabaseConfig(fallbackEnv);
  if (!config.url || !config.key) {
    return sanitizeEnvValue(process.env[key] || (fallbackEnv && fallbackEnv[key]));
  }
  const vaultName = `env/clawdbot/${key}`;
  const vaultValue = await getSecretByName(config.url, config.key, vaultName);
  if (vaultValue != null && vaultValue !== '') return vaultValue;
  return sanitizeEnvValue(process.env[key] || (fallbackEnv && fallbackEnv[key]));
}

/**
 * Sync version: resolve from process.env / fallback only (no Vault fetch).
 * Use when async is not available or caller already hydrated env from Vault.
 */
function getEnv(key, fallbackEnv) {
  return sanitizeEnvValue(process.env[key] || (fallbackEnv && fallbackEnv[key]));
}

function sanitizeEnvValue(value) {
  if (typeof value !== 'string') return value;
  if (value.startsWith('vault://app_secrets/')) return undefined;
  return value;
}

module.exports = {
  loadEnvFile,
  getSupabaseConfig,
  getDecryptedSecret,
  getSecretByName,
  resolveEnv,
  getEnv
};
