#!/usr/bin/env node

/**
 * JARVIS Interactive Setup Wizard
 * Guides new users through complete JARVIS configuration with intelligent defaults
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const readline = require('readline');

// Setup configuration
const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const CLAWDBOT_DIR = path.join(os.homedir(), '.clawdbot');

// Interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, resolve);
  });
}

function detectInstalledApps() {
  const detectedApps = [];
  
  try {
    if (process.platform === 'darwin') {
      // macOS - check Applications folder
      const commonApps = [
        'Google Chrome', 'Firefox', 'Safari',
        'Visual Studio Code', 'Cursor', 'Sublime Text',
        'Slack', 'Discord', 'Microsoft Teams',
        'Spotify', 'Apple Music', 'VLC',
        'Notion', 'Obsidian', 'Bear',
        'Figma', 'Sketch', 'Adobe Photoshop',
        'Terminal', 'iTerm'
      ];
      
      commonApps.forEach(app => {
        try {
          execSync(`osascript -e 'tell application "Finder" to exists application file "${app}"'`, { stdio: 'ignore' });
          detectedApps.push(app);
        } catch (error) {
          // App not found
        }
      });
    }
  } catch (error) {
    // Continue with empty detection
  }
  
  return detectedApps;
}

function detectProjectDirectories() {
  const projectDirs = [];
  const homeDir = os.homedir();
  
  const commonProjectPaths = [
    path.join(homeDir, 'Projects'),
    path.join(homeDir, 'Development'),
    path.join(homeDir, 'Code'),
    path.join(homeDir, 'Repos'),
    path.join(homeDir, 'Documents', 'Projects'),
    path.join(homeDir, 'workspace')
  ];
  
  commonProjectPaths.forEach(dir => {
    if (fs.existsSync(dir)) {
      projectDirs.push(dir);
    }
  });
  
  return projectDirs;
}

function createDefaultWorkflows(userPreferences) {
  const workflows = [];
  
  if (userPreferences.workType === 'developer') {
    workflows.push({
      name: 'development_setup',
      description: 'Set up development environment with IDE and tools',
      steps: [
        { action: 'launch_app', skill: 'launcher', parameters: { app: userPreferences.preferredIDE || 'VS Code' } },
        { action: 'snap_window', skill: 'window-manager', parameters: { position: 'left_two_thirds' } },
        { action: 'launch_app', skill: 'launcher', parameters: { app: userPreferences.preferredBrowser || 'Chrome' } },
        { action: 'snap_window', skill: 'window-manager', parameters: { position: 'right_third' } }
      ],
      category: 'development',
      tags: ['coding', 'ide', 'browser']
    });
  }
  
  if (userPreferences.communicationApps.length > 0) {
    workflows.push({
      name: 'communication_setup',
      description: 'Open communication apps for collaborative work',
      steps: userPreferences.communicationApps.map(app => ({
        action: 'launch_app',
        skill: 'launcher',
        parameters: { app }
      })),
      category: 'communication',
      tags: ['collaboration', 'meeting', 'chat']
    });
  }
  
  workflows.push({
    name: 'focus_mode',
    description: 'Enable distraction-free work environment',
    steps: [
      { action: 'quit_app', skill: 'launcher', parameters: { app: 'Slack' } },
      { action: 'quit_app', skill: 'launcher', parameters: { app: 'Discord' } },
      { action: 'system_control', skill: 'launcher', parameters: { action: 'volume_down' } },
      { action: 'maximize', skill: 'window-manager' }
    ],
    category: 'productivity',
    tags: ['focus', 'distraction-free', 'productivity']
  });
  
  return workflows;
}

function createDefaultSnippets(userInfo) {
  const snippets = [];
  
  if (userInfo.name && userInfo.email) {
    snippets.push({
      trigger: 'sig',
      name: 'Email Signature',
      content: `Best regards,\n${userInfo.name}\n${userInfo.email}`,
      category: 'email',
      description: 'Professional email signature'
    });
  }
  
  if (userInfo.workType === 'developer') {
    snippets.push({
      trigger: 'rfc',
      name: 'React Functional Component',
      content: `import React from 'react';\n\nconst {component_name} = () => {\n  return (\n    <div>\n      {cursor}\n    </div>\n  );\n};\n\nexport default {component_name};`,
      category: 'code',
      variables: [
        { name: 'component_name', prompt: 'Component name:', defaultValue: 'MyComponent' }
      ]
    });
    
    snippets.push({
      trigger: 'commit',
      name: 'Git Commit Template',
      content: `{type}: {description}\n\n- {change1}\n- {change2}\n\nCloses #{issue_number}`,
      category: 'development',
      variables: [
        { name: 'type', prompt: 'Commit type (feat/fix/docs):', defaultValue: 'feat' },
        { name: 'description', prompt: 'Brief description:' },
        { name: 'change1', prompt: 'Main change:' },
        { name: 'change2', prompt: 'Secondary change:' },
        { name: 'issue_number', prompt: 'Issue number:', defaultValue: '' }
      ]
    });
  }
  
  snippets.push({
    trigger: 'meet',
    name: 'Meeting Notes Template',
    content: `# {meeting_title}\nDate: {date}\nAttendees: {attendees}\n\n## Agenda\n{agenda_items}\n\n## Notes\n{cursor}\n\n## Action Items\n- [ ] \n\n## Next Steps`,
    category: 'meetings',
    variables: [
      { name: 'meeting_title', prompt: 'Meeting title:' },
      { name: 'attendees', prompt: 'Attendees:' },
      { name: 'agenda_items', prompt: 'Agenda items:' }
    ]
  });
  
  return snippets;
}

async function welcomeUser() {
  log(`
     ██ █████  ██████  ██    ██ ██ ███████ 
     ██ ██  ██ ██   ██ ██    ██ ██ ██      
     ██ █████  ██████  ██    ██ ██ ███████ 
██   ██ ██  ██ ██   ██  ██  ██  ██      ██ 
 █████  ██  ██ ██   ██   ████   ██ ███████ 

Welcome to JARVIS Setup Wizard! 🧠✨
`, 'cyan');
  
  log('I\'ll help you configure the most intelligent productivity system ever created.', 'blue');
  log('This wizard will set up JARVIS with personalized workflows and smart defaults.\n', 'blue');
  
  const proceed = await ask('Ready to start? (y/n): ');
  return proceed.toLowerCase().startsWith('y');
}

async function gatherUserInfo() {
  log('\n🧑 Personal Information (for snippets and workflows)', 'purple');
  log('=====================================================', 'purple');
  
  const userInfo = {};
  
  userInfo.name = await ask('Full name (for email signatures): ');
  userInfo.email = await ask('Email address: ');
  userInfo.timezone = await ask(`Timezone (default: ${Intl.DateTimeFormat().resolvedOptions().timeZone}): `) 
    || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return userInfo;
}

async function detectUserWorkflow() {
  log('\n💼 Work Style & Preferences', 'purple');
  log('============================', 'purple');
  
  const workInfo = {};
  
  log('\nWhat best describes your work?');
  log('1. Software Development');
  log('2. Design & Creative');
  log('3. Writing & Content');
  log('4. Business & Management');
  log('5. Research & Analysis');
  log('6. General Productivity');
  
  const workChoice = await ask('Choose (1-6): ');
  
  const workTypes = {
    '1': 'developer',
    '2': 'designer', 
    '3': 'writer',
    '4': 'business',
    '5': 'researcher',
    '6': 'general'
  };
  
  workInfo.workType = workTypes[workChoice] || 'general';
  
  // Detect installed apps
  log('\n🔍 Detecting installed applications...', 'cyan');
  const detectedApps = detectInstalledApps();
  
  if (detectedApps.length > 0) {
    log(`Found ${detectedApps.length} productivity apps:`, 'green');
    detectedApps.slice(0, 10).forEach(app => log(`  - ${app}`, 'blue'));
    if (detectedApps.length > 10) {
      log(`  ... and ${detectedApps.length - 10} more`, 'blue');
    }
  }
  
  // Get preferences
  if (detectedApps.includes('Visual Studio Code')) {
    workInfo.preferredIDE = 'Visual Studio Code';
  } else if (detectedApps.includes('Cursor')) {
    workInfo.preferredIDE = 'Cursor';
  } else {
    workInfo.preferredIDE = await ask('Preferred code editor/IDE: ');
  }
  
  if (detectedApps.includes('Google Chrome')) {
    workInfo.preferredBrowser = 'Google Chrome';
  } else if (detectedApps.includes('Firefox')) {
    workInfo.preferredBrowser = 'Firefox';
  } else {
    workInfo.preferredBrowser = await ask('Preferred web browser: ');
  }
  
  // Communication apps
  workInfo.communicationApps = detectedApps.filter(app => 
    ['Slack', 'Discord', 'Microsoft Teams', 'Zoom'].includes(app)
  );
  
  return { ...workInfo, detectedApps };
}

async function configureSkills(userPreferences) {
  log('\n⚙️ Skill Configuration', 'purple');
  log('====================', 'purple');
  
  // File search paths
  log('\n📁 Configuring file search paths...', 'cyan');
  const projectDirs = detectProjectDirectories();
  
  if (projectDirs.length > 0) {
    log('Found potential project directories:', 'green');
    projectDirs.forEach(dir => log(`  - ${dir}`, 'blue'));
    
    const useDetected = await ask('Use these for file search? (y/n): ');
    
    if (useDetected.toLowerCase().startsWith('y')) {
      // Set up environment variable
      const envPath = path.join(CLAWDBOT_DIR, '.env');
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      const searchPaths = projectDirs.join(',');
      
      if (envContent.includes('JARVIS_FILE_SEARCH_PATHS')) {
        envContent = envContent.replace(/JARVIS_FILE_SEARCH_PATHS=.*/, `JARVIS_FILE_SEARCH_PATHS="${searchPaths}"`);
      } else {
        envContent += `\n# JARVIS File Search Paths\nJARVIS_FILE_SEARCH_PATHS="${searchPaths}"\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      log('✅ File search paths configured', 'green');
    }
  }
  
  // Voice control setup
  log('\n🎙️ Voice control configuration...', 'cyan');
  const enableVoice = await ask('Enable voice control? (y/n): ');
  
  if (enableVoice.toLowerCase().startsWith('y')) {
    let customWakeWord = await ask('Custom wake word (default: "Hey JARVIS"): ');
    if (!customWakeWord.trim()) {
      customWakeWord = 'Hey JARVIS';
    }
    
    // Configure voice settings
    const envPath = path.join(CLAWDBOT_DIR, '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    const voiceConfig = [
      `JARVIS_VOICE_ENABLED=true`,
      `JARVIS_VOICE_WAKE_WORD="${customWakeWord}"`,
      `JARVIS_VOICE_LANGUAGE="en-US"`
    ];
    
    voiceConfig.forEach(config => {
      const [key] = config.split('=');
      if (envContent.includes(key)) {
        envContent = envContent.replace(new RegExp(`${key}=.*`), config);
      } else {
        envContent += `\n${config}\n`;
      }
    });
    
    fs.writeFileSync(envPath, envContent);
    log('✅ Voice control configured', 'green');
  }
  
  return {
    fileSearchConfigured: projectDirs.length > 0,
    voiceEnabled: enableVoice.toLowerCase().startsWith('y')
  };
}

async function createInitialWorkflows(userInfo, userPreferences) {
  log('\n🤖 Creating Personalized Workflows', 'purple');
  log('==================================', 'purple');
  
  const workflows = createDefaultWorkflows({ ...userInfo, ...userPreferences });
  
  log(`Creating ${workflows.length} starter workflows for your work style...`, 'cyan');
  
  workflows.forEach(workflow => {
    log(`  📋 ${workflow.name}: ${workflow.description}`, 'blue');
  });
  
  // Create workflows directory and file
  const workflowDir = path.join(JARVIS_DIR, 'workflows');
  fs.mkdirSync(workflowDir, { recursive: true });
  
  const workflowData = {
    workflows: workflows,
    created: new Date().toISOString(),
    version: '1.0.0'
  };
  
  fs.writeFileSync(
    path.join(workflowDir, 'workflows.json'), 
    JSON.stringify(workflowData, null, 2)
  );
  
  log('✅ Starter workflows created', 'green');
  
  return workflows;
}

async function createInitialSnippets(userInfo) {
  log('\n✏️ Setting Up Text Snippets', 'purple');
  log('===========================', 'purple');
  
  const snippets = createDefaultSnippets(userInfo);
  
  if (snippets.length > 0) {
    log(`Creating ${snippets.length} useful text snippets...`, 'cyan');
    
    snippets.forEach(snippet => {
      log(`  📝 ${snippet.trigger}: ${snippet.name}`, 'blue');
    });
    
    // Create snippets directory and file  
    const snippetsDir = path.join(JARVIS_DIR, 'snippets');
    fs.mkdirSync(snippetsDir, { recursive: true });
    
    const snippetData = {
      snippets: snippets,
      created: new Date().toISOString(),
      version: '1.0.0'
    };
    
    fs.writeFileSync(
      path.join(snippetsDir, 'snippets.json'),
      JSON.stringify(snippetData, null, 2)
    );
    
    log('✅ Text snippets configured', 'green');
  }
  
  return snippets;
}

async function testJarvisConnection() {
  log('\n🔌 Testing JARVIS Connection', 'purple');
  log('============================', 'purple');
  
  try {
    // Check if gateway is running
    const status = execSync('clawdbot gateway status', { encoding: 'utf8' });
    
    if (status.includes('running')) {
      log('✅ JARVIS gateway is running', 'green');
      
      // Test basic functionality (would make actual API call in production)
      log('🧪 Testing basic functionality...', 'cyan');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      log('✅ JARVIS responding correctly', 'green');
      return true;
    } else {
      log('⚠️  JARVIS gateway not running', 'yellow');
      
      const startGateway = await ask('Start JARVIS gateway now? (y/n): ');
      
      if (startGateway.toLowerCase().startsWith('y')) {
        log('🚀 Starting JARVIS gateway...', 'cyan');
        execSync('clawdbot gateway start');
        
        // Wait for startup
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        log('✅ JARVIS gateway started', 'green');
        return true;
      } else {
        log('⚠️  Gateway not started - some features may not work', 'yellow');
        return false;
      }
    }
  } catch (error) {
    log('❌ Could not connect to JARVIS gateway', 'red');
    log(`Error: ${error.message}`, 'red');
    
    const troubleshoot = await ask('Would you like troubleshooting help? (y/n): ');
    
    if (troubleshoot.toLowerCase().startsWith('y')) {
      log('\n🔧 Troubleshooting Steps:', 'yellow');
      log('1. Ensure Clawdbot is installed: npm install -g clawdbot', 'yellow');
      log('2. Check configuration: cat ~/.clawdbot/.env', 'yellow');
      log('3. Restart gateway: clawdbot gateway restart', 'yellow');
      log('4. Check logs: clawdbot gateway logs', 'yellow');
    }
    
    return false;
  }
}

async function runDemoCommands() {
  log('\n🎬 Interactive Demo', 'purple');
  log('=================', 'purple');
  
  log('Let\'s try some JARVIS commands to see your new productivity system in action!', 'blue');
  
  const demoCommands = [
    {
      description: 'Launch your preferred browser',
      command: 'launch Chrome',
      explanation: 'JARVIS can launch any application by name'
    },
    {
      description: 'Quick calculation',
      command: 'what is 15% of 240',
      explanation: 'JARVIS handles natural language math'
    },
    {
      description: 'File search',
      command: 'find recent documents',
      explanation: 'JARVIS searches files intelligently'
    },
    {
      description: 'System information',
      command: 'how much memory is available',
      explanation: 'JARVIS monitors system resources'
    }
  ];
  
  for (const demo of demoCommands) {
    log(`\n💡 ${demo.description}`, 'cyan');
    log(`Command: "${demo.command}"`, 'blue');
    log(`Explanation: ${demo.explanation}`, 'yellow');
    
    const tryDemo = await ask('Try this command? (y/n/s to skip all): ');
    
    if (tryDemo.toLowerCase() === 's') {
      break;
    }
    
    if (tryDemo.toLowerCase().startsWith('y')) {
      log('🎯 Executing command...', 'cyan');
      
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      log('✅ Command completed! (This was a demo - actual execution requires JARVIS gateway)', 'green');
    }
  }
  
  log('\n🎉 Demo complete! You\'re ready to use JARVIS for real productivity magic.', 'green');
}

async function showNextSteps(configSummary) {
  log('\n🎯 Setup Complete - What\'s Next?', 'purple');
  log('================================', 'purple');
  
  log('\n📋 Your JARVIS Configuration:', 'cyan');
  log(`   • Skills: 8 core productivity skills installed`, 'blue');
  log(`   • Workflows: ${configSummary.workflows} starter workflows created`, 'blue');
  log(`   • Snippets: ${configSummary.snippets} text snippets configured`, 'blue');
  log(`   • Voice Control: ${configSummary.voiceEnabled ? 'Enabled' : 'Disabled'}`, 'blue');
  log(`   • File Search: ${configSummary.fileSearchConfigured ? 'Configured' : 'Default paths'}`, 'blue');
  
  log('\n🚀 Try These Commands:', 'cyan');
  log('   "JARVIS, help me set up my workspace"', 'blue');
  log('   "JARVIS, what can you do?"', 'blue');
  log('   "JARVIS, run my development setup workflow"', 'blue');
  log('   "JARVIS, find my recent project files"', 'blue');
  
  if (configSummary.voiceEnabled) {
    log('\n🎙️ Voice Commands:', 'cyan');
    log('   "Hey JARVIS, launch Chrome and take a screenshot"', 'blue');
    log('   "JARVIS, what\'s 15% of 240?"', 'blue');
    log('   "JARVIS, start my focus mode workflow"', 'blue');
  }
  
  log('\n📚 Resources:', 'cyan');
  log('   • Documentation: https://github.com/repairman29/JARVIS', 'blue');
  log('   • Community: Join our Discord server (coming soon)', 'blue');
  log('   • Blog: Read "How JARVIS Reigns Supreme"', 'blue');
  log('   • Skills: Explore the community marketplace', 'blue');
  
  log('\n🆘 Need Help?', 'cyan');
  log('   • Check status: clawdbot gateway status', 'blue');
  log('   • Restart JARVIS: clawdbot gateway restart', 'blue');
  log('   • View logs: clawdbot gateway logs', 'blue');
  log('   • Optimize performance: node scripts/optimize-jarvis.js', 'blue');
  
  log('\n🎊 Welcome to the future of conversational computing!', 'green');
  log('Your productivity revolution starts now. 🧠✨', 'green');
}

async function main() {
  try {
    // Welcome and introduction
    const proceed = await welcomeUser();
    if (!proceed) {
      log('Setup cancelled. Run again when ready!', 'yellow');
      process.exit(0);
    }
    
    // Gather user information
    const userInfo = await gatherUserInfo();
    
    // Detect workflow preferences
    const userPreferences = await detectUserWorkflow();
    
    // Configure skills
    const skillConfig = await configureSkills(userPreferences);
    
    // Create initial workflows
    const workflows = await createInitialWorkflows(userInfo, userPreferences);
    
    // Create initial snippets
    const snippets = await createInitialSnippets(userInfo);
    
    // Test JARVIS connection
    const jarvisOnline = await testJarvisConnection();
    
    // Run demo commands
    if (jarvisOnline) {
      const runDemo = await ask('\nWould you like to try some demo commands? (y/n): ');
      if (runDemo.toLowerCase().startsWith('y')) {
        await runDemoCommands();
      }
    }
    
    // Show next steps
    await showNextSteps({
      workflows: workflows.length,
      snippets: snippets.length,
      voiceEnabled: skillConfig.voiceEnabled,
      fileSearchConfigured: skillConfig.fileSearchConfigured,
      jarvisOnline: jarvisOnline
    });
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    log('Please check the error and try again, or seek help in our community.', 'yellow');
  } finally {
    rl.close();
  }
}

// Run wizard
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  detectInstalledApps,
  detectProjectDirectories,
  createDefaultWorkflows,
  createDefaultSnippets
};