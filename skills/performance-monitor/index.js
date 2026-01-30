const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Performance monitoring configuration
const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const PERF_DIR = path.join(JARVIS_DIR, 'performance');
const METRICS_FILE = path.join(PERF_DIR, 'metrics.json');
const BENCHMARKS_FILE = path.join(PERF_DIR, 'benchmarks.json');
const ALERTS_FILE = path.join(PERF_DIR, 'alerts.json');

const MONITORING_ENABLED = process.env.JARVIS_PERF_MONITORING_ENABLED !== 'false';
const ALERT_THRESHOLD = parseFloat(process.env.JARVIS_PERF_ALERT_THRESHOLD) || 0.8;
const HISTORY_DAYS = parseInt(process.env.JARVIS_PERF_HISTORY_DAYS) || 30;

let monitoringInterval = null;
let isMonitoring = false;

// Helper functions
function ensureDirectories() {
  if (!fs.existsSync(JARVIS_DIR)) {
    fs.mkdirSync(JARVIS_DIR, { recursive: true });
  }
  if (!fs.existsSync(PERF_DIR)) {
    fs.mkdirSync(PERF_DIR, { recursive: true });
  }
}

function getSystemMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    cpu: {
      cores: os.cpus().length,
      model: os.cpus()[0].model,
      loadAverage: os.loadavg(),
      usage: null
    },
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
    },
    system: {
      platform: os.platform(),
      release: os.release(),
      uptime: os.uptime(),
      hostname: os.hostname()
    },
    process: {
      pid: process.pid,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      version: process.version
    }
  };
  
  // Calculate CPU usage if possible
  try {
    if (os.platform() === 'darwin') {
      const topOutput = execSync('top -l 1 -s 0 | grep "CPU usage"', { encoding: 'utf8' });
      const match = topOutput.match(/(\d+\.\d+)% user/);
      if (match) {
        metrics.cpu.usage = parseFloat(match[1]);
      }
    }
  } catch (error) {
    // CPU usage calculation failed, continue without it
  }
  
  return metrics;
}

function getJarvisMetrics() {
  const jarvisMetrics = {
    timestamp: new Date().toISOString(),
    skills: {
      installed: 0,
      enabled: 0,
      totalTools: 0
    },
    workflows: {
      total: 0,
      executed: 0,
      averageExecutionTime: 0
    },
    files: {
      indexed: 0,
      indexSize: 0,
      lastIndexUpdate: null
    },
    clipboard: {
      items: 0,
      size: 0
    },
    performance: {
      averageResponseTime: null,
      errorRate: 0,
      uptime: process.uptime()
    }
  };
  
  try {
    // Count skills
    const skillsDir = path.join(os.homedir(), 'jarvis', 'skills');
    if (fs.existsSync(skillsDir)) {
      const skills = fs.readdirSync(skillsDir);
      jarvisMetrics.skills.installed = skills.length;
      
      // Count tools across all skills
      skills.forEach(skill => {
        const skillJsonPath = path.join(skillsDir, skill, 'skill.json');
        if (fs.existsSync(skillJsonPath)) {
          try {
            const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf8'));
            jarvisMetrics.skills.totalTools += (skillJson.tools || []).length;
          } catch (error) {
            // Skip invalid skill.json files
          }
        }
      });
    }
    
    // Check workflows
    const workflowsFile = path.join(JARVIS_DIR, 'workflows', 'workflows.json');
    if (fs.existsSync(workflowsFile)) {
      const workflows = JSON.parse(fs.readFileSync(workflowsFile, 'utf8'));
      jarvisMetrics.workflows.total = workflows.workflows?.length || 0;
    }
    
    // Check file index
    const indexFile = path.join(JARVIS_DIR, 'file-index', 'files.json');
    if (fs.existsSync(indexFile)) {
      const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
      jarvisMetrics.files.indexed = index.files?.length || 0;
      jarvisMetrics.files.indexSize = fs.statSync(indexFile).size;
      jarvisMetrics.files.lastIndexUpdate = index.lastUpdate;
    }
    
    // Check clipboard
    const clipboardFile = path.join(JARVIS_DIR, 'clipboard', 'history.json');
    if (fs.existsSync(clipboardFile)) {
      const clipboard = JSON.parse(fs.readFileSync(clipboardFile, 'utf8'));
      jarvisMetrics.clipboard.items = clipboard.items?.length || 0;
      jarvisMetrics.clipboard.size = fs.statSync(clipboardFile).size;
    }
    
  } catch (error) {
    // Continue with partial metrics
    console.log('Warning: Could not collect complete JARVIS metrics');
  }
  
  return jarvisMetrics;
}

