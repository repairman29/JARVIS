#!/usr/bin/env node
/**
 * Point JARVIS gateway at your Neural Farm (OpenAI-compatible API on port 4000).
 *
 * Adds a "farm" provider to ~/.clawdbot/clawdbot.json and sets primary model to farm/gpt-4o-mini.
 * Your farm must be running: cd neural-farm && ./start_farm.sh (base URL http://localhost:4000/v1, key sk-local-farm).
 *
 * Run from repo root: node scripts/set-primary-neural-farm.js
 * Restart the gateway after running.
 *
 * Optional: set NEURAL_FARM_BASE_URL (default http://localhost:4000/v1) and NEURAL_FARM_API_KEY (default sk-local-farm) in ~/.clawdbot/.env if your farm is at a different URL/key.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const ENV_PATH = path.join(CLAWDBOT_DIR, '.env');

const DEFAULT_BASE = 'http://localhost:4000/v1';
const DEFAULT_KEY = 'sk-local-farm';

// Optional: load .env to read overrides
if (fs.existsSync(ENV_PATH)) {
  require('dotenv').config({ path: ENV_PATH });
}
const baseUrl = (process.env.NEURAL_FARM_BASE_URL || DEFAULT_BASE).replace(/\/$/, '');
const apiKey = process.env.NEURAL_FARM_API_KEY || DEFAULT_KEY;

const FARM_PROVIDER = {
  baseUrl,
  apiKey,
  api: 'openai-completions',
  models: [
    { id: 'gpt-4o-mini', name: 'GPT-4o mini (farm)', contextWindow: 131072 },
    { id: 'gpt-4o', name: 'GPT-4o (farm)', contextWindow: 131072 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (farm)', contextWindow: 16384 },
    { id: 'cluster-model', name: 'Cluster (farm)', contextWindow: 131072 },
  ],
};

const PRIMARY_MODEL = 'farm/gpt-4o-mini';

let config = {};
if (fs.existsSync(CLAWDBOT_JSON)) {
  try {
    config = JSON.parse(fs.readFileSync(CLAWDBOT_JSON, 'utf8'));
  } catch (e) {
    console.error('Could not parse clawdbot.json:', e.message);
    process.exit(1);
  }
} else {
  if (!fs.existsSync(CLAWDBOT_DIR)) {
    fs.mkdirSync(CLAWDBOT_DIR, { recursive: true });
    console.log('Created ~/.clawdbot');
  }
}

if (!config.models) config.models = {};
if (!config.models.providers) config.models.providers = {};
config.models.providers.farm = FARM_PROVIDER;

if (!config.agents) config.agents = {};
if (!config.agents.defaults) config.agents.defaults = {};
if (!config.agents.defaults.model) config.agents.defaults.model = {};
config.agents.defaults.model.primary = PRIMARY_MODEL;

fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
console.log('Added models.providers.farm and set agents.defaults.model.primary to "' + PRIMARY_MODEL + '" in ~/.clawdbot/clawdbot.json');
console.log('Farm URL:', baseUrl);
console.log('Restart the gateway (e.g. node scripts/start-gateway-with-vault.js) for the change to take effect.');
console.log('Ensure the Neural Farm is running: cd neural-farm && ./start_farm.sh');
