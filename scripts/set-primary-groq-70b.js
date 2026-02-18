#!/usr/bin/env node
/**
 * Set primary LLM to Groq 70B (larger context). Use when 8B hits "context overflow"
 * (e.g. team execution, long threads, or large bootstrap).
 *
 * Prereq: GROQ_API_KEY in ~/.clawdbot/.env (or Vault).
 * Run from repo root: node scripts/set-primary-groq-70b.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');
const PRIMARY_MODEL = 'groq/llama-3.3-70b-versatile';

let config = {};
if (fs.existsSync(CLAWDBOT_JSON)) {
  try {
    config = JSON.parse(fs.readFileSync(CLAWDBOT_JSON, 'utf8'));
  } catch (e) {
    console.error('Could not parse clawdbot.json:', e.message);
    process.exit(1);
  }
} else {
  console.error('~/.clawdbot/clawdbot.json not found. Run set-primary-groq.js first or create config.');
  process.exit(1);
}

if (!config.agents) config.agents = {};
if (!config.agents.defaults) config.agents.defaults = {};
if (!config.agents.defaults.model) config.agents.defaults.model = {};
config.agents.defaults.model.primary = PRIMARY_MODEL;

fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
console.log('Set agents.defaults.model.primary to "' + PRIMARY_MODEL + '" in ~/.clawdbot/clawdbot.json');
console.log('Restart the gateway for the change to take effect. Use set-primary-groq.js to switch back to 8B for faster chat.');