function recordMetrics(systemMetrics, jarvisMetrics) {
  try {
    ensureDirectories();
    
    let metricsHistory = [];
    if (fs.existsSync(METRICS_FILE)) {
      metricsHistory = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
    }
    
    metricsHistory.push({
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      jarvis: jarvisMetrics
    });
    
    // Keep only last 30 days of data
    const cutoffDate = new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000);
    metricsHistory = metricsHistory.filter(entry =>
      new Date(entry.timestamp) >= cutoffDate
    );
    
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metricsHistory, null, 2));
  } catch (error) {
    console.error('Failed to record metrics:', error.message);
  }
}

function generateOptimizationRecommendations(systemMetrics, jarvisMetrics) {
  const recommendations = [];
  
  // System-level recommendations
  if (systemMetrics.memory.percentage > 85) {
    recommendations.push({
      type: 'memory',
      priority: 'high',
      message: 'High memory usage detected - consider closing unused applications',
      action: 'free_memory'
    });
  }
  
  if (systemMetrics.cpu.loadAverage[0] > systemMetrics.cpu.cores * 0.8) {
    recommendations.push({
      type: 'cpu',
      priority: 'medium', 
      message: 'High CPU load - check for resource-intensive processes',
      action: 'check_processes'
    });
  }
  
  // JARVIS-specific recommendations
  if (jarvisMetrics.clipboard.items > 1000) {
    recommendations.push({
      type: 'jarvis',
      priority: 'low',
      message: 'Large clipboard history - consider cleanup for better performance',
      action: 'cleanup_clipboard'
    });
  }
  
  if (jarvisMetrics.files.indexed > 50000) {
    recommendations.push({
      type: 'jarvis',
      priority: 'medium',
      message: 'Large file index - consider optimizing search paths',
      action: 'optimize_file_search'
    });
  }
  
  if (jarvisMetrics.skills.installed > 15) {
    recommendations.push({
      type: 'jarvis',
      priority: 'low',
      message: 'Many skills installed - disable unused ones for faster startup',
      action: 'audit_skills'
    });
  }
  
  return recommendations;
}

async function runBenchmark(benchmarkType, iterations = 5) {
  const results = {
    type: benchmarkType,
    iterations: iterations,
    timestamp: new Date().toISOString(),
    results: [],
    average: 0,
    min: 0,
    max: 0,
    standardDeviation: 0
  };
  
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const iterationStart = Date.now();
    
    try {
      switch (benchmarkType) {
        case 'startup':
          // Simulate startup time measurement
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
          break;
          
        case 'command_response':
          // Simulate command execution time
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150));
          break;
          
        case 'file_search':
          // Simulate file search performance
          await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
          break;
          
        case 'workflow_execution':
          // Simulate workflow execution time
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
          break;
          
        default:
          throw new Error(`Unknown benchmark type: ${benchmarkType}`);
      }
      
      const duration = Date.now() - iterationStart;
      results.results.push(duration);
      
    } catch (error) {
      results.results.push(null);
      console.log(`Benchmark iteration ${i + 1} failed: ${error.message}`);
    }
  }
  
  // Calculate statistics
  const validResults = results.results.filter(r => r !== null);
  
  if (validResults.length > 0) {
    results.average = validResults.reduce((a, b) => a + b, 0) / validResults.length;
    results.min = Math.min(...validResults);
    results.max = Math.max(...validResults);
    
    // Calculate standard deviation
    const variance = validResults.reduce((sum, value) => {
      return sum + Math.pow(value - results.average, 2);
    }, 0) / validResults.length;
    results.standardDeviation = Math.sqrt(variance);
  }
  
  results.totalTime = Date.now() - startTime;
  results.successRate = (validResults.length / iterations) * 100;
  
  return results;
}

