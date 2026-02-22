#!/usr/bin/env node
/**
 * Add OpenAI, Google Gemini (cloud), and Anthropic as providers so the gateway
 * can use them when keys are in Vault or ~/.clawdbot/.env.
 *
 * Prereqs:
 *   OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY in Vault (env/clawdbot/*) or .env
 *
 * Run from repo root: node scripts/add-openai-gemini-anthropic-providers.js
 * Then restart the gateway.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const CONTEXT_128K = 131072;

const PROVIDERS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '${OPENAI_API_KEY}',
    api: 'openai-completions',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o mini', contextWindow: CONTEXT_128K, maxTokens: 8192 },
      { id: 'gpt-4o', name: 'GPT-4o', contextWindow: CONTEXT_128K, maxTokens: 8192 },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini', contextWindow: CONTEXT_128K, maxTokens: 8192 },
    ],
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    apiKey: '${GEMINI_API_KEY}',
    api: 'openai-completions',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', contextWindow: 1048576, maxTokens: 8192 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', contextWindow: 1048576, maxTokens: 8192 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1048576, maxTokens: 8192 },
    ],
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    apiKey: '${ANTHROPIC_API_KEY}',
    api: 'openai-completions',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, maxTokens: 8192 },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000, maxTokens: 8192 },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000, maxTokens: 8192 },
    ],
  },
};

function main() {
  if (!fs.existsSync(CLAWDBOT_JSON)) {
    console.error('No ~/.clawdbot/clawdbot.json found. Run set-primary-groq.js or add-cerebras-provider.js first.');
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
  let added = [];
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
    console.log('OpenAI, Gemini, and Anthropic providers already present. No changes.');
  }
  console.log('Keys: OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY in Vault or ~/.clawdbot/.env');
  console.log('Restart the gateway to use them. Set primary or add to fallbacks as needed (e.g. openai/gpt-4o-mini, gemini/gemini-2.5-flash, anthropic/claude-3-5-sonnet-20241022).');
}

main();
