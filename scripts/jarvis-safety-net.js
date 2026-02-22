#!/usr/bin/env node
/**
 * JARVIS Safety Net
 * Aggregates health checks and emits a unified snapshot + alerts.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync, spawn } = require('child_process');
const https = require('https');
const { loadEnvFile: loadVaultEnv, resolveEnv } = require('./vault.js');

const HEALTH_DIR = path.join(os.homedir(), '.jarvis', 'health');
const SNAPSHOT_FILE = path.join(HEALTH_DIR, 'health.json');
const ALERT_LOG = path.join(HEALTH_DIR, 'alerts.log');
const ACTION_LOG = path.join(HEALTH_DIR, 'actions.log');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadEnvFile() {
  const env = loadVaultEnv();
  return env;
}

function getEnv(key, fallbackEnv) {
  return process.env[key] || fallbackEnv[key];
}

function safeExec(command, options = {}) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options }).trim();
    return { ok: true, output };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function isCommandAvailable(command) {
  const checker = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
  return safeExec(checker).ok;
}

function writeLog(filePath, message) {
  ensureDir(path.dirname(filePath));
  fs.appendFileSync(filePath, `${new Date().toISOString()} ${message}\n`);
}

function severityFromChecks(checks) {
  if (checks.some((check) => check.status === 'fail')) return 'critical';
  if (checks.some((check) => check.status === 'warn')) return 'warn';
  if (checks.some((check) => check.status === 'ok')) return 'ok';
  return 'unknown';
}

function scoreFromChecks(checks) {
  let score = 100;
  for (const check of checks) {
    if (check.status === 'fail') score -= 30;
    if (check.status === 'warn') score -= 10;
    if (check.status === 'unknown') score -= 5;
  }
  return Math.max(0, score);
}

function postWebhook(url, payload) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const body = JSON.stringify(payload);
      const req = https.request(
        {
          method: 'POST',
          hostname: parsed.hostname,
          path: parsed.pathname + parsed.search,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          }
        },
        (res) => {
          res.on('data', () => {});
          res.on('end', () => resolve(res.statusCode));
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function emitAlert(snapshot, env) {
  const webhookUrl =
    getEnv('JARVIS_ALERT_WEBHOOK_URL', env) ||
    getEnv('DISCORD_WEBHOOK_URL', env);

  if (!webhookUrl) return;

  const failing = snapshot.checks
    .filter((check) => check.status !== 'ok')
    .map((check) => `${check.name}: ${check.status}`)
    .slice(0, 6)
    .join(', ');

  const content = [
    `JARVIS Safety Net: ${snapshot.overall.status.toUpperCase()} (score ${snapshot.overall.score}/100)`,
    failing ? `Checks: ${failing}` : null,
    `Host: ${snapshot.host.hostname} (${snapshot.host.platform})`
  ]
    .filter(Boolean)
    .join(' | ');

  try {
    await postWebhook(webhookUrl, { content });
  } catch (error) {
    writeLog(ALERT_LOG, `ALERT webhook failed: ${error.message}`);
  }

  // Capture in audit log so Discord errors are recorded and queryable (see RUNBOOK § Discord errors).
  const auditScript = path.join(__dirname, 'audit-log.js');
  if (fs.existsSync(auditScript)) {
    const child = spawn(process.execPath, [auditScript, 'safety_net_alert', content.slice(0, 500), '--channel', 'cron', '--actor', 'safety-net'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'ignore',
      detached: true,
    });
    child.unref();
  }
}

async function supabaseRequest({ url, key }, pathSuffix, method, query) {
  const queryString = query ? `?${query}` : '';
  const response = await fetch(`${url}/rest/v1/${pathSuffix}${queryString}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${method} ${pathSuffix} failed: ${response.status} ${text}`);
  }
  return text ? JSON.parse(text) : [];
}

async function checkRepoIndexFreshness(env) {
  const supabaseUrl = getEnv('SUPABASE_URL', env);
  const supabaseKey =
    getEnv('SUPABASE_SERVICE_ROLE_KEY', env) ||
    getEnv('SUPABASE_ANON_KEY', env);

  if (!supabaseUrl || !supabaseKey) {
    return {
      name: 'repo_index_freshness',
      status: 'unknown',
      message: 'Supabase env not configured',
      details: null
    };
  }

  try {
    const rows = await supabaseRequest(
      { url: supabaseUrl, key: supabaseKey },
      'repo_sources',
      'GET',
      'select=last_indexed_at&order=last_indexed_at.desc&limit=1'
    );
    if (!rows || rows.length === 0 || !rows[0].last_indexed_at) {
      return {
        name: 'repo_index_freshness',
        status: 'warn',
        message: 'Repo index empty or not indexed',
        details: rows
      };
    }

    const lastIndexed = new Date(rows[0].last_indexed_at);
    const hoursSince = (Date.now() - lastIndexed.getTime()) / (1000 * 60 * 60);
    const maxHours = Number(getEnv('JARVIS_REPO_INDEX_STALE_HOURS', env) || 24);
    const status = hoursSince > maxHours ? 'warn' : 'ok';
    const message = `Last indexed ${hoursSince.toFixed(1)}h ago`;

    return {
      name: 'repo_index_freshness',
      status,
      message,
      details: { lastIndexed: rows[0].last_indexed_at, hoursSince, maxHours }
    };
  } catch (error) {
    return {
      name: 'repo_index_freshness',
      status: 'warn',
      message: 'Repo freshness check failed',
      details: { error: error.message }
    };
  }
}

function runCheck(name, fn) {
  try {
    return fn();
  } catch (error) {
    return {
      name,
      status: 'fail',
      message: error.message || 'Check failed',
      details: null
    };
  }
}

function checkSystemHealth() {
  try {
    const { optimizations } = require('./optimize-jarvis');
    const result = optimizations.checkSystemHealth();
    const hasWarnings = result.recommendations && result.recommendations.length > 0;
    return {
      name: 'system_health',
      status: hasWarnings ? 'warn' : 'ok',
      message: result.message,
      details: result
    };
  } catch (error) {
    return {
      name: 'system_health',
      status: 'fail',
      message: 'System health check failed',
      details: { error: error.message }
    };
  }
}

function checkGatewayStatus() {
  if (!isCommandAvailable('clawdbot')) {
    return {
      name: 'gateway_status',
      status: 'unknown',
      message: 'clawdbot CLI not available',
      details: null
    };
  }

  const result = safeExec('clawdbot status --deep');
  return {
    name: 'gateway_status',
    status: result.ok ? 'ok' : 'warn',
    message: result.ok ? 'Gateway status OK' : 'Gateway status check failed',
    details: result.ok ? { output: result.output } : { error: result.error }
  };
}

function checkGitHubAuth() {
  if (!isCommandAvailable('gh')) {
    return {
      name: 'github_auth',
      status: 'unknown',
      message: 'GitHub CLI not available',
      details: null
    };
  }

  const result = safeExec('gh auth status -h github.com');
  return {
    name: 'github_auth',
    status: result.ok ? 'ok' : 'warn',
    message: result.ok ? 'GitHub auth OK' : 'GitHub auth not available',
    details: result.ok ? { output: result.output } : { error: result.error }
  };
}

function checkDiscordBot() {
  if (!fs.existsSync(path.join(__dirname, 'check-discord-bot.js'))) {
    return {
      name: 'discord_bot',
      status: 'unknown',
      message: 'Discord check script not found',
      details: null
    };
  }

  const result = safeExec(`node "${path.join(__dirname, 'check-discord-bot.js')}"`);
  return {
    name: 'discord_bot',
    status: result.ok ? 'ok' : 'warn',
    message: result.ok ? 'Discord bot token OK' : 'Discord bot check failed',
    details: result.ok ? { output: result.output } : { error: result.error }
  };
}

async function checkWebsiteStatus() {
  try {
    const { checkWebsiteStatus } = require('./manage-website');
    const result = await checkWebsiteStatus();
    if (!result) {
      return {
        name: 'website_status',
        status: 'warn',
        message: 'Website status unavailable',
        details: null
      };
    }
    return {
      name: 'website_status',
      status: 'ok',
      message: `Website status: ${result.status}`,
      details: result
    };
  } catch (error) {
    return {
      name: 'website_status',
      status: 'warn',
      message: 'Website check failed',
      details: { error: error.message }
    };
  }
}

async function checkCommunityHealth() {
  try {
    const { checkCommunityHealth } = require('./manage-website');
    const result = await checkCommunityHealth();
    if (!result) {
      return {
        name: 'community_health',
        status: 'warn',
        message: 'Community health unavailable',
        details: null
      };
    }
    const status = result.healthScore >= 70 ? 'ok' : 'warn';
    return {
      name: 'community_health',
      status,
      message: `Community health score ${result.healthScore}/100`,
      details: result
    };
  } catch (error) {
    return {
      name: 'community_health',
      status: 'warn',
      message: 'Community health check failed',
      details: { error: error.message }
    };
  }
}

function runRecoveryActions(checks) {
  const actions = [];

  const systemCheck = checks.find((check) => check.name === 'system_health');
  if (systemCheck && systemCheck.status !== 'ok') {
    const result = safeExec('node scripts/optimize-jarvis.js --quick');
    actions.push({
      action: 'optimize_quick',
      status: result.ok ? 'ok' : 'warn',
      details: result.ok ? result.output : result.error
    });
  }

  const gatewayCheck = checks.find((check) => check.name === 'gateway_status');
  if (gatewayCheck && gatewayCheck.status !== 'ok' && isCommandAvailable('clawdbot')) {
    const result = safeExec('clawdbot doctor');
    actions.push({
      action: 'gateway_doctor',
      status: result.ok ? 'ok' : 'warn',
      details: result.ok ? result.output : result.error
    });
  }

  return actions;
}

async function runSafetyNet({ repair = false, jsonOnly = false } = {}) {
  ensureDir(HEALTH_DIR);
  const env = loadEnvFile();
  if (env && (Object.keys(env).length > 0)) {
    const url = await resolveEnv('SUPABASE_URL', env);
    const key = (await resolveEnv('SUPABASE_SERVICE_ROLE_KEY', env)) || (await resolveEnv('SUPABASE_ANON_KEY', env));
    if (url) process.env.SUPABASE_URL = process.env.SUPABASE_URL || url;
    if (key) process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || key;
  }

  const checks = [];
  checks.push(runCheck('system_health', checkSystemHealth));
  checks.push(runCheck('gateway_status', checkGatewayStatus));
  checks.push(runCheck('github_auth', checkGitHubAuth));
  checks.push(runCheck('discord_bot', checkDiscordBot));
  checks.push(await checkWebsiteStatus());
  checks.push(await checkCommunityHealth());
  checks.push(await checkRepoIndexFreshness(env));

  const overallStatus = severityFromChecks(checks);
  const score = scoreFromChecks(checks);
  const timestamp = new Date().toISOString();

  const snapshot = {
    timestamp,
    host: {
      hostname: os.hostname(),
      platform: process.platform,
      uptimeHours: Math.round(os.uptime() / 3600),
      nodeVersion: process.version
    },
    overall: {
      status: overallStatus,
      score
    },
    checks
  };

  let actions = [];
  if (repair) {
    actions = runRecoveryActions(checks);
    snapshot.actions = actions;
  }

  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
  const stampedFile = path.join(HEALTH_DIR, `health-${timestamp.replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(stampedFile, JSON.stringify(snapshot, null, 2));

  if (!jsonOnly) {
    log('🧠 JARVIS Safety Net Snapshot', 'purple');
    log('=============================', 'purple');
    log(`Overall status: ${overallStatus.toUpperCase()} (score ${score}/100)`, overallStatus === 'critical' ? 'red' : overallStatus === 'warn' ? 'yellow' : 'green');
    checks.forEach((check) => {
      const color = check.status === 'ok' ? 'green' : check.status === 'warn' ? 'yellow' : check.status === 'fail' ? 'red' : 'blue';
      log(`- ${check.name}: ${check.status.toUpperCase()} - ${check.message}`, color);
    });
    log(`\nSnapshot saved to: ${SNAPSHOT_FILE}`, 'cyan');
  } else {
    process.stdout.write(JSON.stringify(snapshot, null, 2));
  }

  if (overallStatus === 'warn' || overallStatus === 'critical') {
    writeLog(ALERT_LOG, `ALERT ${overallStatus.toUpperCase()} score=${score}`);
    await emitAlert(snapshot, env);
  }
  if (actions.length > 0) {
    writeLog(ACTION_LOG, `ACTIONS ${JSON.stringify(actions)}`);
  }

  return snapshot;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
JARVIS Safety Net

Usage:
  node scripts/jarvis-safety-net.js [options]

Options:
  --help, -h     Show this help message
  --repair       Run safe recovery actions
  --json         Output JSON only
  --watch        Run continuously
  --interval     Seconds between checks (default: 300)

Examples:
  node scripts/jarvis-safety-net.js
  node scripts/jarvis-safety-net.js --repair
  node scripts/jarvis-safety-net.js --json
  node scripts/jarvis-safety-net.js --watch --interval 120
`);
    return;
  }

  const repair = args.includes('--repair');
  const jsonOnly = args.includes('--json');
  const watch = args.includes('--watch');
  const intervalIndex = args.indexOf('--interval');
  const intervalSeconds =
    intervalIndex !== -1 && args[intervalIndex + 1]
      ? Number(args[intervalIndex + 1])
      : 300;

  if (!watch) {
    await runSafetyNet({ repair, jsonOnly });
    return;
  }

  const intervalMs = Math.max(30, intervalSeconds) * 1000;
  let running = false;

  log(`🛡️  Safety Net watch mode every ${intervalMs / 1000}s`, 'cyan');
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await runSafetyNet({ repair, jsonOnly });
    } finally {
      running = false;
    }
  }, intervalMs);

  // Run immediately
  await runSafetyNet({ repair, jsonOnly });
}

if (require.main === module) {
  main().catch((error) => {
    log(`Safety Net failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runSafetyNet };