// Tool implementations
const tools = {
  system_health: async ({ includeJarvisMetrics = true, includeRecommendations = true, detailLevel = 'detailed' }) => {
    try {
      const systemMetrics = getSystemMetrics();
      let jarvisMetrics = null;
      let recommendations = [];
      
      if (includeJarvisMetrics) {
        jarvisMetrics = getJarvisMetrics();
      }
      
      if (includeRecommendations) {
        recommendations = generateOptimizationRecommendations(systemMetrics, jarvisMetrics);
      }
      
      const healthScore = calculateHealthScore(systemMetrics, jarvisMetrics);
      
      const report = {
        healthScore: healthScore,
        status: healthScore > 80 ? 'excellent' : healthScore > 60 ? 'good' : healthScore > 40 ? 'fair' : 'poor',
        timestamp: new Date().toISOString(),
        system: systemMetrics,
        recommendations: recommendations
      };
      
      if (includeJarvisMetrics) {
        report.jarvis = jarvisMetrics;
      }
      
      // Record metrics for historical tracking
      recordMetrics(systemMetrics, jarvisMetrics);
      
      return {
        success: true,
        report: report,
        detailLevel: detailLevel
      };
    } catch (error) {
      return {
        success: false,
        message: `Health check failed: ${error.message}`
      };
    }
  },

  performance_benchmark: async ({ benchmarkType = 'all', iterations = 5, saveResults = true, compareWithBaseline = true }) => {
    try {
      const benchmarks = {};
      const benchmarkTypes = benchmarkType === 'all' ? 
        ['startup', 'command_response', 'file_search', 'workflow_execution'] : 
        [benchmarkType];
      
      for (const type of benchmarkTypes) {
        benchmarks[type] = await runBenchmark(type, iterations);
      }
      
      // Compare with baseline if available
      let comparison = null;
      if (compareWithBaseline && fs.existsSync(BENCHMARKS_FILE)) {
        try {
          const baseline = JSON.parse(fs.readFileSync(BENCHMARKS_FILE, 'utf8'));
          comparison = {};
          
          Object.keys(benchmarks).forEach(type => {
            if (baseline[type]) {
              const improvement = baseline[type].average - benchmarks[type].average;
              comparison[type] = {
                baseline: baseline[type].average,
                current: benchmarks[type].average,
                improvement: improvement,
                percentChange: (improvement / baseline[type].average) * 100
              };
            }
          });
        } catch (error) {
          // Continue without comparison
        }
      }
      
      // Save results
      if (saveResults) {
        ensureDirectories();
        fs.writeFileSync(BENCHMARKS_FILE, JSON.stringify(benchmarks, null, 2));
      }
      
      return {
        success: true,
        benchmarks: benchmarks,
        comparison: comparison,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `Benchmark failed: ${error.message}`,
        benchmarkType: benchmarkType
      };
    }
  },

  optimize_performance: async ({ optimizationType = 'quick', targetAreas = [], aggressiveCleanup = false, backupFirst = true }) => {
    try {
      const optimizationResults = [];
      
      if (backupFirst) {
        // Create backup before optimization
        const backupResult = await createPerformanceBackup();
        optimizationResults.push({
          step: 'backup',
          success: backupResult.success,
          message: backupResult.message
        });
      }
      
      // Run optimizations based on type
      switch (optimizationType) {
        case 'quick':
          optimizationResults.push(...await runQuickOptimizations());
          break;
        case 'full':
          optimizationResults.push(...await runFullOptimizations(aggressiveCleanup));
          break;
        case 'targeted':
          optimizationResults.push(...await runTargetedOptimizations(targetAreas));
          break;
        case 'custom':
          optimizationResults.push(...await runCustomOptimizations(targetAreas, aggressiveCleanup));
          break;
      }
      
      const successfulOpts = optimizationResults.filter(r => r.success).length;
      const totalOpts = optimizationResults.length;
      
      return {
        success: successfulOpts > 0,
        message: `Performance optimization completed: ${successfulOpts}/${totalOpts} optimizations successful`,
        optimizationType: optimizationType,
        results: optimizationResults,
        successRate: (successfulOpts / totalOpts) * 100
      };
    } catch (error) {
      return {
        success: false,
        message: `Performance optimization failed: ${error.message}`,
        optimizationType: optimizationType
      };
    }
  },

  monitor_realtime: async ({ action = 'start', monitorInterval = 30, alertThresholds = {}, alertMethods = ['notification'] }) => {
    try {
      switch (action) {
        case 'start':
          if (isMonitoring) {
            return {
              success: false,
              message: 'Real-time monitoring is already active'
            };
          }
          
          isMonitoring = true;
          
          monitoringInterval = setInterval(() => {
            const metrics = getSystemMetrics();
            const jarvisMetrics = getJarvisMetrics();
            
            // Check alert thresholds
            const alerts = checkAlertThresholds(metrics, jarvisMetrics, alertThresholds);
            
            if (alerts.length > 0) {
              alerts.forEach(alert => {
                sendAlert(alert, alertMethods);
              });
            }
            
            // Record metrics
            recordMetrics(metrics, jarvisMetrics);
            
          }, monitorInterval * 1000);
          
          return {
            success: true,
            message: `Real-time monitoring started (${monitorInterval}s interval)`,
            monitorInterval: monitorInterval,
            alertThresholds: alertThresholds
          };
          
        case 'stop':
          if (monitoringInterval) {
            clearInterval(monitoringInterval);
            monitoringInterval = null;
          }
          isMonitoring = false;
          
          return {
            success: true,
            message: 'Real-time monitoring stopped'
          };
          
        case 'status':
          return {
            success: true,
            monitoring: isMonitoring,
            interval: monitorInterval,
            message: isMonitoring ? 'Real-time monitoring active' : 'Real-time monitoring inactive'
          };
          
        default:
          throw new Error(`Unknown monitoring action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Monitoring operation failed: ${error.message}`,
        action: action
      };
    }
  },

  usage_statistics: async ({ reportType = 'weekly', includeProductivityScore = true, includeComparisons = true, generateVisualization = false, anonymized = true }) => {
    try {
      ensureDirectories();
      
      let metricsHistory = [];
      if (fs.existsSync(METRICS_FILE)) {
        metricsHistory = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8'));
      }
      
      // Filter by report timeframe
      const now = new Date();
      let cutoffDate;
      
      switch (reportType) {
        case 'daily': cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
        case 'weekly': cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'monthly': cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        default: cutoffDate = new Date(0); break;
      }
      
      const relevantMetrics = metricsHistory.filter(entry =>
        new Date(entry.timestamp) >= cutoffDate
      );
      
      const statistics = {
        reportType: reportType,
        timeframe: cutoffDate.toISOString(),
        dataPoints: relevantMetrics.length,
        system: {
          averageMemoryUsage: 0,
          averageCPULoad: 0,
          uptimeHours: 0
        },
        jarvis: {
          totalCommands: 0,
          averageResponseTime: 0,
          errorRate: 0,
          mostUsedSkills: {},
          mostUsedWorkflows: {}
        }
      };
      
      // Calculate averages
      if (relevantMetrics.length > 0) {
        statistics.system.averageMemoryUsage = relevantMetrics.reduce((sum, m) => 
          sum + m.system.memory.percentage, 0) / relevantMetrics.length;
        
        statistics.system.averageCPULoad = relevantMetrics.reduce((sum, m) => 
          sum + (m.system.cpu.loadAverage[0] || 0), 0) / relevantMetrics.length;
        
        statistics.system.uptimeHours = relevantMetrics[relevantMetrics.length - 1].system.system.uptime / 3600;
      }
      
      // Calculate productivity score if requested
      if (includeProductivityScore) {
        statistics.productivityScore = calculateProductivityScore(relevantMetrics);
      }
      
      return {
        success: true,
        statistics: statistics,
        reportGenerated: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        message: `Usage statistics failed: ${error.message}`,
        reportType: reportType
      };
    }
  }
};

// Helper functions for optimization
async function runQuickOptimizations() {
  const results = [];
  
  // Clear temporary files
  try {
    const tempDirs = [
      path.join(JARVIS_DIR, 'temp'),
      path.join(JARVIS_DIR, 'cache')
    ];
    
    let cleanedSize = 0;
    tempDirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          cleanedSize += stats.size;
          fs.unlinkSync(filePath);
        });
      }
    });
    
    results.push({
      step: 'cleanup_temp',
      success: true,
      message: `Cleaned ${Math.round(cleanedSize / 1024)} KB of temporary files`
    });
  } catch (error) {
    results.push({
      step: 'cleanup_temp',
      success: false,
      message: `Temp cleanup failed: ${error.message}`
    });
  }
  
  return results;
}

