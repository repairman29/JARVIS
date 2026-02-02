#!/usr/bin/env node
/**
 * Set primary LLM to OpenAI (gpt-4o) in ~/.clawdbot/clawdbot.json.
 * Merges into existing config; does not overwrite other keys.
 * Use with Vault: ensure OPENAI_API_KEY is in Vault, then start gateway with
 *   node scripts/start-gateway-with-vault.js
 *
 * Run from repo root: node scripts/set-primary-openai.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const PRIMARY_MODEL = 'openai/gpt-4o';

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

if (!config.agents) config.agents = {};
if (!config.agents.defaults) config.agents.defaults = {};
if (!config.agents.defaults.model) config.agents.defaults.model = {};
config.agents.defaults.model.primary = PRIMARY_MODEL;

fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
console.log(`Set agents.defaults.model.primary to "${PRIMARY_MODEL}" in ~/.clawdbot/clawdbot.json`);
console.log('Restart the gateway (e.g. node scripts/start-gateway-with-vault.js) for the change to take effect.');
