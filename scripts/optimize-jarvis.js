#!/usr/bin/env node

/**
 * JARVIS Performance Optimization Script
 * Automatically optimizes JARVIS for better performance and user experience
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Configuration
const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const OPTIMIZATION_LOG = path.join(JARVIS_DIR, 'optimization.log');

// Colors for output
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
  const timestamp = new Date().toISOString();
  const coloredMessage = `${colors[color]}${message}${colors.reset}`;
  console.log(coloredMessage);
  
  // Also log to file
  try {
    if (!fs.existsSync(JARVIS_DIR)) {
      fs.mkdirSync(JARVIS_DIR, { recursive: true });
    }
    fs.appendFileSync(OPTIMIZATION_LOG, `${timestamp} ${message}\n`);
  } catch (error) {
    // Silently fail logging
  }
}

function runOptimization(name, optimizationFunction) {
  log(`🔧 Running optimization: ${name}`, 'cyan');
  
  try {
    const startTime = Date.now();
    const result = optimizationFunction();
    const duration = Date.now() - startTime;
    
    log(`✅ ${name} completed in ${duration}ms`, 'green');
    return { success: true, result, duration };
  } catch (error) {
    log(`❌ ${name} failed: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

// Optimization functions
const optimizations = {
  cleanupTempFiles: () => {
    let cleanedBytes = 0;
    const tempDirs = [
      path.join(JARVIS_DIR, 'temp'),
      path.join(JARVIS_DIR, 'cache'),
      path.join(JARVIS_DIR, 'logs')
    ];
    
    tempDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          // Clean files older than 7 days
          if (stats.mtime < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
            cleanedBytes += stats.size;
            fs.unlinkSync(filePath);
          }
        });
      }
    });
    
    return { message: `Cleaned ${Math.round(cleanedBytes / 1024)} KB of temporary files` };
  },

  optimizeFileSearch: () => {
    const indexDir = path.join(JARVIS_DIR, 'file-index');
    
    if (!fs.existsSync(indexDir)) {
      return { message: 'File search not yet initialized' };
    }
    
    const indexFile = path.join(indexDir, 'files.json');
    
    if (fs.existsSync(indexFile)) {
      const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
      
      if (index.files) {
        // Remove stale file references
        const validFiles = index.files.filter(file => fs.existsSync(file.path));
        const removedCount = index.files.length - validFiles.length;
        
        if (removedCount > 0) {
          index.files = validFiles;
          index.lastUpdate = new Date().toISOString();
          fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
        }
        
        return { 
          message: `File index optimized - removed ${removedCount} stale references`,
          validFiles: validFiles.length,
          removedFiles: removedCount
        };
      }
    }
    
    return { message: 'File index already optimized' };
  },

  optimizeClipboard: () => {
    const clipboardDir = path.join(JARVIS_DIR, 'clipboard');
    const historyFile = path.join(clipboardDir, 'history.json');
    
    if (!fs.existsSync(historyFile)) {
      return { message: 'Clipboard history not found' };
    }
    
    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    
    if (history.items && history.items.length > 1000) {
      // Keep only most recent 1000 items and all pinned items
      const pinnedItems = history.items.filter(item => item.pinned);
      const recentItems = history.items
        .filter(item => !item.pinned)
        .slice(0, 1000 - pinnedItems.length);
      
      const originalCount = history.items.length;
      history.items = [...recentItems, ...pinnedItems];
      
      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
      
      return {
        message: `Clipboard optimized - reduced from ${originalCount} to ${history.items.length} items`,
        removedItems: originalCount - history.items.length
      };
    }
    
    return { message: 'Clipboard already optimized' };
  },

  optimizeWorkflows: () => {
    const workflowDir = path.join(JARVIS_DIR, 'workflows');
    const workflowsFile = path.join(workflowDir, 'workflows.json');
    
    if (!fs.existsSync(workflowsFile)) {
      return { message: 'No workflows to optimize' };
    }
    
    const data = JSON.parse(fs.readFileSync(workflowsFile, 'utf8'));
    
    if (data.workflows) {
      let optimizedCount = 0;
      
      data.workflows.forEach(workflow => {
        // Check for parallel execution opportunities
        const parallelizable = workflow.steps?.filter((step, index) => {
          // Simple heuristic: steps without variable dependencies can be parallel
          return !step.parameters || !JSON.stringify(step.parameters).includes('${');
        });
        
        if (parallelizable && parallelizable.length > 1) {
          parallelizable.forEach(step => {
            if (!step.parallel) {
              step.parallel = true;
              optimizedCount++;
            }
          });
        }
      });
      
      if (optimizedCount > 0) {
        fs.writeFileSync(workflowsFile, JSON.stringify(data, null, 2));
        return {
          message: `Workflow optimization applied to ${optimizedCount} steps`,
          optimizedSteps: optimizedCount
        };
      }
    }
    
    return { message: 'Workflows already optimized' };
  },

  checkSystemHealth: () => {
    const health = {
      platform: process.platform,
      nodeVersion: process.version,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),
      cpuCores: os.cpus().length,
      uptime: Math.round(os.uptime() / 3600),
      loadAverage: os.loadavg()
    };
    
    const recommendations = [];
    
    if (health.freeMemory < 2) {
      recommendations.push('Consider closing unused applications for better performance');
    }
    
    if (health.loadAverage[0] > health.cpuCores * 0.8) {
      recommendations.push('High CPU usage detected - check for resource-intensive processes');
    }
    
    if (parseInt(health.nodeVersion.substring(1)) < 16) {
      recommendations.push('Consider upgrading Node.js to version 16+ for better performance');
    }
    
    return {
      message: 'System health check completed',
      health: health,
      recommendations: recommendations
    };
  },

  optimizeStartup: () => {
    // Create startup optimization hints
    const optimizations = [];
    
    // Check for large skill directories
    const skillsDir = path.join(JARVIS_DIR, 'skills');
    if (fs.existsSync(skillsDir)) {
      const skills = fs.readdirSync(skillsDir);
      
      skills.forEach(skill => {
        const skillPath = path.join(skillsDir, skill);
        const stats = fs.statSync(skillPath);
        
        if (stats.isDirectory()) {
          // Check skill size and suggest optimizations
          const skillFiles = fs.readdirSync(skillPath);
          const largeFiles = skillFiles.filter(file => {
            const filePath = path.join(skillPath, file);
            const fileStats = fs.statSync(filePath);
            return fileStats.size > 100 * 1024; // > 100KB
          });
          
          if (largeFiles.length > 0) {
            optimizations.push(`Skill "${skill}" has ${largeFiles.length} large files - consider optimization`);
          }
        }
      });
    }
    
    // Check Node.js modules
    try {
      const packageJson = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        const depCount = Object.keys(pkg.dependencies || {}).length;
        
        if (depCount > 50) {
          optimizations.push(`High dependency count (${depCount}) may slow startup`);
        }
      }
    } catch (error) {
      // Ignore package.json issues
    }
    
    return {
      message: 'Startup optimization analysis complete',
      optimizations: optimizations,
      recommendedActions: [
        'Disable unused skills to reduce startup time',
        'Use skill lazy loading for better performance',
        'Consider SSD storage for faster file access'
      ]
    };
  },

  createPerformanceBenchmark: () => {
    // Create performance baseline for future comparisons
    const benchmark = {
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        totalMemory: os.totalmem(),
        cpuModel: os.cpus()[0].model,
        cpuCores: os.cpus().length
      },
      jarvis: {
        skillCount: 0,
        workflowCount: 0,
        clipboardItems: 0,
        fileIndexSize: 0
      },
      performance: {
        startupTime: null, // Would measure actual startup
        commandResponseTime: null, // Would measure command execution
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
    
    // Count JARVIS data
    try {
      const skillsDir = path.join(JARVIS_DIR, 'skills');
      if (fs.existsSync(skillsDir)) {
        benchmark.jarvis.skillCount = fs.readdirSync(skillsDir).length;
      }
      
      const workflowsFile = path.join(JARVIS_DIR, 'workflows', 'workflows.json');
      if (fs.existsSync(workflowsFile)) {
        const workflows = JSON.parse(fs.readFileSync(workflowsFile, 'utf8'));
        benchmark.jarvis.workflowCount = workflows.workflows?.length || 0;
      }
      
      const clipboardFile = path.join(JARVIS_DIR, 'clipboard', 'history.json');
      if (fs.existsSync(clipboardFile)) {
        const clipboard = JSON.parse(fs.readFileSync(clipboardFile, 'utf8'));
        benchmark.jarvis.clipboardItems = clipboard.items?.length || 0;
      }
      
      const indexFile = path.join(JARVIS_DIR, 'file-index', 'files.json');
      if (fs.existsSync(indexFile)) {
        const stats = fs.statSync(indexFile);
        benchmark.jarvis.fileIndexSize = stats.size;
      }
    } catch (error) {
      // Continue with partial benchmark
    }
    
    // Save benchmark
    const benchmarkFile = path.join(JARVIS_DIR, 'benchmark.json');
    fs.writeFileSync(benchmarkFile, JSON.stringify(benchmark, null, 2));
    
    return {
      message: 'Performance benchmark created',
      benchmark: benchmark,
      saved: benchmarkFile
    };
  }
};

// Main optimization runner
async function runAllOptimizations() {
  log('🚀 JARVIS Performance Optimization', 'purple');
  log('=====================================', 'purple');
  
  const results = {};
  
  // Run each optimization
  for (const [name, func] of Object.entries(optimizations)) {
    const result = runOptimization(name, func);
    results[name] = result;
    
    if (result.success && result.result.message) {
      log(`   ${result.result.message}`, 'blue');
    }
  }
  
  // Summary
  log('\n📊 Optimization Summary:', 'purple');
  log('=======================', 'purple');
  
  const successful = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;
  
  log(`✅ ${successful}/${total} optimizations completed successfully`, 'green');
  
  if (successful < total) {
    const failed = Object.entries(results)
      .filter(([name, result]) => !result.success)
      .map(([name, result]) => `${name}: ${result.error}`);
    
    log(`❌ Failed optimizations:`, 'red');
    failed.forEach(failure => log(`   ${failure}`, 'red'));
  }
  
  // Performance recommendations
  log('\n💡 Performance Recommendations:', 'cyan');
  log('===============================', 'cyan');
  
  const systemHealth = results.checkSystemHealth?.result?.health;
  if (systemHealth) {
    log(`   System: ${systemHealth.platform} with ${systemHealth.cpuCores} cores and ${systemHealth.totalMemory}GB RAM`, 'blue');
    log(`   Memory: ${systemHealth.freeMemory}GB free (${Math.round((systemHealth.freeMemory / systemHealth.totalMemory) * 100)}%)`, 'blue');
    
    if (systemHealth.freeMemory < 2) {
      log('   ⚠️  Low memory - consider closing unused applications', 'yellow');
    }
    
    if (systemHealth.loadAverage[0] > systemHealth.cpuCores * 0.8) {
      log('   ⚠️  High CPU usage - check for resource-intensive processes', 'yellow');
    }
  }
  
  // Startup optimization suggestions
  const startupOpts = results.optimizeStartup?.result?.optimizations;
  if (startupOpts && startupOpts.length > 0) {
    log('   Startup optimizations:', 'blue');
    startupOpts.forEach(opt => log(`   - ${opt}`, 'blue'));
  }
  
  log('\n🎉 JARVIS optimization complete! Your productivity system is now running at peak performance.', 'green');
  log('\nRestart JARVIS to apply all optimizations: clawdbot gateway restart', 'cyan');
}

// Additional utility functions
function createOptimizationSchedule() {
  log('⏰ Setting up automatic optimization schedule...', 'cyan');
  
  const cronJob = `# JARVIS Performance Optimization
# Runs daily at 3 AM when system is likely idle
0 3 * * * cd "${process.cwd()}" && node scripts/optimize-jarvis.js > /dev/null 2>&1`;
  
  const cronFile = path.join(os.homedir(), '.jarvis-cron');
  fs.writeFileSync(cronFile, cronJob);
  
  log('✅ Optimization schedule created', 'green');
  log('   Add to crontab with: crontab ~/.jarvis-cron', 'blue');
  
  return { cronFile, schedule: '3 AM daily' };
}

function generateOptimizationReport() {
  log('📊 Generating optimization report...', 'cyan');
  
  const reportData = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024)
    },
    jarvis: {
      installPath: JARVIS_DIR,
      skillCount: 0,
      workflowCount: 0,
      optimizationsRun: Object.keys(optimizations).length
    },
    recommendations: [
      'Run optimization weekly for best performance',
      'Monitor system resources during peak usage',
      'Update Node.js regularly for security and performance',
      'Use SSD storage for optimal file search performance'
    ]
  };
  
  // Count JARVIS components
  try {
    const skillsDir = path.join(os.homdir(), 'jarvis', 'skills');
    if (fs.existsSync(skillsDir)) {
      reportData.jarvis.skillCount = fs.readdirSync(skillsDir).length;
    }
    
    const workflowsFile = path.join(JARVIS_DIR, 'workflows', 'workflows.json');
    if (fs.existsSync(workflowsFile)) {
      const workflows = JSON.parse(fs.readFileSync(workflowsFile, 'utf8'));
      reportData.jarvis.workflowCount = workflows.workflows?.length || 0;
    }
  } catch (error) {
    // Continue with basic report
  }
  
  const reportFile = path.join(JARVIS_DIR, 'optimization-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
  
  log(`✅ Optimization report saved to: ${reportFile}`, 'green');
  
  return reportData;
}

// Command line argument handling
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
JARVIS Performance Optimization Script

Usage:
  node scripts/optimize-jarvis.js [options]

Options:
  --help, -h          Show this help message
  --schedule          Set up automatic optimization schedule
  --report            Generate optimization report only
  --quick             Run quick optimizations only (faster)
  --full              Run all optimizations (default)

Examples:
  node scripts/optimize-jarvis.js                 # Run all optimizations
  node scripts/optimize-jarvis.js --quick         # Quick cleanup only
  node scripts/optimize-jarvis.js --schedule      # Set up daily optimization
  node scripts/optimize-jarvis.js --report        # Generate report without optimization
`);
    return;
  }
  
  if (args.includes('--schedule')) {
    createOptimizationSchedule();
    return;
  }
  
  if (args.includes('--report')) {
    generateOptimizationReport();
    return;
  }
  
  if (args.includes('--quick')) {
    // Run only quick optimizations
    const quickOpts = ['cleanupTempFiles', 'checkSystemHealth'];
    
    log('⚡ Running quick optimizations...', 'cyan');
    
    for (const optName of quickOpts) {
      if (optimizations[optName]) {
        runOptimization(optName, optimizations[optName]);
      }
    }
    
    log('✅ Quick optimization complete!', 'green');
    return;
  }
  
  // Default: run all optimizations
  await runAllOptimizations();
  
  // Generate report
  generateOptimizationReport();
}

// Export for programmatic use
module.exports = { optimizations, runAllOptimizations };

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}