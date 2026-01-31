# Voice Control — Hands-Free JARVIS Operation

Use this skill for **voice activation**, **hands-free control**, **accessibility features**, and **voice-powered automation**. Transform JARVIS into a truly conversational AI assistant with natural voice interaction and intelligent speech processing.

## Setup

1. Install the skill: `clawdbot skills install ./skills/voice-control` or copy to `~/jarvis/skills/voice-control`.
2. **Environment variables** (optional):
   - `JARVIS_VOICE_WAKE_WORD` - Custom wake word (default "Hey JARVIS")
   - `JARVIS_VOICE_ENABLED` - Enable voice control (true/false)
   - `JARVIS_VOICE_LANGUAGE` - Speech recognition language (default "en-US")
   - `JARVIS_VOICE_CONFIDENCE_THRESHOLD` - Recognition confidence threshold (default 0.7)
3. **Microphone permissions**: Grant microphone access when prompted
4. **Platform setup**:
   - **macOS**: Built-in speech recognition (no additional setup)
   - **Linux**: Install `espeak` or `festival` for voice feedback
   - **Windows**: PowerShell speech synthesis (built-in)
5. Restart gateway: `clawdbot gateway restart`

## When to use

- **Voice activation**: "Hey JARVIS, launch Chrome", "JARVIS, what time is it?"
- **Hands-free operation**: Perfect for cooking, exercising, or when hands are busy
- **Accessibility**: Voice control for users with mobility limitations
- **Workflow automation**: "JARVIS, start my morning routine", "JARVIS, set up coding workspace"
- **Quick commands**: "JARVIS, take screenshot", "JARVIS, calculate 15% of 240"
- **Training**: "Train my voice", "improve wake word recognition"

## Tools

| Tool | Use for |
|------|---------|
| `start_voice_recognition` | Enable continuous voice listening with wake word |
| `stop_voice_recognition` | Disable voice control and save session data |
| `voice_command` | Process voice command directly (testing/manual) |
| `configure_voice` | Adjust voice recognition settings and preferences |
| `voice_training` | Train recognition for better accuracy |
| `voice_feedback` | Configure JARVIS voice responses |
| `voice_shortcuts` | Create custom voice shortcuts for common tasks |
| `voice_accessibility` | Enable accessibility features and alternatives |
| `voice_analytics` | Analyze voice usage and optimize accuracy |
| `voice_status` | Check voice system status and microphone |

## Examples

### Basic Voice Control
- **"Hey JARVIS, launch Chrome"** → Opens Google Chrome
- **"JARVIS, what's 15% of 240?"** → Calculates and speaks result
- **"Hey JARVIS, take a screenshot"** → Captures screen and confirms
- **"JARVIS, find my React project"** → Searches files and reports results

### Voice Activation Setup
- **"Start voice recognition"** → `start_voice_recognition({})`
- **"Enable voice control with custom wake word"** → `start_voice_recognition({ wakeWord: "Computer" })`
- **"Stop listening for voice commands"** → `stop_voice_recognition({ saveSession: true })`

### Voice Configuration
- **"Change wake word to 'Computer'"** → `configure_voice({ setting: "wake_word", value: "Computer" })`
- **"Set voice language to Spanish"** → `configure_voice({ setting: "language", value: "es-ES" })`
- **"Increase voice confidence threshold"** → `configure_voice({ setting: "confidence", value: "0.8" })`

### Voice Shortcuts
- **"Create shortcut: 'focus time' runs focus mode"** → `voice_shortcuts({ action: "create", phrase: "focus time", command: "enable focus mode", skill: "workflow-automation" })`
- **"List my voice shortcuts"** → `voice_shortcuts({ action: "list" })`
- **"Test shortcut 'open mail'"** → `voice_shortcuts({ action: "test", phrase: "open mail" })`

### Voice Training
- **"Train my wake word recognition"** → `voice_training({ trainingType: "wake_word", iterations: 5 })`
- **"Improve command recognition"** → `voice_training({ trainingType: "common_commands" })`
- **"Train custom vocabulary"** → `voice_training({ trainingType: "custom_vocabulary", customWords: ["Kubernetes", "PostgreSQL"] })`

## Advanced Features

### Natural Wake Word Detection
- **Multiple Wake Phrases**: "Hey JARVIS", "JARVIS", "Computer"
- **Context Awareness**: Different sensitivity based on environment noise
- **False Positive Reduction**: Ignores wake words in media playback
- **Customizable Sensitivity**: Adjust for different speaking styles