async function runFullOptimizations(aggressive = false) {
  const results = await runQuickOptimizations();
  
  // Add more comprehensive optimizations
  // (Implementation would include file index optimization, 
  // clipboard cleanup, workflow optimization, etc.)
  
  return results;
}

function calculateHealthScore(systemMetrics, jarvisMetrics) {
  let score = 100;
  
  // Deduct points for system issues
  if (systemMetrics.memory.percentage > 90) score -= 20;
  else if (systemMetrics.memory.percentage > 80) score -= 10;
  
  if (systemMetrics.cpu.loadAverage[0] > systemMetrics.cpu.cores) score -= 15;
  
  // Deduct points for JARVIS issues
  if (jarvisMetrics) {
    if (jarvisMetrics.clipboard.items > 2000) score -= 5;
    if (jarvisMetrics.files.indexed > 100000) score -= 5;
    if (jarvisMetrics.skills.installed > 20) score -= 3;
  }
  
  return Math.max(0, Math.min(100, score));
}

function calculateProductivityScore(metricsHistory) {
  // Simplified productivity score calculation
  // In production, would use more sophisticated algorithms
  
  if (metricsHistory.length === 0) return 0;
  
  let score = 70; // Base score
  
  // Bonus for consistent usage
  if (metricsHistory.length > 10) score += 10;
  
  // Bonus for low error rate
  const recentErrors = metricsHistory.slice(-20).filter(m => 
    m.jarvis && m.jarvis.performance.errorRate < 0.05
  ).length;
  score += (recentErrors / 20) * 15;
  
  // Bonus for good system health
  const avgMemoryUsage = metricsHistory.reduce((sum, m) => 
    sum + m.system.memory.percentage, 0) / metricsHistory.length;
  
  if (avgMemoryUsage < 70) score += 5;
  
  return Math.min(100, score);
}

