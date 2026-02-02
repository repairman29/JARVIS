#!/usr/bin/env node
/**
 * Start Clawdbot gateway with env hydrated from Supabase Vault.
 * - Resolves every env/clawdbot/<KEY> from the Vault (full access to all secrets in app_secrets).
 * - Also resolves GATEWAY_KEYS from Vault or ~/.clawdbot/.env.
 * Writes merged env to ~/.clawdbot/.env and ~/.openclaw/.env, then runs `npx clawdbot gateway run`.
 *
 * Prereqs: VAULT_SUPABASE_URL and VAULT_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_*) in
 * ~/.clawdbot/.env pointing at the project where app_secrets + Vault SQL are set up.
 *
 * Run from repo root: node scripts/start-gateway-with-vault.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { loadEnvFile, getVaultConfig, listAppSecretNames, resolveEnv } = require('./vault.js');

const ENV_CLAWDBOT_PREFIX = 'env/clawdbot/';

const GATEWAY_KEYS = [
  'CLAWDBOT_GATEWAY_TOKEN',
  'GROQ_API_KEY',
  'DISCORD_BOT_TOKEN',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENROUTER_API_KEY',
  'TOGETHER_API_KEY',
  'TOGETHER_USER_KEY',
  'GEMINI_API_KEY',
  'GITHUB_TOKEN',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'ELEVENLABS_API_KEY',
  'REPLICATE_API_TOKEN',
  'STABILITY_API_KEY',
  'JARVIS_ALERT_WEBHOOK_URL',
  'KROGER_CLIENT_ID',
  'KROGER_CLIENT_SECRET',
  'KROGER_LOCATION_ID',
  'KROGER_REFRESH_TOKEN',
  'NTFY_TOPIC',
  'HUE_BRIDGE_IP',
  'HUE_USERNAME',
  'VERCEL_TOKEN',
  'RAILWAY_API_KEY',
  'NETLIFY_AUTH_TOKEN',
  'JARVIS_DISCORD_USER_ID',
  'BRAVE_API_KEY',
  'BRAVE_SEARCH_API_KEY'
];

async function main() {
  const env = loadEnvFile();

  // Resolve known gateway keys
  for (const key of GATEWAY_KEYS) {
    const value = await resolveEnv(key, env);
    if (value) {
      process.env[key] = value;
      env[key] = value;
    }
  }

  // Pull all env/clawdbot/* keys from Vault so JARVIS has full access to every secret in the Vault
  const vaultConfig = getVaultConfig(env);
  if (vaultConfig.url && vaultConfig.key) {
    try {
      const names = await listAppSecretNames(vaultConfig.url, vaultConfig.key, ENV_CLAWDBOT_PREFIX);
      for (const name of names) {
        if (!name.startsWith(ENV_CLAWDBOT_PREFIX)) continue;
        const key = name.slice(ENV_CLAWDBOT_PREFIX.length);
        if (!key || env[key]) continue; // already set from GATEWAY_KEYS or .env
        const value = await resolveEnv(key, env);
        if (value) {
          process.env[key] = value;
          env[key] = value;
        }
      }
    } catch (e) {
      // Non-fatal: we still have GATEWAY_KEYS and .env
    }
  }

  const allKeys = [...new Set([...Object.keys(env), ...GATEWAY_KEYS])];
  const lines = allKeys.filter((k) => env[k]).map((k) => `${k}=${String(env[k]).replace(/\n/g, ' ')}`);
  const body = lines.join('\n') + '\n';

  const home = os.homedir();
  const envDirs = [
    path.join(home, '.clawdbot'),
    path.join(home, '.openclaw')
  ];
  for (const dir of envDirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '.env'), body, 'utf8');
  }

  const repoRoot = path.resolve(__dirname, '..');
  // On Railway (or any cloud with PORT), ensure OpenClaw config enables HTTP chat completions
  const isCloud = process.env.RAILWAY_PUBLIC_DOMAIN || (process.env.PORT && process.env.RAILWAY_PROJECT_ID);
  const configPath = path.join(repoRoot, 'config', 'railway-openclaw.json');
  if (fs.existsSync(configPath)) {
    const openclawDirs = [path.join(home, '.openclaw')];
    const clawdbotDir = path.join(home, '.clawdbot');
    if (isCloud) openclawDirs.push(path.join(repoRoot, '.openclaw'));
    for (const openclawDir of openclawDirs) {
      if (!fs.existsSync(openclawDir)) fs.mkdirSync(openclawDir, { recursive: true });
      fs.copyFileSync(configPath, path.join(openclawDir, 'openclaw.json'));
    }
    if (!fs.existsSync(clawdbotDir)) fs.mkdirSync(clawdbotDir, { recursive: true });
    fs.copyFileSync(configPath, path.join(clawdbotDir, 'clawdbot.json'));
    if (isCloud) {
      const repoClawdbot = path.join(repoRoot, '.clawdbot');
      if (!fs.existsSync(repoClawdbot)) fs.mkdirSync(repoClawdbot, { recursive: true });
      fs.copyFileSync(configPath, path.join(repoClawdbot, 'clawdbot.json'));
    }
  }

  const args = ['clawdbot', 'gateway', 'run'];
  // On Railway: gateway listens on 18789; we run a proxy on PORT so Railway's proxy gets immediate accept
  const gatewayPort = isCloud ? '18789' : (process.env.PORT || '18789');
  args.push('--port', gatewayPort);
  if (process.env.RAILWAY_PUBLIC_DOMAIN || process.env.PORT) args.push('--bind', 'lan');
  args.push('--allow-unconfigured');
  if (isCloud) args.push('--dev');

  const childEnv = { ...process.env, PORT: gatewayPort };
  if (isCloud) {
    childEnv.OPENCLAW_HOME = repoRoot;
    childEnv.OPENCLAW_STATE_DIR = path.join(repoRoot, '.openclaw');
    childEnv.HOME = repoRoot;
  }
  const child = spawn('npx', args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: true,
    env: childEnv
  });

  if (isCloud && process.env.PORT && process.env.PORT !== gatewayPort) {
    // Listen on Railway's PORT immediately so the platform gets a response; proxy to gateway when ready
    const http = require('http');
    const gatewayOrigin = `http://127.0.0.1:${gatewayPort}`;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    let gatewayReady = false;
    const waitForGateway = async () => {
      for (let i = 0; i < 90; i++) {
        try {
          const res = await fetch(`${gatewayOrigin}/`, { method: 'GET', signal: AbortSignal.timeout(3000) });
          if (res.status < 500) {
            gatewayReady = true;
            console.log('Gateway ready on port', gatewayPort);
            return;
          }
        } catch (_) {}
        await wait(2000);
      }
      console.error('Gateway did not become ready on port', gatewayPort);
    };
    waitForGateway(); // background, no .then for server

    const server = http.createServer((req, res) => {
      if (!gatewayReady) {
        res.writeHead(503, { 'Content-Type': 'application/json', 'Retry-After': '10' });
        res.end(JSON.stringify({ error: 'Gateway starting up', retry_after: 10 }));
        return;
      }
      const opts = {
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${gatewayPort}` },
        hostname: '127.0.0.1',
        port: gatewayPort,
        path: req.url || '/'
      };
      const proxyReq = http.request(opts, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on('error', (e) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(e.message) }));
      });
      req.pipe(proxyReq);
    });
    server.listen(process.env.PORT, '0.0.0.0', () => {
      console.log('Proxy listening on', process.env.PORT, '->', gatewayPort);
    });
  }

  child.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((err) => {
  console.error('start-gateway-with-vault:', err.message);
  process.exit(1);
});
