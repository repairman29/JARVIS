#!/usr/bin/env node
/**
 * Add OpenRouter and Together as OpenAI-compatible providers.
 * OpenRouter: ~50 req/day free; Together: Llama 3.3 70B.
 *
 * Prereqs: OPENROUTER_API_KEY, TOGETHER_API_KEY in Vault or ~/.clawdbot/.env
 * Run from repo root: node scripts/add-openrouter-together-providers.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const CONTEXT_128K = 131072;

const PROVIDERS = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '${OPENROUTER_API_KEY}',
    api: 'openai-completions',
    models: [
      { id: 'arcee-ai/trinity-mini:free', name: 'Arcee Trinity Mini (free)', contextWindow: CONTEXT_128K, maxTokens: 8192 },
    ],
  },
  together: {
    baseUrl: 'https://api.together.xyz/v1',
    apiKey: '${TOGETHER_API_KEY}',
    api: 'openai-completions',
    models: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo (Together)', contextWindow: CONTEXT_128K, maxTokens: 8192 },
    ],
  },
};

function main() {
  if (!fs.existsSync(CLAWDBOT_JSON)) {
    console.error('No ~/.clawdbot/clawdbot.json found.');
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(CLAWDBOT_JSON, 'utf8'));
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
  if (added.length) console.log('Added providers:', added.join(', '));
  else console.log('OpenRouter and Together providers already present.');
  console.log('Run node scripts/optimize-llm-fallbacks.js to include them in the fallback order.');
}

main();
