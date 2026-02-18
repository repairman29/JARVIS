/**
 * Team status skill — read ~/.jarvis/team-status.json so JARVIS can see who's on the team and ready.
 * Run `node scripts/team-status.js` to refresh the file before asking JARVIS.
 */

const path = require('path');
const fs = require('fs');

const statusPath = path.join(process.env.HOME || process.env.USERPROFILE, '.jarvis', 'team-status.json');

function get_team_status() {
  if (!fs.existsSync(statusPath)) {
    return {
      success: false,
      error: 'Team status not found. Run: node scripts/team-status.js',
      hint: 'From JARVIS repo: node scripts/team-status.js (writes ~/.jarvis/team-status.json)',
    };
  }
  try {
    const data = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
    return {
      success: true,
      updatedAt: data.updatedAt || null,
      summary: data.summary || { total: 0, available: 0 },
      agents: (data.agents || []).map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        available: a.available,
        cli: a.cli,
        whenInvoke: a.whenInvoke,
      })),
      pipelineOrder: data.pipelineOrder || [],
    };
  } catch (e) {
    return {
      success: false,
      error: e.message || String(e),
      path: statusPath,
    };
  }
}

module.exports = {
  tools: {
    get_team_status,
  },
};
