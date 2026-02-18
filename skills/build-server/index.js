/**
 * Build server skill — trigger builds via the JARVIS build server (scripts/build-server.js).
 * Env: BUILD_SERVER_URL (default http://127.0.0.1:18790)
 */

const BUILD_SERVER_URL = (process.env.BUILD_SERVER_URL || 'http://127.0.0.1:18790').trim().replace(/\/$/, '');

async function buildServerFetch(pathname, options = {}) {
  const url = `${BUILD_SERVER_URL}${pathname}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    clearTimeout(timeout);
    return { ok: false, status: 0, error: e.message };
  }
}

module.exports = {
  build_server_build: async ({ repo, command = 'build' } = {}) => {
    if (!repo || typeof repo !== 'string') {
      return { success: false, message: 'repo is required' };
    }
    const { ok, status, data, error } = await buildServerFetch('/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: repo.trim(), command: ['install', 'build', 'test'].includes(command) ? command : 'build' }),
    });
    if (error) {
      return { success: false, message: `Build server unreachable: ${error}. Is it running? (node scripts/build-server.js)` };
    }
    if (!ok) {
      return {
        success: false,
        message: data.error || `HTTP ${status}`,
        repo,
        command,
      };
    }
    const out = data.stdout || '';
    const err = data.stderr || '';
    const tail = [out.slice(-1500), err.slice(-1500)].filter(Boolean).join('\n--- stderr ---\n').trim();
    return {
      success: data.success === true,
      message: data.success ? `Build completed in ${(data.durationMs / 1000).toFixed(1)}s` : `Build failed (exit ${data.exitCode})`,
      repo: data.repo,
      command: data.command,
      exitCode: data.exitCode,
      durationMs: data.durationMs,
      timeout: data.timeout || false,
      logTail: tail || '(no output)',
    };
  },

  build_server_pipeline: async ({ repo } = {}) => {
    if (!repo || typeof repo !== 'string') {
      return { success: false, message: 'repo is required' };
    }
    const { ok, status, data, error } = await buildServerFetch('/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo: repo.trim() }),
    });
    if (error) {
      return { success: false, message: `Build server unreachable: ${error}. Is it running? (node scripts/build-server.js)` };
    }
    if (!ok) {
      return {
        success: false,
        message: data.error || `HTTP ${status}`,
        repo,
      };
    }
    const steps = (data.steps || []).map((s) => `${s.command}: ${s.success ? 'ok' : 'fail'}`).join(', ');
    return {
      success: data.success === true,
      message: data.success
        ? `Pipeline passed in ${((data.totalMs || 0) / 1000).toFixed(1)}s (${steps})`
        : `Pipeline failed at step: ${data.failedStep || 'unknown'}. ${steps}`,
      repo: data.repo,
      steps: data.steps,
      totalMs: data.totalMs,
      failedStep: data.failedStep,
    };
  },

  build_server_health: async () => {
    const { ok, status, data, error } = await buildServerFetch('/health');
    if (error) {
      return { success: false, message: `Build server unreachable: ${error}. Start it with: node scripts/build-server.js` };
    }
    return {
      success: ok && data.ok === true,
      message: ok ? 'Build server is running' : `HTTP ${status}`,
      service: data.service,
      port: data.port,
    };
  },
};
