#!/usr/bin/env node
/**
 * Set Railway service variables via the Public API (GraphQL).
 * Alternative to CLI: railway variables --set "SUPABASE_URL=..."
 *
 * Use when you prefer API over CLI (e.g. in CI or without Railway CLI).
 * Requires: RAILWAY_TOKEN (or RAILWAY_API_TOKEN) in env.
 *
 * Run from repo root:
 *   RAILWAY_TOKEN=your_token node scripts/railway-set-variables.js
 */

const token = process.env.RAILWAY_TOKEN || process.env.RAILWAY_API_TOKEN;
if (!token) {
  console.error('Set RAILWAY_TOKEN or RAILWAY_API_TOKEN and run again.');
  process.exit(1);
}

const projectId = process.env.RAILWAY_PROJECT_ID || '6f265b15-0c70-4681-b36c-e227234c4c63';
const environmentId = process.env.RAILWAY_ENVIRONMENT_ID || '7804f16a-ea76-4650-8f72-dba7341bbe71';
const serviceId = process.env.RAILWAY_SERVICE_ID || 'c69ac50e-d4b3-4513-9b74-4d69ffd70f75';

const SUPABASE_URL = 'https://rbfzlqmkwhbvrrfdcain.supabase.co';

async function variableUpsert(name, value) {
  const res = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation variableUpsert($input: VariableUpsertInput!) {
          variableUpsert(input: $input)
        }
      `,
      variables: {
        input: {
          projectId,
          environmentId,
          serviceId,
          name,
          value,
        },
      },
    }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data?.variableUpsert;
}

async function main() {
  console.log('Setting SUPABASE_URL for jarvis-gateway...');
  await variableUpsert('SUPABASE_URL', SUPABASE_URL);
  console.log('SUPABASE_URL set. Redeploy to apply: railway redeploy -y');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
