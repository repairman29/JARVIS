#!/usr/bin/env node
/**
 * Set primary LLM to Groq (avoids 403 OAuth when Anthropic org has OAuth disabled).
 * Use when you see: "OAuth authentication is currently not allowed for this organization."
 *
 * Prereq: GROQ_API_KEY in ~/.clawdbot/.env (or Vault if you use start-gateway-with-vault.js).
 * Run from repo root: node scripts/set-primary-groq.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const ENV_PATH = path.join(CLAWDBOT_DIR, '.env');
const PRIMARY_MODEL = 'groq/llama-3.1-8b-instant';

// Optional: load .env to check for key
if (fs.existsSync(ENV_PATH)) {
  require('dotenv').config({ path: ENV_PATH });
}
const hasKey = !!(process.env.GROQ_API_KEY || (typeof process.env.GROQ_API_KEY !== 'undefined' && process.env.GROQ_API_KEY !== ''));
if (!hasKey) {
  try {
    const envContent = fs.readFileSync(ENV_PATH, 'utf8');
    if (/^\s*GROQ_API_KEY\s*=\s*\S+/.test(envContent) || /^\s*GROQ_API_KEY\s*=\s*["'].+["']/.test(envContent)) {
      // key is in file (dotenv may not have loaded if we're in a different cwd)
    } else {
      console.warn('Warning: GROQ_API_KEY not found in ~/.clawdbot/.env. Add it for Groq to work.');
    }
  } catch (_) {}
}

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
console.log('Set agents.defaults.model.primary to "' + PRIMARY_MODEL + '" in ~/.clawdbot/clawdbot.json');
console.log('Restart the gateway for the change to take effect. Add GROQ_API_KEY to ~/.clawdbot/.env if needed.');