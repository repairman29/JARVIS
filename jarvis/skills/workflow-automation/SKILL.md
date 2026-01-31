# Workflow Automation — Intelligent Task Orchestration

Use this skill for **workflow creation**, **command chaining**, **task automation**, **conditional logic**, and **AI-powered process optimization**. This is the intelligence layer that makes JARVIS truly smart by orchestrating all other skills into powerful, reusable workflows that adapt to your needs.

## Setup

1. Install the skill: `clawdbot skills install ./skills/workflow-automation` or copy to `~/jarvis/skills/workflow-automation`.
2. **Environment variables** (optional):
   - `JARVIS_WORKFLOW_MAX_CHAINS` - Maximum commands in a chain (default 50)
   - `JARVIS_WORKFLOW_TIMEOUT` - Workflow timeout in seconds (default 300)
   - `JARVIS_WORKFLOW_LEARNING_ENABLED` - Enable pattern learning (true/false)
3. **Dependencies**: No additional dependencies - integrates with all JARVIS skills
4. Restart gateway: `clawdbot gateway restart`

## When to use

- **Create workflows**: "create workflow for my morning routine", "automate project setup"
- **Chain commands**: "find React files, open in VS Code, and arrange windows"  
- **Automate repetition**: "I keep doing the same steps, can you automate this?"
- **Schedule tasks**: "run my backup workflow every evening at 6pm"
- **Conditional logic**: "if it's a workday, open work apps, otherwise open personal apps"
- **Learn patterns**: "suggest workflows based on what I do most"
- **Optimize processes**: "make my development workflow faster"

## Tools

| Tool | Use for |
|------|---------|
| `create_workflow` | Create reusable workflows from natural language |
| `execute_workflow` | Run saved workflows or ad-hoc command chains |
| `chain_commands` | Chain multiple commands with context passing |
| `workflow_conditions` | Add if/then/else logic and loops |
| `schedule_workflow` | Schedule workflows for automatic execution |
| `workflow_templates` | Use pre-built workflow patterns |
| `learn_patterns` | AI analysis of user behavior for automation suggestions |
| `optimize_workflow` | AI-powered workflow performance optimization |
| `workflow_variables` | Manage data flow between commands |
| `workflow_history` | Track and analyze workflow executions |
| `ai_suggestions` | Get intelligent workflow recommendations |

## Examples

### Simple Command Chaining
- **"Find my React project, open it in VS Code, and snap the window to the left half"**
  ```
  Chain: file_search → launcher → window_manager
  Context passing: project path → VS Code → window positioning
  ```

### Morning Routine Workflow
- **"Create my morning workflow: check calendar, open work apps, arrange windows"**
  ```
  Steps:
  1. Get today's calendar events
  2. Launch work applications (Slack, VS Code, Chrome)
  3. Arrange windows in development layout
  4. Show today's tasks and meetings
  ```

### Conditional Workflows
- **"If it's Monday, open weekly planning workspace, otherwise open daily workspace"**
  ```
  Condition: dayOfWeek === 'Monday'
  Then: Execute weekly_planning_workflow  
  Else: Execute daily_workspace_workflow
  ```

### Project Setup Automation
- **"Automate new React project setup"**
  ```
  Workflow:
  1. Create project directory
  2. Initialize git repository
  3. Install dependencies (npm/yarn)
  4. Open in VS Code
  5. Create initial file structure
  6. Arrange development windows
  ```

### Data Processing Pipeline
- **"When I copy a CSV file, automatically analyze it and create a summary"**
  ```
  Trigger: clipboard contains .csv file
  Pipeline: clipboard → file_operations → calculator (statistics) → snippets (report)
  ```

## Advanced Workflow Features

### Natural Language Workflow Creation
JARVIS understands complex workflow descriptions:

**"Every morning at 9am, check my calendar, open my work apps based on my meetings, and arrange them. If I have no meetings, focus on deep work setup."**

Becomes:
```yaml
name: smart_morning_routine
triggers:
  - type: time
    value: "09:00"
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"]
steps:
  - name: check_calendar
    action: get_calendar_events
    parameters: { date: "today" }
  - name: conditional_setup
    condition: "calendar_events.length > 0"
    then:
      - launch_meeting_apps
      - arrange_communication_layout
    else:
      - launch_focus_apps
      - arrange_deep_work_layout
```

### Intelligent Context Passing
Variables and data flow between steps:
- **File path** from search → **App launching** → **Window management**
- **Calendar data** → **App selection** → **Notification settings**
- **Calculation results** → **Clipboard** → **Email composition**
- **Error states** → **Retry logic** → **Fallback actions**

### Conditional Logic & Branching

**If/Then/Else Workflows**:
```
IF current_time > 18:00 AND day_of_week != weekend
  THEN execute evening_work_cleanup
  ELSE execute regular_shutdown
```

