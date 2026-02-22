#!/usr/bin/env node
/**
 * Sync offline-farm env vars from ~/.clawdbot/.env and Supabase Vault to Railway.
 * Uses Railway CLI when available (railway link in repo); else Railway Public API if RAILWAY_TOKEN set.
 *
 * Run from repo root:
 *   node scripts/railway-set-variables.js
 *
 * Auth: If RAILWAY_TOKEN is set (e.g. in ~/.clawdbot/.env), uses Railway Public API. The token must
 * be a Project Token: Railway Dashboard → your project (jarvis-gateway) → Settings → Tokens →
 * Create Token. If RAILWAY_TOKEN is not set, uses `railway` CLI (must be logged in and linked:
 * railway login && railway link).
 */

const { spawn } = require('child_process');
const { loadEnvFile, resolveEnv } = require('./vault.js');

const VAULT_SUPABASE_URL = 'https://rbfzlqmkwhbvrrfdcain.supabase.co';

const projectId = process.env.RAILWAY_PROJECT_ID || '6f265b15-0c70-4681-b36c-e227234c4c63';
const environmentId = process.env.RAILWAY_ENVIRONMENT_ID || '7804f16a-ea76-4650-8f72-dba7341bbe71';
const serviceId = process.env.RAILWAY_SERVICE_ID || 'c69ac50e-d4b3-4513-9b74-4d69ffd70f75';

const OFFLINE_FARM_KEYS = [
  'PORT',
  'VAULT_SUPABASE_URL',
  'VAULT_SUPABASE_SERVICE_ROLE_KEY',
  'GROQ_API_KEY',
  'CEREBRAS_API_KEY',
  'GEMINI_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENROUTER_API_KEY',
  'TOGETHER_API_KEY',
  'MISTRAL_API_KEY',
  'COHERE_API_KEY',
  'DEEPSEEK_API_KEY',
  'HUGGINGFACE_API_KEY',
  'CLAWDBOT_GATEWAY_TOKEN'
];

function runRailwayCli(variables) {
  const env = { ...process.env };
  delete env.RAILWAY_TOKEN;
  delete env.RAILWAY_API_TOKEN;
  const opts = { stdio: 'inherit', shell: false, env, cwd: process.cwd() };
  return Object.entries(variables).reduce((p, [k, v]) => {
    const safe = String(v).replace(/\n/g, ' ').trim();
    return p.then(() => new Promise((resolve, reject) => {
      const child = spawn('railway', ['variables', '--skip-deploys', '--set', `${k}=${safe}`], opts);
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`railway exit ${code} for ${k}`))));
    }));
  }, Promise.resolve());
}

async function variableCollectionUpsert(authToken, variables) {
  const res = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      query: `
        mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
          variableCollectionUpsert(input: $input)
        }
      `,
      variables: {
        input: {
          projectId,
          environmentId,
          serviceId,
          variables,
          replace: false,
        },
      },
    }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join('; '));
  if (!res.ok) {
    const msg = res.status === 401
      ? 'Not Authorized: use a Project Token from Railway → Project → Settings → Tokens, set as RAILWAY_TOKEN in ~/.clawdbot/.env'
      : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json.data?.variableCollectionUpsert;
}

async function main() {
  const env = loadEnvFile();
  const variables = {};
  for (const key of OFFLINE_FARM_KEYS) {
    let value;
    if (key === 'PORT') value = process.env.PORT || env.PORT || '3000';
    else if (key === 'VAULT_SUPABASE_URL') value = process.env.VAULT_SUPABASE_URL || env.VAULT_SUPABASE_URL || VAULT_SUPABASE_URL;
    else value = await resolveEnv(key, env);
    if (value != null && String(value).trim()) variables[key] = String(value).trim();
  }

  const keys = Object.keys(variables);
  if (keys.length === 0) {
    console.log('No variables to set. Add keys to ~/.clawdbot/.env or Vault (env/clawdbot/<KEY>).');
    return;
  }

  console.log('Syncing', keys.length, 'variables to Railway (jarvis-gateway)...');
  const useCli = !process.env.RAILWAY_TOKEN && !process.env.RAILWAY_API_TOKEN;
  if (useCli) {
    await runRailwayCli(variables);
  } else {
    const authToken = process.env.RAILWAY_TOKEN || process.env.RAILWAY_API_TOKEN;
    await variableCollectionUpsert(authToken, variables);
  }
  console.log('Set:', keys.join(', '));
  console.log('Redeploy to apply: railway redeploy -y');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
