#!/usr/bin/env node
/**
 * Add Cerebras as an OpenAI-compatible provider and optional fallback.
 * Cerebras: https://api.cerebras.ai/v1, free tier ~30 RPM, 1M tokens/day, Llama 3.3 70B.
 *
 * Prereq: CEREBRAS_API_KEY in ~/.clawdbot/.env or Vault (env/clawdbot/CEREBRAS_API_KEY).
 * Run from repo root: node scripts/add-cerebras-provider.js
 * Then restart the gateway.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const CONTEXT_128K = 131072;

const CEREBRAS_BLOCK = {
  baseUrl: 'https://api.cerebras.ai/v1',
  apiKey: '${CEREBRAS_API_KEY}',
  api: 'openai-completions',
  models: [
    { id: 'llama-3.3-70b', name: 'Llama 3.3 70B (Cerebras)', contextWindow: CONTEXT_128K, maxTokens: 8192 },
    { id: 'llama3.1-8b', name: 'Llama 3.1 8B (Cerebras)', contextWindow: CONTEXT_128K, maxTokens: 8192 }
  ]
};

const CEREBRAS_FALLBACK = 'cerebras/llama-3.3-70b';

function main() {
  if (!fs.existsSync(CLAWDBOT_JSON)) {
    console.error('No ~/.clawdbot/clawdbot.json found. Run set-primary-groq.js first or create config.');
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(CLAWDBOT_JSON, 'utf8'));
  } catch (e) {
    console.error('Could not parse clawdbot.json:', e.message);
    process.exit(1);
  }

  if (!config.models) config.models = {};
  if (!config.models.providers) config.models.providers = {};
  config.models.providers.cerebras = CEREBRAS_BLOCK;

  const agents = config.agents && config.agents.defaults && config.agents.defaults.model;
  let fallbacks = agents && Array.isArray(agents.fallbacks) ? agents.fallbacks : [];
  if (fallbacks.indexOf(CEREBRAS_FALLBACK) === -1) {
    fallbacks = [...fallbacks, CEREBRAS_FALLBACK];
    if (!config.agents) config.agents = {};
    if (!config.agents.defaults) config.agents.defaults = {};
    if (!config.agents.defaults.model) config.agents.defaults.model = {};
    config.agents.defaults.model.fallbacks = fallbacks;
  }

  fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
  console.log('Added models.providers.cerebras and', CEREBRAS_FALLBACK, 'to fallbacks in ~/.clawdbot/clawdbot.json');
  console.log('Add CEREBRAS_API_KEY to ~/.clawdbot/.env or Vault (env/clawdbot/CEREBRAS_API_KEY), then restart the gateway.');
}

main();
