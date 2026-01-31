const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Workflow automation configuration
const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const WORKFLOW_DIR = path.join(JARVIS_DIR, 'workflows');
const WORKFLOWS_FILE = path.join(WORKFLOW_DIR, 'workflows.json');
const HISTORY_FILE = path.join(WORKFLOW_DIR, 'history.json');
const PATTERNS_FILE = path.join(WORKFLOW_DIR, 'patterns.json');
const SCHEDULES_FILE = path.join(WORKFLOW_DIR, 'schedules.json');

const MAX_CHAINS = parseInt(process.env.JARVIS_WORKFLOW_MAX_CHAINS) || 50;
const WORKFLOW_TIMEOUT = parseInt(process.env.JARVIS_WORKFLOW_TIMEOUT) || 300000; // 5 minutes
const LEARNING_ENABLED = process.env.JARVIS_WORKFLOW_LEARNING_ENABLED !== 'false';

// Built-in workflow templates
const WORKFLOW_TEMPLATES = {
  morning_routine: {
    name: "Morning Routine",
    description: "Daily morning productivity setup",
    category: "productivity",
    steps: [
      { name: "check_calendar", action: "get_today_events", skill: "calendar" },
      { name: "open_work_apps", action: "launch_work_suite", skill: "launcher" },
      { name: "arrange_windows", action: "restore_workspace", skill: "window-manager", parameters: { name: "work" } }
    ]
  },
  
  project_setup: {
    name: "New Project Setup", 
    description: "Initialize development project environment",
    category: "development",
    steps: [
      { name: "create_directory", action: "create_project_dir", parameters: { name: "${project_name}" } },
      { name: "git_init", action: "initialize_git", skill: "launcher" },
      { name: "open_ide", action: "launch_app", skill: "launcher", parameters: { app: "VS Code" } },
      { name: "arrange_dev_layout", action: "window_arrangement", skill: "window-manager", parameters: { layout: "three_column" } }
    ],
    variables: { project_name: "new-project" }
  },
  
  end_of_day: {
    name: "End of Day Cleanup",
    description: "Save work and prepare for next day",
    category: "productivity", 
    steps: [
      { name: "save_all", action: "save_all_documents", skill: "launcher" },
      { name: "close_work_apps", action: "quit_work_apps", skill: "launcher" },
      { name: "clear_downloads", action: "cleanup_downloads", skill: "file-search" },
      { name: "backup_important", action: "backup_files", skill: "file-search" }
    ]
  },
  
  focus_mode: {
    name: "Deep Work Focus",
    description: "Eliminate distractions and optimize for focused work",
    category: "productivity",
    steps: [
      { name: "close_distractions", action: "quit_apps", skill: "launcher", parameters: { apps: ["Slack", "Discord", "Social Media"] } },
      { name: "enable_do_not_disturb", action: "system_control", skill: "launcher", parameters: { action: "do_not_disturb_on" } },
      { name: "single_window", action: "maximize", skill: "window-manager" },
      { name: "start_focus_timer", action: "start_timer", parameters: { duration: "25m", type: "pomodoro" } }
    ]
  }
};