### Intelligent Speech Processing
- **Noise Cancellation**: Filters background noise and interruptions
- **Accent Adaptation**: Learns user's accent and speech patterns
- **Command Context**: Understands follow-up commands and references
- **Error Recovery**: "I didn't catch that" with helpful suggestions

### Voice Feedback System
- **Natural Responses**: JARVIS speaks in conversational tone
- **Contextual Confirmations**: Different responses based on action success
- **Emotional Intelligence**: Adapts tone based on command urgency
- **Multilingual Support**: Responds in user's preferred language

### Accessibility Features
- **Quiet Mode**: Optimized for whispered commands
- **Noise Tolerance**: Works in noisy environments
- **Speech Impediment Support**: Enhanced recognition for speech differences
- **Visual Feedback**: Screen indicators supplement voice feedback
- **Alternative Input**: Keyboard shortcuts, eye tracking, gesture control

## Natural Language Examples

### Conversational Commands
**Natural Speech** → **JARVIS Action**
- "Hey JARVIS, I need to focus" → Enables focus mode, closes distractions
- "JARVIS, set up for the presentation" → Maximizes presentation app, adjusts display
- "JARVIS, find that file about React hooks" → Searches with context understanding
- "JARVIS, what's my schedule looking like?" → Checks calendar and reports meetings

### Follow-up Conversations
**Initial**: "Hey JARVIS, find my project files"
**JARVIS**: "I found 15 React project files. Would you like me to open the most recent?"
**Follow-up**: "Yes, and snap it to the left side"
**JARVIS**: "Opening ProjectName in VS Code and snapping to left half"

### Complex Workflow Voice Commands
- **"JARVIS, start my coding session"**
  - Runs saved coding workflow
  - Opens development apps
  - Arranges workspace windows
  - Starts focus timer
  - Provides session summary

- **"JARVIS, prepare for the client meeting"**
  - Finds meeting agenda and materials
  - Opens presentation software
  - Adjusts screen brightness and audio
  - Sets status to "In Meeting"
  - Mutes non-essential notifications

### Error Handling & Recovery
**User**: "Hey JARVIS, lunch my browser"
**JARVIS**: "I think you meant 'launch my browser'. Opening Chrome now."

**User**: "JARVIS, do that thing with the windows"
**JARVIS**: "I'm not sure which window operation you meant. You can say 'snap windows', 'maximize', 'arrange for coding', or 'restore workspace'. Which would you like?"

## Voice Shortcuts & Automation

### Pre-Built Voice Shortcuts
```javascript
Built-in shortcuts:
- "open chrome" → launches Google Chrome
- "take screenshot" → captures screen
- "what's the time" → speaks current time
- "focus mode" → enables focus workflow
- "end of day" → runs cleanup workflow
- "morning routine" → executes morning workflow
- "coding setup" → arranges development workspace
```

### Custom Shortcut Creation
```javascript
Examples:
- "design time" → opens Figma + arranges design workspace
- "email check" → opens mail + shows unread count
- "music focus" → starts focus playlist + enables DND
- "standup prep" → gathers yesterday's work + today's plan
```

### Workflow Voice Integration
```javascript
Voice triggers for saved workflows:
- "JARVIS, execute morning routine"
- "JARVIS, run project setup for React app"  
- "JARVIS, start deep work session"
- "JARVIS, prepare for video call"
```

## Platform Support

### macOS (Full Support)
- **Built-in Speech Recognition**: Uses Apple's speech framework
- **Voice Synthesis**: High-quality text-to-speech with multiple voices
- **Accessibility**: Full integration with macOS accessibility features
- **Microphone Control**: Fine-grained audio input management

### Linux (Good Support)
- **Speech Recognition**: Works with available speech engines
- **Voice Synthesis**: espeak, festival, or flite for TTS
- **Accessibility**: Integration with desktop accessibility frameworks
- **Package Dependencies**: Automatic installation of required packages

### Windows (Basic Support)
- **Windows Speech Platform**: Built-in speech recognition API
- **SAPI Voice Synthesis**: Windows text-to-speech system
- **Accessibility**: Windows accessibility API integration
- **PowerShell Integration**: Enhanced system control through voice

## Privacy & Security

### Local-First Processing
- **On-Device Recognition**: Speech processed locally when possible
- **No Cloud Dependencies**: Core functionality works offline
- **Data Minimization**: Only essential voice data stored locally
- **Automatic Cleanup**: Voice data auto-deleted after configured period

