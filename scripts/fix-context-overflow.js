#!/usr/bin/env node
/**
 * Fix "Context overflow: prompt too large for the model" for wake-word and chat.
 *
 * 1. Sets agents.defaults.bootstrapMaxChars to 5000 (trims workspace/bootstrap in each request).
 * 2. Ensures Groq provider models use contextWindow: 131072 (128K) so the prompt isn't capped low.
 *
 * Run from repo root: node scripts/fix-context-overflow.js
 * Then restart the gateway: node scripts/start-gateway-with-vault.js (or your start command).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const CONTEXT_128K = 131072;
const BOOTSTRAP_MAX_CHARS = 5000;

const GROQ_BLOCK = {
  baseUrl: 'https://api.groq.com/openai/v1',
  apiKey: '${GROQ_API_KEY}',
  api: 'openai-completions',
  models: [
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', contextWindow: CONTEXT_128K },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', contextWindow: CONTEXT_128K },
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B Versatile', contextWindow: CONTEXT_128K }
  ]
};

function ensureGroqContext(config) {
  if (!config.models) config.models = {};
  if (!config.models.providers) config.models.providers = {};
  let groq = config.models.providers.groq;
  if (!groq || !Array.isArray(groq.models)) {
    config.models.providers.groq = { ...GROQ_BLOCK };
    return true;
  }
  let changed = false;
  groq.models.forEach(m => {
    if (m && (m.contextWindow == null || m.contextWindow < CONTEXT_128K)) {
      m.contextWindow = CONTEXT_128K;
      changed = true;
    }
  });
  return changed;
}

function main() {
  let config = {};
  if (fs.existsSync(CLAWDBOT_JSON)) {
    try {
      config = JSON.parse(fs.readFileSync(CLAWDBOT_JSON, 'utf8'));
    } catch (e) {
      console.error('Could not parse ~/.clawdbot/clawdbot.json:', e.message);
      process.exit(1);
    }
  } else {
    if (!fs.existsSync(CLAWDBOT_DIR)) fs.mkdirSync(CLAWDBOT_DIR, { recursive: true });
    console.log('Created ~/.clawdbot/clawdbot.json (minimal config for context fix).');
  }

  let changed = false;

  // 1. Bootstrap trim
  if (!config.agents) config.agents = {};
  if (!config.agents.defaults) config.agents.defaults = {};
  const currentBootstrap = config.agents.defaults.bootstrapMaxChars;
  if (currentBootstrap == null || currentBootstrap > BOOTSTRAP_MAX_CHARS) {
    config.agents.defaults.bootstrapMaxChars = BOOTSTRAP_MAX_CHARS;
    console.log('Set agents.defaults.bootstrapMaxChars to', BOOTSTRAP_MAX_CHARS);
    changed = true;
  }

  // 2. Groq 128K context
  if (ensureGroqContext(config)) {
    console.log('Set models.providers.groq contextWindow to 131072 (128K)');
    changed = true;
  }

  if (!changed) {
    console.log('Config already has bootstrapMaxChars and Groq 128K context. No changes made.');
    return;
  }

  fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
  console.log('Wrote ~/.clawdbot/clawdbot.json');
  console.log('Restart the gateway for the fix to take effect.');
}

main();
