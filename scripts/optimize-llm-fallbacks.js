#!/usr/bin/env node
/**
 * Set primary + fallbacks to an order optimized for free-tier limits and speed.
 * Uses: highest daily/minute limits first, low-RPM providers last.
 *
 * Order (rationale in docs/JARVIS_LLM_OPTIMIZED_ORDER.md):
 *   primary: Groq 8B (14,400 RPD, very fast)
 *   then: Groq 70B → Cerebras 70B → Gemini Flash → DeepSeek → Cohere → OpenRouter → Together → Mistral → Hugging Face
 *
 * Only includes providers that exist in your clawdbot.json. Run from repo root:
 *   node scripts/optimize-llm-fallbacks.js
 * Then restart the gateway.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');
const CLAWDBOT_JSON = path.join(CLAWDBOT_DIR, 'clawdbot.json');

// Optimized order: high limits + fast first, tight limits last (see JARVIS_LLM_OPTIMIZED_ORDER.md)
const OPTIMAL_PRIMARY = 'groq/llama-3.1-8b-instant';
const OPTIMAL_FALLBACKS = [
  'groq/llama-3.3-70b-versatile',   // 1K RPD, same provider
  'cerebras/llama-3.3-70b',         // 30 RPM, 1M tok/day
  'gemini/gemini-2.5-flash',        // 10 RPM, 250 RPD
  'deepseek/deepseek-chat',         // 5M free tokens
  'cohere/command-r-plus',          // 20 RPM, 1K req/month
  'openrouter/arcee-ai/trinity-mini:free', // 50 req/day
  'together/meta-llama/Llama-3.3-70B-Instruct-Turbo',
  'mistral/mistral-large-latest',   // 2 RPM - use late
  'huggingface/meta-llama/Llama-3.2-3B-Instruct',
];

function getProviderId(modelRef) {
  const i = modelRef.indexOf('/');
  return i > 0 ? modelRef.slice(0, i) : null;
}

function main() {
  if (!fs.existsSync(CLAWDBOT_JSON)) {
    console.error('No ~/.clawdbot/clawdbot.json found.');
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(CLAWDBOT_JSON, 'utf8'));
  const providers = config.models && config.models.providers ? config.models.providers : {};
  const available = new Set(Object.keys(providers));

  // Primary: use optimal if that provider exists, else keep existing or first available
  let primary = OPTIMAL_PRIMARY;
  const primaryProvider = getProviderId(OPTIMAL_PRIMARY);
  if (!available.has(primaryProvider)) {
    const current = config.agents?.defaults?.model?.primary;
    if (current && available.has(getProviderId(current))) {
      primary = current;
      console.log('Keeping current primary (optimal provider not in config):', primary);
    } else {
      const first = OPTIMAL_FALLBACKS.find((ref) => available.has(getProviderId(ref)));
      primary = first || primary;
    }
  }

  // Fallbacks: only include refs whose provider exists in config, preserve order
  const fallbacks = OPTIMAL_FALLBACKS.filter((ref) => available.has(getProviderId(ref)));

  if (!config.agents) config.agents = {};
  if (!config.agents.defaults) config.agents.defaults = {};
  if (!config.agents.defaults.model) config.agents.defaults.model = {};
  config.agents.defaults.model.primary = primary;
  config.agents.defaults.model.fallbacks = fallbacks;

  fs.writeFileSync(CLAWDBOT_JSON, JSON.stringify(config, null, 2), 'utf8');
  console.log('Optimized primary:', primary);
  console.log('Optimized fallbacks (' + fallbacks.length + '):', fallbacks.join(', '));
  console.log('Restart the gateway to apply.');
}

main();