function checkAlertThresholds(systemMetrics, jarvisMetrics, thresholds) {
  const alerts = [];
  const defaultThresholds = {
    cpuPercent: 80,
    memoryPercent: 85,
    responseTimeMs: 2000,
    diskSpacePercent: 90,
    ...thresholds
  };
  
  // Check system thresholds
  if (systemMetrics.memory.percentage > defaultThresholds.memoryPercent) {
    alerts.push({
      type: 'memory',
      severity: 'warning',
      message: `High memory usage: ${systemMetrics.memory.percentage.toFixed(1)}%`,
      threshold: defaultThresholds.memoryPercent,
      current: systemMetrics.memory.percentage
    });
  }
  
  if (systemMetrics.cpu.loadAverage[0] > systemMetrics.cpu.cores * (defaultThresholds.cpuPercent / 100)) {
    alerts.push({
      type: 'cpu',
      severity: 'warning',
      message: `High CPU load: ${systemMetrics.cpu.loadAverage[0].toFixed(2)}`,
      threshold: defaultThresholds.cpuPercent,
      current: systemMetrics.cpu.loadAverage[0]
    });
  }
  
  return alerts;
}

function sendAlert(alert, methods) {
  // Send alert through configured methods
  methods.forEach(method => {
    switch (method) {
      case 'notification':
        // Would send desktop notification
        console.log(`🚨 ${alert.message}`);
        break;
      case 'voice':
        // Would use voice feedback
        console.log(`🗣️ Voice alert: ${alert.message}`);
        break;
      case 'email':
        // Would send email alert
        console.log(`📧 Email alert: ${alert.message}`);
        break;
    }
  });
}

async function createPerformanceBackup() {
  try {
    ensureDirectories();
    
    const backupData = {
      timestamp: new Date().toISOString(),
      system: getSystemMetrics(),
      jarvis: getJarvisMetrics()
    };
    
    const backupFile = path.join(PERF_DIR, `backup-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    return {
      success: true,
      message: `Performance backup created: ${backupFile}`,
      backupFile: backupFile
    };
  } catch (error) {
    return {
      success: false,
      message: `Backup failed: ${error.message}`
    };
  }
}

module.exports = { tools };