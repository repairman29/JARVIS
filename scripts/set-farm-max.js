#!/usr/bin/env node
/**
 * Max JARVIS with the Neural Farm: best farm model as primary, farm fallbacks, optional Groq when farm is down.
 * Also ensures bootstrapMaxChars so we don't blow the farm's context.
 *
 * Prereq: Farm provider already in clawdbot.json (run set-primary-neural-farm.js first).
 * Run from repo root: node scripts/set-farm-max.js
 * Restart the gateway after running.
 *
 * Optional: set JARVIS_FARM_MAX_ADD_GROQ_FALLBACK=1 in env to add groq/llama-3.1-8b-instant as last fallback when farm is unreachable (need GROQ_API_KEY in .env or Vault).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const BOOTSTRAP_MAX_CHARS = 5000;

// Best farm model first (cluster-model often routes to farm's strongest backend), then lighter farm models, then optional Groq.
const PRIMARY = 'farm/cluster-model';
const FARM_FALLBACKS = ['farm/gpt-4o', 'farm/gpt-4o-mini'];
const GROQ_FALLBACK = 'groq/llama-3.1-8b-instant';

let config = {};
if (!fs.existsSync(CLAWDBOT_JSON)) {
  console.error('~/.clawdbot/clawdbot.json not found. Run node scripts/set-primary-neural-farm.js first.');
  process.exit(1);
}
try {
  config = JSON.parse(fs.readFileSync(CLAWDBOT_JSON, 'utf8'));
} catch (e) {
  console.error('Could not parse clawdbot.json:', e.message);
  process.exit(1);
}

if (!config.agents) config.agents = {};
if (!config.agents.defaults) config.agents.defaults = {};
if (!config.agents.defaults.model) config.agents.defaults.model = {};

config.agents.defaults.model.primary = PRIMARY;
let fallbacks = [...FARM_FALLBACKS];
if (process.env.JARVIS_FARM_MAX_ADD_GROQ_FALLBACK === '1') {
  fallbacks.push(GROQ_FALLBACK);
}
config.agents.defaults.model.fallbacks = fallbacks;

config.agents.defaults.bootstrapMaxChars = BOOTSTRAP_MAX_CHARS;

fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
console.log('Set agents.defaults.model.primary to "' + PRIMARY + '"');
console.log('Set fallbacks to:', fallbacks.join(', '));
console.log('Set agents.defaults.bootstrapMaxChars to', BOOTSTRAP_MAX_CHARS);
console.log('Restart the gateway (e.g. node scripts/start-gateway-with-vault.js) for the change to take effect.');
if (fallbacks.indexOf(GROQ_FALLBACK) === -1) {
  console.log('Tip: set JARVIS_FARM_MAX_ADD_GROQ_FALLBACK=1 and re-run to add Groq as last fallback when the farm is down.');
}
