#!/usr/bin/env node
/**
 * Add Mistral, Cohere, and DeepSeek as OpenAI-compatible providers.
 *
 * Prereqs: MISTRAL_API_KEY, COHERE_API_KEY, DEEPSEEK_API_KEY in Vault or ~/.clawdbot/.env
 * Run from repo root: node scripts/add-mistral-cohere-deepseek-providers.js
 * Then restart the gateway.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const CONTEXT_128K = 131072;

const PROVIDERS = {
  mistral: {
    baseUrl: 'https://api.mistral.ai/v1',
    apiKey: '${MISTRAL_API_KEY}',
    api: 'openai-completions',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', contextWindow: CONTEXT_128K, maxTokens: 8192 },
      { id: 'mistral-small-latest', name: 'Mistral Small', contextWindow: CONTEXT_128K, maxTokens: 8192 },
      { id: 'codestral-latest', name: 'Codestral', contextWindow: CONTEXT_128K, maxTokens: 8192 },
    ],
  },
  cohere: {
    baseUrl: 'https://api.cohere.ai/compatibility/v1',
    apiKey: '${COHERE_API_KEY}',
    api: 'openai-completions',
    models: [
      { id: 'command-r-plus', name: 'Command R+', contextWindow: 128000, maxTokens: 8192 },
      { id: 'command-a-03-2025', name: 'Command A', contextWindow: 128000, maxTokens: 8192 },
      { id: 'command-r', name: 'Command R', contextWindow: 128000, maxTokens: 8192 },
    ],
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '${DEEPSEEK_API_KEY}',
    api: 'openai-completions',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', contextWindow: CONTEXT_128K, maxTokens: 8192 },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', contextWindow: CONTEXT_128K, maxTokens: 8192 },
    ],
  },
};

function main() {
  if (!fs.existsSync(CLAWDBOT_JSON)) {
    console.error('No ~/.clawdbot/clawdbot.json found. Run add-cerebras-provider.js or set-primary-groq.js first.');
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
  const added = [];
  for (const [id, block] of Object.entries(PROVIDERS)) {
    if (!config.models.providers[id]) {
      config.models.providers[id] = block;
      added.push(id);
    }
  }

  fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
  if (added.length) {
    console.log('Added providers:', added.join(', '), 'to ~/.clawdbot/clawdbot.json');
  } else {
    console.log('Mistral, Cohere, and DeepSeek providers already present.');
  }
  console.log('Keys: MISTRAL_API_KEY, COHERE_API_KEY, DEEPSEEK_API_KEY in Vault or ~/.clawdbot/.env');
  console.log('Restart the gateway. Use e.g. mistral/mistral-large-latest, cohere/command-r-plus, deepseek/deepseek-chat in primary or fallbacks.');
}

main();