### Privacy Controls
- **Privacy Mode**: Disables voice data logging and analytics
- **Selective Recording**: Choose which commands to save for improvement
- **Data Transparency**: Clear reporting on what voice data is stored
- **Easy Deletion**: One-command removal of all voice history

### Security Features
- **Voice Authentication**: Optional user voice verification
- **Command Confirmation**: Require confirmation for sensitive operations
- **Access Controls**: Limit which skills voice commands can access
- **Audit Logging**: Track all voice-activated system changes

## Performance Optimization

### Efficient Recognition
- **Low CPU Usage**: Optimized for continuous background operation
- **Fast Wake Word**: Sub-second wake word detection
- **Smart Listening**: Adaptive noise filtering and sensitivity
- **Battery Optimization**: Minimal impact on laptop battery life

### Recognition Accuracy
- **Adaptive Learning**: Improves accuracy over time with usage
- **Context Awareness**: Uses current app and activity for better recognition
- **Custom Vocabulary**: Learns project names, app names, and personal terms
- **Error Correction**: Suggests corrections for misrecognized commands

## Integration with Other Skills

### Seamless Cross-Skill Operation
**Voice + Launcher**: "JARVIS, launch VS Code and Chrome"
**Voice + Window Manager**: "JARVIS, arrange windows for presentation"
**Voice + File Search**: "JARVIS, find my design files and open them"
**Voice + Calculator**: "JARVIS, what's the square root of 144?"
**Voice + Workflow**: "JARVIS, run my morning routine"

### Contextual Understanding
**Smart Defaults**: "JARVIS, open my project" → finds current project context
**Reference Resolution**: "JARVIS, snap it left" → references active window
**Multi-Step Commands**: "JARVIS, find React files, open in VS Code, and snap left"

## Troubleshooting

### Common Issues

**Voice not recognized**:
- Check microphone permissions in system settings
- Verify microphone is working in other applications
- Train wake word for better accuracy: "train my wake word"
- Adjust confidence threshold: "lower voice confidence threshold"

**Wake word not detected**:
- Ensure microphone is not muted
- Check for background noise interference
- Retrain wake word recognition
- Try alternative wake word: "change wake word to Computer"

**Commands misunderstood**:
- Speak clearly and at moderate pace
- Use training mode to improve accuracy
- Create voice shortcuts for frequently misrecognized phrases
- Check language settings match your accent

### Performance Tips

1. **Regular training** improves recognition accuracy significantly
2. **Quiet environment** for initial setup and training
3. **Consistent microphone** placement and distance
4. **Custom shortcuts** for complex or frequently used commands
5. **Voice feedback** helps confirm command recognition

## Comparison with Voice Assistants

| Feature | Siri | Google Assistant | Alexa | JARVIS Voice Control |
|---------|------|------------------|-------|---------------------|
| **Wake Word** | "Hey Siri" | "OK Google" | "Alexa" | Customizable |
| **Productivity** | Basic | Limited | Basic | Advanced workflows |
| **Privacy** | Cloud + device | Cloud-based | Cloud-based | Local-first |
| **Customization** | Minimal | Some | Limited | Extensive |
| **App Integration** | iOS only | Google services | Amazon services | All productivity apps |
| **Workflow Support** | Basic shortcuts | Simple routines | Basic routines | AI-powered automation |
| **Learning** | Limited | Good | Good | Advanced pattern recognition |
| **Developer API** | Limited | Good | Good | Full open platform |

## Advanced Voice Workflows

### Morning Routine Example
**User**: "Hey JARVIS, good morning"
**JARVIS**: "Good morning! I see you have 3 meetings today. Would you like me to set up your workspace for a meeting-heavy day?"
**User**: "Yes, and also check my calendar"
**JARVIS**: "Setting up communication-focused workspace and displaying today's schedule. You have a team standup at 9am, client call at 2pm, and project review at 4pm. I've opened Slack, Zoom, and your presentation materials."

### Development Session
**User**: "JARVIS, coding time"  
**JARVIS**: "Starting your development environment. Opening VS Code with your React project, arranging windows, starting development server, and enabling focus mode. Say 'JARVIS stop' when you need a break."

### Accessibility Use Case
**User**: [Whispered] "JARVIS, quiet mode"
**JARVIS**: [Quietly] "Quiet mode enabled. I'll listen for whispered commands and respond at low volume."
**User**: [Whispered] "Open my email"
**JARVIS**: [Quietly] "Opening Mail app silently"

This skill transforms JARVIS into a truly hands-free, voice-controlled productivity system that understands natural speech and provides intelligent voice interaction for the complete JARVIS ecosystem.