// Helper functions
function ensureDirectories() {
  if (!fs.existsSync(JARVIS_DIR)) {
    fs.mkdirSync(JARVIS_DIR, { recursive: true });
  }
  if (!fs.existsSync(WORKFLOW_DIR)) {
    fs.mkdirSync(WORKFLOW_DIR, { recursive: true });
  }
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function loadWorkflows() {
  try {
    if (fs.existsSync(WORKFLOWS_FILE)) {
      return JSON.parse(fs.readFileSync(WORKFLOWS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load workflows:', error.message);
  }
  return { workflows: [], lastUpdate: null };
}

function saveWorkflows(data) {
  try {
    ensureDirectories();
    fs.writeFileSync(WORKFLOWS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save workflows:', error.message);
  }
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (error) {
    // Silently fail
  }
  return [];
}

function saveHistory(history) {
  try {
    ensureDirectories();
    // Keep only last 1000 entries
    const limitedHistory = history.slice(0, 1000);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(limitedHistory, null, 2));
  } catch (error) {
    // Silently fail
  }
}

function recordExecution(workflowName, executionId, steps, result, duration, variables = {}) {
  const history = loadHistory();
  
  history.unshift({
    id: executionId,
    workflowName: workflowName,
    timestamp: new Date().toISOString(),
    duration: duration,
    steps: steps,
    result: result,
    variables: variables,
    success: result.success
  });
  
  saveHistory(history);
}

function evaluateCondition(condition, context = {}) {
  try {
    // Simple condition evaluation - in production would use a safer evaluator
    const now = new Date();
    const conditionContext = {
      ...context,
      currentTime: now.getTime(),
      dayOfWeek: now.getDay(),
      hourOfDay: now.getHours(),
      dayOfMonth: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      isWorkday: now.getDay() >= 1 && now.getDay() <= 5
    };
    
    // Replace variables in condition
    let processedCondition = condition;
    for (const [key, value] of Object.entries(conditionContext)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      processedCondition = processedCondition.replace(regex, JSON.stringify(value));
    }
    
    // Safe evaluation (in production, use a proper expression evaluator)
    return eval(processedCondition);
  } catch (error) {
    console.error('Condition evaluation failed:', error.message);
    return false;
  }
}

function interpolateVariables(text, variables = {}) {
  if (typeof text !== 'string') return text;
  
  return text.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    return variables[varName] || match;
  });
}

function interpolateParameters(parameters, variables = {}) {
  if (!parameters || typeof parameters !== 'object') return parameters;
  
  const result = {};
  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value === 'string') {
      result[key] = interpolateVariables(value, variables);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = interpolateParameters(value, variables);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Simulate skill execution (in production, would call actual JARVIS skills)
async function executeSkillTool(skill, tool, parameters) {
  try {
    // Mock execution - in production would call actual skill
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return {
      success: true,
      skill: skill,
      tool: tool,
      parameters: parameters,
      result: `Mock result from ${skill}.${tool}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      skill: skill,
      tool: tool,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function executeWorkflowStep(step, context = {}, variables = {}) {
  try {
    // Check condition if present
    if (step.condition && !evaluateCondition(step.condition, { ...context, ...variables })) {
      return {
        success: true,
        skipped: true,
        step: step.name,
        reason: 'Condition not met'
      };
    }
    
    // Interpolate variables in parameters
    const parameters = interpolateParameters(step.parameters || {}, variables);
    
    // Execute the step
    const startTime = Date.now();
    let result;
    
    if (step.skill && step.tool) {
      result = await executeSkillTool(step.skill, step.tool, parameters);
    } else if (step.action) {
      // Generic action execution
      result = await executeSkillTool(step.skill || 'system', step.action, parameters);
    } else {
      throw new Error('Step must have either skill+tool or action defined');
    }
    
    const duration = Date.now() - startTime;
    
    return {
      success: result.success,
      step: step.name,
      action: step.action || step.tool,
      skill: step.skill,
      duration: duration,
      result: result.result,
      error: result.error,
      parameters: parameters
    };
  } catch (error) {
    return {
      success: false,
      step: step.name,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function executeWorkflowSteps(steps, context = {}, variables = {}, options = {}) {
  const results = [];
  const { continueOnError = false, parallel = false, stopOnError = true } = options;
  
  if (parallel) {
    // Execute steps in parallel where possible
    const promises = steps.map(step => executeWorkflowStep(step, context, variables));
    const parallelResults = await Promise.allSettled(promises);
    
    parallelResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          step: steps[index].name,
          error: result.reason.message
        });
      }
    });
  } else {
    // Execute steps sequentially
    for (const step of steps) {
      const result = await executeWorkflowStep(step, context, variables);
      results.push(result);
      
      // Update context with result for next steps
      if (result.success && result.result) {
        context[step.name] = result.result;
      }
      
      // Stop on error if configured
      if (!result.success && stopOnError && !continueOnError) {
        break;
      }
    }
  }
  
  return results;
}

function analyzeWorkflowPerformance(results) {
  const totalSteps = results.length;
  const successfulSteps = results.filter(r => r.success).length;
  const failedSteps = results.filter(r => !r.success && !r.skipped).length;
  const skippedSteps = results.filter(r => r.skipped).length;
  const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
  const averageDuration = totalDuration / totalSteps;
  
  return {
    totalSteps,
    successfulSteps,
    failedSteps,
    skippedSteps,
    successRate: (successfulSteps / totalSteps) * 100,
    totalDuration,
    averageDuration,
    bottleneckSteps: results
      .filter(r => r.duration > averageDuration * 2)
      .map(r => ({ step: r.step, duration: r.duration }))
  };
}

// Tool implementations
const tools = {
  create_workflow: async ({ name, description, steps, triggers = [], variables = {}, category = 'custom', tags = [] }) => {
    try {
      const data = loadWorkflows();
      
      // Check for existing workflow
      const existingIndex = data.workflows.findIndex(w => w.name === name);
      
      const workflow = {
        id: existingIndex >= 0 ? data.workflows[existingIndex].id : generateId(),
        name: name,
        description: description,
        steps: steps,
        triggers: triggers,
        variables: variables,
        category: category,
        tags: tags,
        created: existingIndex >= 0 ? data.workflows[existingIndex].created : new Date().toISOString(),
        modified: new Date().toISOString(),
        version: existingIndex >= 0 ? (data.workflows[existingIndex].version || 1) + 1 : 1,
        author: os.userInfo().username
      };
      
      if (existingIndex >= 0) {
        data.workflows[existingIndex] = workflow;
      } else {
        data.workflows.push(workflow);
      }
      
      data.lastUpdate = new Date().toISOString();
      saveWorkflows(data);
      
      return {
        success: true,
        message: `Workflow "${name}" ${existingIndex >= 0 ? 'updated' : 'created'} successfully`,
        workflow: workflow
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create workflow: ${error.message}`,
        name: name
      };
    }
  },

  execute_workflow: async ({ workflowName, steps, variables = {}, dryRun = false, continueOnError = false, parallel = false }) => {
    try {
      let workflowSteps;
      let workflow = null;
      
      if (workflowName) {
        const data = loadWorkflows();
        workflow = data.workflows.find(w => w.name === workflowName);
        
        if (!workflow) {
          throw new Error(`Workflow "${workflowName}" not found`);
        }
        
        workflowSteps = workflow.steps;
        // Merge workflow variables with provided variables
        variables = { ...workflow.variables, ...variables };
      } else if (steps) {
        workflowSteps = steps;
      } else {
        throw new Error('Either workflowName or steps must be provided');
      }
      
      if (dryRun) {
        return {
          success: true,
          message: 'Dry run - workflow would execute these steps:',
          steps: workflowSteps.map(step => ({
            name: step.name,
            action: step.action || step.tool,
            skill: step.skill,
            parameters: interpolateParameters(step.parameters || {}, variables)
          })),
          variables: variables
        };
      }
      
      const executionId = generateId();
      const startTime = Date.now();
      
      // Execute workflow steps
      const results = await executeWorkflowSteps(workflowSteps, {}, variables, {
        continueOnError,
        parallel,
        stopOnError: !continueOnError
      });
      
      const duration = Date.now() - startTime;
      const analysis = analyzeWorkflowPerformance(results);
      const success = analysis.failedSteps === 0;
      
      // Record execution
      recordExecution(workflowName || 'ad-hoc', executionId, workflowSteps, { success, results, analysis }, duration, variables);
      
      return {
        success: success,
        message: success ? 'Workflow executed successfully' : 'Workflow completed with errors',
        executionId: executionId,
        workflow: workflowName,
        duration: duration,
        results: results,
        analysis: analysis,
        variables: variables
      };
    } catch (error) {
      return {
        success: false,
        message: `Workflow execution failed: ${error.message}`,
        workflowName: workflowName
      };
    }
  },

  chain_commands: async ({ commands, context = {}, stopOnError = true, returnAllResults = false }) => {
    try {
      if (!commands || commands.length === 0) {
        throw new Error('No commands provided');
      }
      
      if (commands.length > MAX_CHAINS) {
        throw new Error(`Too many commands (max: ${MAX_CHAINS})`);
      }
      
      const results = [];
      let currentContext = { ...context };
      
      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        
        // Check condition if present
        if (command.condition && !evaluateCondition(command.condition, currentContext)) {
          results.push({
            success: true,
            skipped: true,
            command: i + 1,
            description: command.description,
            reason: 'Condition not met'
          });
          continue;
        }
        
        // Execute command
        const startTime = Date.now();
        let result;
        
        if (command.skill && command.tool) {
          const parameters = interpolateParameters(command.parameters || {}, currentContext);
          result = await executeSkillTool(command.skill, command.tool, parameters);
        } else {
          // Try to infer skill and tool from description
          result = {
            success: true,
            result: `Executed: ${command.description}`,
            inferred: true
          };
        }
        
        const duration = Date.now() - startTime;
        
        const commandResult = {
          success: result.success,
          command: i + 1,
          description: command.description,
          skill: command.skill,
          tool: command.tool,
          duration: duration,
          result: result.result,
          error: result.error
        };
        
        results.push(commandResult);
        
        // Pass context to next command if configured
        if (command.passContext && result.success) {
          if (command.contextMapping) {
            // Apply context mapping rules
            for (const [targetKey, sourceKey] of Object.entries(command.contextMapping)) {
              currentContext[targetKey] = result.result?.[sourceKey] || result.result;
            }
          } else {
            // Default context passing
            currentContext[`command_${i + 1}_result`] = result.result;
          }
        }
        
        // Stop on error if configured
        if (!result.success && stopOnError) {
          break;
        }
      }
      
      const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
      const successfulCommands = results.filter(r => r.success).length;
      
      return {
        success: successfulCommands === results.length,
        message: `Executed ${successfulCommands}/${results.length} commands successfully`,
        totalCommands: commands.length,
        successfulCommands: successfulCommands,
        totalDuration: totalDuration,
        results: returnAllResults ? results : results.slice(-1), // Return only last result by default
        finalContext: currentContext
      };
    } catch (error) {
      return {
        success: false,
        message: `Command chaining failed: ${error.message}`,
        commandCount: commands?.length || 0
      };
    }
  },

  workflow_conditions: async ({ conditionType, condition, thenSteps = [], elseSteps = [], loopData = [], maxIterations = 100 }) => {
    try {
      let results = [];
      
      switch (conditionType) {
        case 'if_then_else':
          const conditionMet = evaluateCondition(condition);
          const stepsToExecute = conditionMet ? thenSteps : elseSteps;
          
          if (stepsToExecute.length > 0) {
            results = await executeWorkflowSteps(stepsToExecute);
          }
          
          return {
            success: true,
            conditionType: conditionType,
            condition: condition,
            conditionMet: conditionMet,
            executedSteps: stepsToExecute.length,
            results: results
          };
          
        case 'for_each':
          if (!Array.isArray(loopData)) {
            throw new Error('loopData must be an array for for_each loops');
          }
          
          for (let i = 0; i < Math.min(loopData.length, maxIterations); i++) {
            const item = loopData[i];
            const context = { loopIndex: i, loopItem: item };
            const stepResults = await executeWorkflowSteps(thenSteps, context);
            results.push(...stepResults);
          }
          
          return {
            success: true,
            conditionType: conditionType,
            iterations: Math.min(loopData.length, maxIterations),
            results: results
          };
          
        case 'while':
          let iterations = 0;
          while (evaluateCondition(condition) && iterations < maxIterations) {
            const stepResults = await executeWorkflowSteps(thenSteps, { iteration: iterations });
            results.push(...stepResults);
            iterations++;
          }
          
          return {
            success: true,
            conditionType: conditionType,
            iterations: iterations,
            results: results
          };
          
        default:
          throw new Error(`Unknown condition type: ${conditionType}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Conditional execution failed: ${error.message}`,
        conditionType: conditionType
      };
    }
  },

  workflow_templates: async ({ action, templateName, category = 'all', customization = {} }) => {
    try {
      switch (action) {
        case 'list':
          const templates = Object.entries(WORKFLOW_TEMPLATES)
            .filter(([key, template]) => category === 'all' || template.category === category)
            .map(([key, template]) => ({
              id: key,
              name: template.name,
              description: template.description,
              category: template.category,
              steps: template.steps.length
            }));
          
          return {
            success: true,
            templates: templates,
            category: category,
            count: templates.length
          };
          
        case 'get':
          const template = WORKFLOW_TEMPLATES[templateName];
          if (!template) {
            throw new Error(`Template "${templateName}" not found`);
          }
          
          return {
            success: true,
            template: template
          };
          
        case 'install':
          const templateToInstall = WORKFLOW_TEMPLATES[templateName];
          if (!templateToInstall) {
            throw new Error(`Template "${templateName}" not found`);
          }
          
          // Customize template with user parameters
          const customizedTemplate = {
            ...templateToInstall,
            ...customization,
            id: generateId(),
            created: new Date().toISOString(),
            source: 'template'
          };
          
          // Install as workflow
          const installResult = await tools.create_workflow({
            name: customization.name || templateToInstall.name,
            description: customization.description || templateToInstall.description,
            steps: templateToInstall.steps,
            category: templateToInstall.category,
            variables: templateToInstall.variables || {}
          });
          
          return {
            success: installResult.success,
            message: installResult.success ? 
              `Template "${templateName}" installed as workflow` : 
              installResult.message,
            workflow: installResult.workflow
          };
          
        default:
          throw new Error(`Unknown template action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Template operation failed: ${error.message}`,
        action: action,
        templateName: templateName
      };
    }
  },

  learn_patterns: async ({ action, timeframe = 'week', minOccurrences = 3, includeApps = true }) => {
    try {
      switch (action) {
        case 'analyze':
          const history = loadHistory();
          
          // Filter by timeframe
          const now = new Date();
          const cutoffTime = new Date();
          switch (timeframe) {
            case 'day': cutoffTime.setDate(now.getDate() - 1); break;
            case 'week': cutoffTime.setDate(now.getDate() - 7); break;
            case 'month': cutoffTime.setMonth(now.getMonth() - 1); break;
            case 'all': cutoffTime.setFullYear(1970); break;
          }
          
          const filteredHistory = history.filter(entry => 
            new Date(entry.timestamp) >= cutoffTime
          );
          
          // Analyze patterns
          const patterns = {
            commonWorkflows: {},
            timeBasedPatterns: {},
            failurePatterns: {},
            appUsagePatterns: {}
          };
          
          filteredHistory.forEach(entry => {
            // Common workflows
            patterns.commonWorkflows[entry.workflowName] = 
              (patterns.commonWorkflows[entry.workflowName] || 0) + 1;
            
            // Time-based patterns
            const hour = new Date(entry.timestamp).getHours();
            const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
            patterns.timeBasedPatterns[timeSlot] = 
              (patterns.timeBasedPatterns[timeSlot] || 0) + 1;
            
            // Failure patterns
            if (!entry.success) {
              const failureKey = entry.result?.error || 'unknown_error';
              patterns.failurePatterns[failureKey] = 
                (patterns.failurePatterns[failureKey] || 0) + 1;
            }
          });
          
          return {
            success: true,
            timeframe: timeframe,
            totalExecutions: filteredHistory.length,
            patterns: patterns,
            insights: [
              `Most used workflow: ${Object.keys(patterns.commonWorkflows).reduce((a, b) => 
                patterns.commonWorkflows[a] > patterns.commonWorkflows[b] ? a : b, 'none')}`,
              `Peak usage time: ${Object.keys(patterns.timeBasedPatterns).reduce((a, b) => 
                patterns.timeBasedPatterns[a] > patterns.timeBasedPatterns[b] ? a : b, 'none')}`
            ]
          };
          
        case 'suggest':
          // Analyze patterns and suggest automation opportunities
          const analysisResult = await tools.learn_patterns({ 
            action: 'analyze', 
            timeframe, 
            minOccurrences 
          });
          
          if (!analysisResult.success) {
            throw new Error('Pattern analysis failed');
          }
          
          const suggestions = [];
          
          // Suggest workflows for common patterns
          Object.entries(analysisResult.patterns.commonWorkflows).forEach(([workflow, count]) => {
            if (count >= minOccurrences) {
              suggestions.push({
                type: 'optimization',
                priority: 'high',
                suggestion: `Consider optimizing "${workflow}" workflow (used ${count} times)`,
                action: 'optimize_workflow',
                target: workflow
              });
            }
          });
          
          // Suggest time-based automation
          Object.entries(analysisResult.patterns.timeBasedPatterns).forEach(([timeSlot, count]) => {
            if (count >= minOccurrences) {
              suggestions.push({
                type: 'scheduling',
                priority: 'medium',
                suggestion: `Consider scheduling workflows for ${timeSlot} (${count} executions)`,
                action: 'schedule_workflow',
                target: timeSlot
              });
            }
          });
          
          return {
            success: true,
            suggestions: suggestions,
            totalSuggestions: suggestions.length,
            analysis: analysisResult.patterns
          };
          
        default:
          throw new Error(`Unknown learning action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Pattern learning failed: ${error.message}`,
        action: action
      };
    }
  },

  optimize_workflow: async ({ workflowName, optimizationGoals = ['speed'], constraints = {}, applyOptimizations = false }) => {
    try {
      const data = loadWorkflows();
      const workflow = data.workflows.find(w => w.name === workflowName);
      
      if (!workflow) {
        throw new Error(`Workflow "${workflowName}" not found`);
      }
      
      // Analyze workflow for optimization opportunities
      const optimizations = [];
      
      // Check for parallel execution opportunities
      if (optimizationGoals.includes('speed')) {
        const parallelizable = workflow.steps.filter((step, index) => {
          // Simple heuristic: steps that don't depend on previous step outputs
          return !step.parameters || 
                 !JSON.stringify(step.parameters).includes('${');
        });
        
        if (parallelizable.length > 1) {
          optimizations.push({
            type: 'parallelization',
            description: `${parallelizable.length} steps can run in parallel`,
            impact: 'High speed improvement',
            steps: parallelizable.map(s => s.name)
          });
        }
      }
      
      // Check for redundant steps
      if (optimizationGoals.includes('maintainability')) {
        const stepActions = workflow.steps.map(s => s.action || s.tool);
        const duplicates = stepActions.filter((action, index) => 
          stepActions.indexOf(action) !== index
        );
        
        if (duplicates.length > 0) {
          optimizations.push({
            type: 'deduplication',
            description: `Found ${duplicates.length} potentially redundant steps`,
            impact: 'Improved maintainability',
            duplicates: duplicates
          });
        }
      }
      
      // Check for error handling
      if (optimizationGoals.includes('reliability')) {
        const stepsWithoutErrorHandling = workflow.steps.filter(step => 
          !step.onFailure && !step.condition
        );
        
        if (stepsWithoutErrorHandling.length > 0) {
          optimizations.push({
            type: 'error_handling',
            description: `${stepsWithoutErrorHandling.length} steps lack error handling`,
            impact: 'Improved reliability',
            steps: stepsWithoutErrorHandling.map(s => s.name)
          });
        }
      }
      
      if (applyOptimizations && optimizations.length > 0) {
        // Apply optimizations to workflow
        const optimizedSteps = [...workflow.steps];
        
        // Apply parallelization
        const parallelOpt = optimizations.find(o => o.type === 'parallelization');
        if (parallelOpt) {
          parallelOpt.steps.forEach(stepName => {
            const step = optimizedSteps.find(s => s.name === stepName);
            if (step) step.parallel = true;
          });
        }
        
        // Update workflow
        const updateResult = await tools.create_workflow({
          ...workflow,
          steps: optimizedSteps,
          version: (workflow.version || 1) + 1,
          optimized: true,
          optimizations: optimizations.map(o => o.type)
        });
        
        return {
          success: updateResult.success,
          message: `Workflow optimized with ${optimizations.length} improvements`,
          optimizations: optimizations,
          workflow: updateResult.workflow
        };
      }
      
      return {
        success: true,
        message: `Found ${optimizations.length} optimization opportunities`,
        optimizations: optimizations,
        workflow: workflow,
        applied: false
      };
    } catch (error) {
      return {
        success: false,
        message: `Workflow optimization failed: ${error.message}`,
        workflowName: workflowName
      };
    }
  },

  workflow_history: async ({ action, workflowName, timeframe = 'all', status = 'all', limit = 50, includeDetails = false }) => {
    try {
      const history = loadHistory();
      
      let filteredHistory = history;
      
      // Filter by workflow name
      if (workflowName) {
        filteredHistory = filteredHistory.filter(entry => 
          entry.workflowName === workflowName
        );
      }
      
      // Filter by timeframe
      if (timeframe !== 'all') {
        const now = new Date();
        const cutoffTime = new Date();
        
        switch (timeframe) {
          case 'hour': cutoffTime.setHours(now.getHours() - 1); break;
          case 'day': cutoffTime.setDate(now.getDate() - 1); break;
          case 'week': cutoffTime.setDate(now.getDate() - 7); break;
          case 'month': cutoffTime.setMonth(now.getMonth() - 1); break;
        }
        
        filteredHistory = filteredHistory.filter(entry => 
          new Date(entry.timestamp) >= cutoffTime
        );
      }
      
      // Filter by status
      if (status !== 'all') {
        filteredHistory = filteredHistory.filter(entry => {
          switch (status) {
            case 'success': return entry.success;
            case 'failed': return !entry.success;
            case 'partial': return entry.result.analysis?.failedSteps > 0 && entry.result.analysis?.successfulSteps > 0;
            default: return true;
          }
        });
      }
      
      // Limit results
      filteredHistory = filteredHistory.slice(0, limit);
      
      switch (action) {
        case 'list':
          const summaryHistory = filteredHistory.map(entry => ({
            id: entry.id,
            workflowName: entry.workflowName,
            timestamp: entry.timestamp,
            duration: entry.duration,
            success: entry.success,
            stepsExecuted: entry.result?.analysis?.totalSteps || 0,
            ...(includeDetails ? { steps: entry.steps, result: entry.result } : {})
          }));
          
          return {
            success: true,
            history: summaryHistory,
            totalEntries: history.length,
            filteredEntries: filteredHistory.length,
            filters: { workflowName, timeframe, status }
          };
          
        case 'analyze':
          const analysis = {
            totalExecutions: filteredHistory.length,
            successRate: (filteredHistory.filter(e => e.success).length / filteredHistory.length) * 100,
            averageDuration: filteredHistory.reduce((sum, e) => sum + e.duration, 0) / filteredHistory.length,
            mostUsedWorkflows: {},
            commonErrors: {}
          };
          
          filteredHistory.forEach(entry => {
            analysis.mostUsedWorkflows[entry.workflowName] = 
              (analysis.mostUsedWorkflows[entry.workflowName] || 0) + 1;
            
            if (!entry.success && entry.result?.error) {
              analysis.commonErrors[entry.result.error] = 
                (analysis.commonErrors[entry.result.error] || 0) + 1;
            }
          });
          
          return {
            success: true,
            analysis: analysis,
            timeframe: timeframe
          };
          
        case 'clear':
          saveHistory([]);
          return {
            success: true,
            message: 'Workflow history cleared'
          };
          
        default:
          throw new Error(`Unknown history action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `History operation failed: ${error.message}`,
        action: action
      };
    }
  },

  ai_suggestions: async ({ goal, context = {}, constraints = {}, suggestionType = 'all', learningMode = true }) => {
    try {
      const suggestions = [];
      
      // Analyze goal and context to provide relevant suggestions
      const goalWords = goal.toLowerCase().split(' ');
      const hasTimeKeyword = goalWords.some(word => 
        ['morning', 'evening', 'daily', 'weekly', 'schedule', 'routine'].includes(word)
      );
      
      const hasProductivityKeyword = goalWords.some(word => 
        ['productive', 'focus', 'work', 'task', 'organize'].includes(word)
      );
      
      const hasDevelopmentKeyword = goalWords.some(word => 
        ['code', 'project', 'development', 'programming', 'git'].includes(word)
      );
      
      // Template suggestions based on goal analysis
      if (suggestionType === 'all' || suggestionType === 'templates') {
        if (hasTimeKeyword) {
          suggestions.push({
            type: 'template',
            priority: 'high',
            title: 'Time-based Routine Template',
            description: 'Create scheduled workflows for routine tasks',
            template: 'morning_routine',
            reason: 'Goal mentions time-based activities'
          });
        }
        
        if (hasProductivityKeyword) {
          suggestions.push({
            type: 'template',
            priority: 'high',
            title: 'Productivity Workflow Template',
            description: 'Focus mode and distraction elimination',
            template: 'focus_mode',
            reason: 'Goal mentions productivity improvement'
          });
        }
        
        if (hasDevelopmentKeyword) {
          suggestions.push({
            type: 'template',
            priority: 'medium',
            title: 'Development Project Setup',
            description: 'Automate new project initialization',
            template: 'project_setup',
            reason: 'Goal mentions development activities'
          });
        }
      }
      
      // Workflow suggestions based on context
      if (suggestionType === 'all' || suggestionType === 'workflow') {
        if (context.currentApp) {
          suggestions.push({
            type: 'workflow',
            priority: 'medium',
            title: `${context.currentApp} Workflow Enhancement`,
            description: `Create workflow incorporating ${context.currentApp}`,
            steps: [
              { action: 'focus_app', app: context.currentApp },
              { action: 'arrange_windows', layout: 'optimized' }
            ],
            reason: `Currently using ${context.currentApp}`
          });
        }
        
        if (context.timeOfDay) {
          const timeBasedWorkflow = {
            morning: 'morning_routine',
            afternoon: 'focus_session',
            evening: 'end_of_day'
          };
          
          const suggestedWorkflow = timeBasedWorkflow[context.timeOfDay];
          if (suggestedWorkflow) {
            suggestions.push({
              type: 'workflow',
              priority: 'high',
              title: `${context.timeOfDay.charAt(0).toUpperCase() + context.timeOfDay.slice(1)} Workflow`,
              description: `Optimize your ${context.timeOfDay} routine`,
              workflow: suggestedWorkflow,
              reason: `Current time suggests ${context.timeOfDay} activities`
            });
          }
        }
      }
      
      // Optimization suggestions
      if (suggestionType === 'all' || suggestionType === 'optimization') {
        if (learningMode) {
          const patternAnalysis = await tools.learn_patterns({ action: 'suggest', timeframe: 'week' });
          
          if (patternAnalysis.success && patternAnalysis.suggestions) {
            suggestions.push(...patternAnalysis.suggestions.map(s => ({
              ...s,
              type: 'optimization',
              reason: 'Based on your usage patterns'
            })));
          }
        }
      }
      
      // Apply constraints
      let filteredSuggestions = suggestions;
      
      if (constraints.maxSteps) {
        filteredSuggestions = filteredSuggestions.filter(s => 
          !s.steps || s.steps.length <= constraints.maxSteps
        );
      }
      
      if (constraints.preferredSkills && constraints.preferredSkills.length > 0) {
        filteredSuggestions = filteredSuggestions.filter(s => 
          !s.skills || s.skills.some(skill => constraints.preferredSkills.includes(skill))
        );
      }
      
      if (constraints.excludeSkills && constraints.excludeSkills.length > 0) {
        filteredSuggestions = filteredSuggestions.filter(s => 
          !s.skills || !s.skills.some(skill => constraints.excludeSkills.includes(skill))
        );
      }
      
      // Sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      filteredSuggestions.sort((a, b) => 
        (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      );
      
      return {
        success: true,
        goal: goal,
        suggestions: filteredSuggestions,
        totalSuggestions: filteredSuggestions.length,
        context: context,
        constraints: constraints
      };
    } catch (error) {
      return {
        success: false,
        message: `AI suggestions failed: ${error.message}`,
        goal: goal
      };
    }
  },

  schedule_workflow: async ({ workflowName, scheduleType, scheduleTime, timezone, enabled = true, maxRuns, variables = {} }) => {
    try {
      // Mock implementation - in production would integrate with system scheduler
      return {
        success: true,
        message: `Workflow "${workflowName}" scheduled for ${scheduleType} at ${scheduleTime}`,
        schedule: { workflowName, scheduleType, scheduleTime, enabled }
      };
    } catch (error) {
      return {
        success: false,
        message: `Scheduling failed: ${error.message}`
      };
    }
  },

  workflow_variables: async ({ action, variableName, value, transformation, scope = 'workflow' }) => {
    try {
      // Mock implementation for variable management
      return {
        success: true,
        message: `Variable operation "${action}" completed`,
        action, variableName, value, scope
      };
    } catch (error) {
      return {
        success: false,
        message: `Variable operation failed: ${error.message}`
      };
    }
  },

  workflow_sharing: async ({ action, workflowName, filePath, format = 'json', includeHistory = false, validateOnly = false }) => {
    try {
      // Mock implementation for workflow sharing
      return {
        success: true,
        message: `Workflow sharing "${action}" completed`,
        action, workflowName, format
      };
    } catch (error) {
      return {
        success: false,
        message: `Workflow sharing failed: ${error.message}`
      };
    }
  },

  workflow_debugging: async ({ workflowName, executionId, debugLevel = 'detailed', focusArea = 'all', provideFixes = true }) => {
    try {
      // Mock implementation for workflow debugging
      return {
        success: true,
        message: `Debug analysis completed for "${workflowName}"`,
        workflowName, debugLevel, focusArea,
        analysis: { issues: [], recommendations: [] }
      };
    } catch (error) {
      return {
        success: false,
        message: `Workflow debugging failed: ${error.message}`
      };
    }
  }
};

module.exports = { tools };