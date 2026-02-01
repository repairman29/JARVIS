/**
 * UpshiftAI dependency analysis skill for JARVIS/CLAWDBOT.
 * Runs upshiftai-deps analyze/report and returns a short summary or one-pager.
 */

const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');

const CLAWDBOT_ROOT = process.env.JARVIS_CLAWDBOT_ROOT || path.resolve(__dirname, '../..');
const UPSHIFTAI_CLI = process.env.UPSHIFTAI_CLI_PATH || path.join(CLAWDBOT_ROOT, 'upshiftai', 'bin', 'upshiftai-deps.js');

function ensureCli() {
  if (!fs.existsSync(UPSHIFTAI_CLI)) {
    return { error: `UpshiftAI CLI not found at ${UPSHIFTAI_CLI}. Set UPSHIFTAI_CLI_PATH or run from CLAWDBOT.` };
  }
  return { cli: UPSHIFTAI_CLI };
}

function runCli(args, projectPath, timeout = 60000) {
  const { error, cli } = ensureCli();
  if (error) return { error, stdout: '', stderr: '' };
  const r = spawnSync('node', [cli, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    timeout,
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    error: r.error ? r.error.message : null,
    stdout: r.stdout || '',
    stderr: r.stderr || '',
    status: r.status,
  };
}

/**
 * analyze_dependencies(projectPath?, summaryOnly?, includeFullReport?)
 */
function analyze_dependencies({ projectPath = '.', summaryOnly = true, includeFullReport = false }) {
  const resolved = path.resolve(process.cwd(), projectPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return {
      ok: false,
      error: `Path does not exist or is not a directory: ${resolved}`,
      summary: null,
      onePager: null,
      report: null,
    };
  }

  if (includeFullReport) {
    const out = runCli(['analyze', resolved, '--json'], resolved);
    if (out.error) {
      return { ok: false, error: out.error, summary: null, onePager: null, report: null };
    }
    let report = null;
    try {
      report = JSON.parse(out.stdout.trim());
    } catch (_) {
      return { ok: false, error: 'Failed to parse analyze JSON', summary: null, onePager: null, report: null };
    }
    const oneOut = runCli(['report', resolved, '--summary'], resolved);
    const onePager = oneOut.stdout.trim() || null;
    const s = report.summary || {};
    return {
      ok: report.ok === true,
      error: report.error || null,
      summary: {
        total: s.total ?? 0,
        ancient: s.ancient ?? 0,
        deprecated: s.deprecated ?? 0,
        direct: s.direct ?? 0,
        transitive: s.transitive ?? 0,
        ecosystem: report.ecosystem || 'npm',
        vulns: (report.audit && (report.audit.critical + report.audit.high)) || 0,
      },
      onePager,
      report: includeFullReport ? report : null,
    };
  }

  if (summaryOnly) {
    const out = runCli(['report', resolved, '--summary'], resolved);
    if (out.error) {
      return { ok: false, error: out.error, onePager: null, summary: null };
    }
    const onePager = out.stdout.trim();
    const jsonOut = runCli(['analyze', resolved, '--json'], resolved);
    let summary = null;
    if (!jsonOut.error && jsonOut.stdout) {
      try {
        const data = JSON.parse(jsonOut.stdout.trim());
        const s = data.summary || {};
        summary = {
          total: s.total ?? 0,
          ancient: s.ancient ?? 0,
          deprecated: s.deprecated ?? 0,
          direct: s.direct ?? 0,
          transitive: s.transitive ?? 0,
          ecosystem: data.ecosystem || 'npm',
          vulns: (data.audit && (data.audit.critical + data.audit.high)) || 0,
        };
      } catch (_) {}
    }
    return {
      ok: true,
      onePager: onePager || null,
      summary,
    };
  }

  const out = runCli(['analyze', resolved, '--json'], resolved);
  if (out.error) {
    return { ok: false, error: out.error, summary: null, problematic: null };
  }
  let report = null;
  try {
    report = JSON.parse(out.stdout.trim());
  } catch (_) {
    return { ok: false, error: 'Failed to parse analyze JSON', summary: null, problematic: null };
  }
  const s = report.summary || {};
  const problematic = (report.entries || [])
    .filter((e) => e.ancient || e.deprecated || e.forkHint)
    .slice(0, 15)
    .map((e) => ({ name: e.name, version: e.version, reasons: e.reasons || [] }));
  return {
    ok: report.ok === true,
    error: report.error || null,
    summary: {
      total: s.total ?? 0,
      ancient: s.ancient ?? 0,
      deprecated: s.deprecated ?? 0,
      direct: s.direct ?? 0,
      transitive: s.transitive ?? 0,
      ecosystem: report.ecosystem || 'npm',
      vulns: (report.audit && (report.audit.critical + report.audit.high)) || 0,
    },
    problematic,
  };
}

/**
 * dependency_health(projectPath?)
 */
function dependency_health({ projectPath = '.' }) {
  const resolved = path.resolve(process.cwd(), projectPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return {
      ok: false,
      error: `Path does not exist or is not a directory: ${resolved}`,
      status: null,
      message: null,
    };
  }
  const out = runCli(['health', resolved, '--json'], resolved, 30000);
  if (out.error) {
    return { ok: false, error: out.error, status: null, message: null };
  }
  try {
    const data = JSON.parse(out.stdout.trim());
    return {
      ok: data.status === 'OK',
      status: data.status,
      message: data.message,
      summary: data.summary || null,
      audit: data.audit || null,
    };
  } catch (_) {
    return { ok: false, error: 'Failed to parse health JSON', status: null, message: null };
  }
}

module.exports = {
  analyze_dependencies,
  dependency_health,
};
