#!/usr/bin/env node
/**
 * Add Hugging Face Inference API as an OpenAI-compatible provider.
 * Base URL: https://api-inference.huggingface.co/v1 (OpenAI-compatible chat completions).
 *
 * Prereq: HUGGINGFACE_API_KEY in Vault or ~/.clawdbot/.env (token from https://huggingface.co/settings/tokens).
 * Run from repo root: node scripts/add-huggingface-provider.js
 * Then restart the gateway.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const CONTEXT_128K = 131072;

const HF_PROVIDER = {
  baseUrl: 'https://api-inference.huggingface.co/v1',
  apiKey: '${HUGGINGFACE_API_KEY}',
  api: 'openai-completions',
  models: [
    { id: 'meta-llama/Llama-3.2-3B-Instruct', name: 'Llama 3.2 3B (HF)', contextWindow: CONTEXT_128K, maxTokens: 8192 },
    { id: 'Qwen/Qwen2.5-3B-Instruct', name: 'Qwen 2.5 3B (HF)', contextWindow: CONTEXT_128K, maxTokens: 8192 },
    { id: 'mistralai/Mistral-7B-Instruct-v0.3', name: 'Mistral 7B (HF)', contextWindow: 32768, maxTokens: 8192 },
  ],
};

function main() {
  if (!fs.existsSync(CLAWDBOT_JSON)) {
    console.error('No ~/.clawdbot/clawdbot.json found.');
    process.exit(1);
  }
  let config = JSON.parse(fs.readFileSync(CLAWDBOT_JSON, 'utf8'));
  if (!config.models) config.models = {};
  if (!config.models.providers) config.models.providers = {};
  config.models.providers.huggingface = HF_PROVIDER;
  fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
  console.log('Added provider huggingface to ~/.clawdbot/clawdbot.json');
  console.log('Use e.g. huggingface/meta-llama/Llama-3.2-3B-Instruct in primary or fallbacks. Restart the gateway.');
}

main();