**Switch-Based Logic**:
```
SWITCH project_type
  CASE "react": setup_react_environment
  CASE "python": setup_python_environment  
  CASE "nodejs": setup_node_environment
  DEFAULT: setup_generic_environment
```

**Loop Processing**:
```
FOR EACH file IN selected_files
  IF file.extension == ".md"
    THEN process_markdown(file)
  ELSE skip_file(file)
```

### Smart Scheduling

**Time-Based Triggers**:
- **"Every weekday at 8am"** → Daily standup preparation
- **"First Monday of each month"** → Monthly report generation
- **"30 minutes before any meeting"** → Meeting preparation workflow

**Event-Based Triggers**:
- **"When I plug in external monitor"** → Dual-display workspace setup
- **"When battery is low"** → Power-saving workflow activation
- **"When I open a new project"** → Project initialization workflow

**Conditional Triggers**:
- **"If it's raining, remind me to bring an umbrella"** → Weather-based workflows
- **"When my focus app blocks social media"** → Deep work environment activation

## Pre-Built Workflow Templates

### Productivity Templates

**Morning Routine**:
```
1. Check weather and calendar
2. Open apps based on day's schedule
3. Arrange workspace layout
4. Show daily priorities
```

**End of Day Cleanup**:
```
1. Save all open documents
2. Close unnecessary apps
3. Clear downloads folder
4. Update time tracking
5. Schedule tomorrow's priorities
```

**Deep Work Session**:
```
1. Enable focus mode (block distractions)
2. Close communication apps
3. Arrange single-window layout
4. Start timer for work session
5. Queue relaxing background music
```

### Development Templates

**New Project Setup**:
```
1. Create project directory structure
2. Initialize version control
3. Set up development environment
4. Install dependencies
5. Open IDE with project
6. Create initial documentation
```

**Code Review Workflow**:
```
1. Pull latest changes from repository
2. Open files to review
3. Launch comparison tools
4. Open team communication
5. Prepare review checklist
```

**Deployment Pipeline**:
```
1. Run tests and linting
2. Build production version
3. Create deployment package
4. Upload to staging
5. Run integration tests
6. Deploy to production (with approval)
```

### Communication Templates

**Meeting Preparation**:
```
1. Get meeting agenda and attendees
2. Open relevant documents
3. Launch communication tools
4. Set status to "in meeting"
5. Start meeting recorder
```

**Email Processing**:
```
1. Sort emails by priority
2. Process quick responses
3. Schedule complex emails for later
4. File important emails
5. Clear inbox
```

## AI-Powered Features

### Pattern Learning & Suggestions

JARVIS learns from your behavior and suggests automations:

**"I notice you always open these three apps together. Would you like me to create a workflow?"**

**"You've searched for React projects 5 times this week and opened them in VS Code. Should I automate this?"**

**"Your window arrangement is consistent when coding. Let me create a development workspace workflow."**

### Workflow Optimization

AI analyzes workflows for improvements:
- **Performance**: Parallel execution of independent steps
- **Reliability**: Add error handling and retry logic
- **User Experience**: Reduce waiting time with better sequencing
- **Resource Usage**: Optimize memory and CPU usage

### Context-Aware Suggestions

JARVIS provides intelligent suggestions based on:
- **Time of day**: Different workflows for morning vs evening
- **Day of week**: Work vs personal workflow suggestions
- **Current apps**: Suggest related workflow completions
- **Project context**: Project-specific automation recommendations

### Smart Error Handling

Workflows include intelligent error recovery:
```
TRY launch_primary_app
CATCH AppNotFoundError
  TRY launch_alternative_app
  CATCH AnyError
    NOTIFY user and suggest manual intervention
```

## Integration with All JARVIS Skills

### Seamless Skill Orchestration

**File Search + Launcher + Window Manager**:
```
"Find my presentation, open it in Keynote, arrange for presentation mode"
→ file_search.search_files → launcher.launch_app → window_manager.maximize
```

**Clipboard + Calculator + Snippets**:
```  
"Calculate 15% tip on clipboard amount and create receipt snippet"
→ clipboard.get_current → calculator.calculate → snippets.create_snippet
```

**Calendar + Communication + Focus**:
```
"Based on my calendar, set up appropriate workspace and communication status"
→ calendar.get_events → launcher.selective_apps → communication.set_status
```

### Cross-Skill Variable Passing

Variables flow naturally between skills:
```yaml
workflow:
  - file_search: 
      query: "React project"
      output: project_path
  - launcher:
      app: "VS Code" 
      target: ${project_path}
      output: window_id
  - window_manager:
      action: "snap_left"
      window: ${window_id}
```

## Workflow Management

### Version Control for Workflows
- **Track changes**: See workflow evolution over time
- **Rollback**: Restore previous working versions
- **Branching**: Test workflow modifications safely
- **Merge**: Combine workflow improvements

