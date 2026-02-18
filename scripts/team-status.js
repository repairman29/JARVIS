#!/usr/bin/env node
/**
 * Team status: read config/team-agents.json, check which CLIs are available,
 * write ~/.jarvis/team-status.json so JARVIS (or scripts) can see "who's on the team and ready."
 *
 * Usage:
 *   node scripts/team-status.js          # check and write status
 *   node scripts/team-status.js --print # check and print to stdout only
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const configPath = path.join(repoRoot, 'config', 'team-agents.json');
const statusDir = path.join(process.env.HOME || process.env.USERPROFILE, '.jarvis');
const statusPath = path.join(statusDir, 'team-status.json');

function which(name) {
  const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`;
  try {
    execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function loadConfig() {
  if (!fs.existsSync(configPath)) return { agents: [], pipelineOrder: [] };
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function main() {
  const printOnly = process.argv.includes('--print');
  const config = loadConfig();
  const agents = config.agents || [];
  const result = {
    updatedAt: new Date().toISOString(),
    agents: agents.map((a) => {
      const available = a.toolOnly ? true : (a.cli ? which(a.cli) : false);
      return {
        id: a.id,
        name: a.name,
        role: a.role,
        available,
        cli: a.cli || null,
        whenInvoke: a.whenInvoke,
      };
    }),
    pipelineOrder: config.pipelineOrder || [],
    summary: {
      total: agents.length,
      available: agents.filter((a) => a.toolOnly || (a.cli && which(a.cli))).length,
    },
  };

  if (printOnly) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (!fs.existsSync(statusDir)) fs.mkdirSync(statusDir, { recursive: true });
  fs.writeFileSync(statusPath, JSON.stringify(result, null, 2), 'utf8');
  console.log('Team status written to', statusPath);
  console.log('Available:', result.summary.available, '/', result.summary.total);
  result.agents.forEach((a) => {
    console.log('  ', a.available ? '✓' : '✗', a.name, a.role ? `(${a.role})` : '');
  });
}

main();