### Collaborative Workflow Development
- **Export/Import**: Share workflows with team members
- **Templates**: Create organization-wide workflow standards
- **Community Sharing**: Access public workflow library
- **Fork & Customize**: Adapt shared workflows to your needs

### Workflow Analytics
- **Success rates**: Track workflow reliability over time
- **Performance metrics**: Execution time and resource usage
- **Usage patterns**: Most and least used workflows
- **Optimization opportunities**: AI-suggested improvements

## Security & Safety

### Execution Safeguards
- **Timeout protection**: Workflows can't run indefinitely
- **Resource limits**: CPU and memory usage boundaries
- **Confirmation prompts**: For destructive operations
- **Sandbox execution**: Isolated workflow environments

### Permission Management
- **Skill-level permissions**: Control which skills workflows can access
- **File system boundaries**: Restrict file operation scope
- **Network access**: Control external API and service access
- **User confirmation**: Required for sensitive operations

### Audit & Logging
- **Execution logs**: Detailed workflow step tracking
- **Security events**: Unauthorized access attempts
- **Performance monitoring**: Resource usage tracking
- **Error reporting**: Comprehensive failure analysis

## Natural Language Examples

### Conversational Workflow Creation

**User**: "I want to automate my end-of-day routine"
**JARVIS**: "I can help you create an end-of-day workflow. What steps do you usually do?"

**User**: "I save my work, close apps, check tomorrow's calendar, and set up for morning"
**JARVIS**: "Perfect! I'll create a workflow that: 1) Saves all open documents, 2) Closes work applications, 3) Shows tomorrow's calendar, 4) Prepares your morning workspace. Should I also include backing up important files?"

### Intelligent Workflow Adaptation

**User**: "My morning routine isn't working well"
**JARVIS**: "I analyzed your morning workflow. I notice it takes 3 minutes to launch apps sequentially. I can optimize it to run in parallel and reduce the time to 45 seconds. Would you like me to update it?"

**User**: "Make my development workflow faster"
**JARVIS**: "I found several optimizations: 1) Preload VS Code with your most-used projects, 2) Cache file search results, 3) Auto-arrange windows based on project type. This should reduce setup time by 60%. Shall I implement these changes?"

## Performance & Scalability

### Efficient Execution
- **Parallel processing**: Independent steps run simultaneously
- **Smart caching**: Reuse results when possible
- **Resource pooling**: Share resources across workflows
- **Lazy loading**: Load only required components

### Scalability Features
- **Distributed execution**: Run workflows across multiple cores
- **Queue management**: Handle multiple workflows efficiently
- **Priority scheduling**: Critical workflows get precedence
- **Load balancing**: Distribute workflow execution load

## Troubleshooting & Debugging

### Workflow Debugging
- **Step-by-step execution**: Pause and inspect at each step
- **Variable inspection**: View data flow between steps
- **Execution visualization**: See workflow progress graphically
- **Error diagnosis**: AI-powered error analysis and suggestions

### Common Issues & Solutions

**Workflow times out**:
- Increase timeout limit for complex workflows
- Break large workflows into smaller ones
- Optimize slow steps or run them in parallel

**Variables not passing correctly**:
- Check variable naming consistency
- Verify data type compatibility
- Use data transformation tools when needed

**Conditional logic not working**:
- Validate condition syntax
- Test with known values
- Check for type conversion issues

## Comparison with Traditional Automation

| Feature | Traditional Scripts | Raycast | JARVIS Workflows |
|---------|-------------------|---------|------------------|
| **Natural Language** | No | Limited | Full conversation |
| **Visual Creation** | No | Basic | AI-assisted creation |
| **Error Handling** | Manual | Basic | Intelligent recovery |
| **Context Awareness** | No | No | Full context understanding |
| **Learning** | No | No | AI pattern recognition |
| **Cross-App Integration** | Complex | Limited | Seamless |
| **Debugging** | Difficult | Basic | Advanced tools |
| **Sharing** | File-based | No | Community ecosystem |
| **Optimization** | Manual | No | AI-powered |

## Getting Started Examples

### 1. Simple Command Chain
**"Find my presentation and open it"**
```
Commands: file_search → launcher
Result: Automatic file discovery and app launching
```

### 2. Morning Routine  
**"Create workflow: check calendar, open work apps, arrange windows"**
```
Workflow: calendar → launcher → window_manager
Triggers: Daily at 9am on weekdays
```

### 3. Project Setup
**"Automate React project creation"**
```
Steps: directory creation → git init → npm install → VS Code launch
Variables: project_name, template_type
```

### 4. Smart Scheduling
**"Every Friday at 5pm, save work and prepare weekend workspace"**
```
Schedule: Weekly trigger
Actions: save_all → close_work_apps → open_personal_apps
```

This skill transforms JARVIS into the most intelligent automation system available, going far beyond simple command launchers to provide true AI-powered workflow orchestration that learns, adapts, and optimizes your productivity automatically.