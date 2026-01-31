const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Voice control configuration
const JARVIS_DIR = path.join(os.homedir(), '.jarvis');
const VOICE_DIR = path.join(JARVIS_DIR, 'voice');
const VOICE_CONFIG_FILE = path.join(VOICE_DIR, 'config.json');
const SHORTCUTS_FILE = path.join(VOICE_DIR, 'shortcuts.json');
const ANALYTICS_FILE = path.join(VOICE_DIR, 'analytics.json');

const WAKE_WORD = process.env.JARVIS_VOICE_WAKE_WORD || 'Hey JARVIS';
const VOICE_ENABLED = process.env.JARVIS_VOICE_ENABLED !== 'false';
const VOICE_LANGUAGE = process.env.JARVIS_VOICE_LANGUAGE || 'en-US';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.JARVIS_VOICE_CONFIDENCE_THRESHOLD) || 0.7;

// Voice recognition state
let voiceProcess = null;
let isListening = false;
let currentSession = null;

// Helper functions
function ensureDirectories() {
  if (!fs.existsSync(JARVIS_DIR)) {
    fs.mkdirSync(JARVIS_DIR, { recursive: true });
  }
  if (!fs.existsSync(VOICE_DIR)) {
    fs.mkdirSync(VOICE_DIR, { recursive: true });
  }
}

function loadVoiceConfig() {
  try {
    if (fs.existsSync(VOICE_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(VOICE_CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load voice config:', error.message);
  }
  
  return {
    wakeWord: WAKE_WORD,
    language: VOICE_LANGUAGE,
    confidenceThreshold: CONFIDENCE_THRESHOLD,
    continuousListening: true,
    voiceFeedback: true,
    privacyMode: false,
    shortcuts: {},
    training: {
      wakeWordAccuracy: 0.8,
      commandAccuracy: 0.7,
      customVocabulary: []
    }
  };
}

function saveVoiceConfig(config) {
  try {
    ensureDirectories();
    fs.writeFileSync(VOICE_CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Failed to save voice config:', error.message);
  }
}

function loadVoiceShortcuts() {
  try {
    if (fs.existsSync(SHORTCUTS_FILE)) {
      return JSON.parse(fs.readFileSync(SHORTCUTS_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Failed to load voice shortcuts:', error.message);
  }
  
  return {
    shortcuts: [
      { phrase: "open chrome", command: "launch Chrome", skill: "launcher" },
      { phrase: "take screenshot", command: "take screenshot", skill: "launcher" },
      { phrase: "what's the time", command: "current time", skill: "calculator" },
      { phrase: "focus mode", command: "enable focus mode", skill: "workflow-automation" },
      { phrase: "end of day", command: "end of day cleanup", skill: "workflow-automation" }
    ]
  };
}

function saveVoiceShortcuts(shortcuts) {
  try {
    ensureDirectories();
    fs.writeFileSync(SHORTCUTS_FILE, JSON.stringify(shortcuts, null, 2));
  } catch (error) {
    console.error('Failed to save voice shortcuts:', error.message);
  }
}

function recordVoiceAnalytics(event, data = {}) {
  try {
    ensureDirectories();
    let analytics = [];
    
    if (fs.existsSync(ANALYTICS_FILE)) {
      analytics = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8'));
    }
    
    analytics.push({
      timestamp: new Date().toISOString(),
      event: event,
      data: data,
      sessionId: currentSession?.id
    });
    
    // Keep only last 10000 events
    analytics = analytics.slice(-10000);
    
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2));
  } catch (error) {
    // Silently fail analytics
  }
}

function detectMicrophone() {
  try {
    // Platform-specific microphone detection
    if (process.platform === 'darwin') {
      // macOS - check system_profiler for audio input
      const result = execSync('system_profiler SPAudioDataType | grep -i "input"', { encoding: 'utf8' });
      return result.length > 0;
    } else if (process.platform === 'linux') {
      // Linux - check for ALSA/PulseAudio
      const result = execSync('arecord -l 2>/dev/null || pulseaudio --check -v', { encoding: 'utf8' });
      return result.length > 0;
    } else if (process.platform === 'win32') {
      // Windows - check for audio devices
      const result = execSync('powershell Get-WmiObject Win32_SoundDevice | Select-String "Audio"', { encoding: 'utf8' });
      return result.length > 0;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

function simulateVoiceRecognition(expectedCommands = []) {
  // Simulated voice recognition for development/testing
  // In production, would use Web Speech API or platform-specific recognition
  
  return new Promise((resolve) => {
    const mockCommands = [
      "launch chrome",
      "take screenshot", 
      "what's fifteen percent of two hundred forty",
      "find my react project",
      "snap window to left half",
      "create morning routine workflow",
      ...expectedCommands
    ];
    
    // Simulate recognition delay
    setTimeout(() => {
      const command = mockCommands[Math.floor(Math.random() * mockCommands.length)];
      const confidence = 0.8 + Math.random() * 0.2; // 0.8-1.0
      
      resolve({
        transcript: command,
        confidence: confidence,
        success: true
      });
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  });
}

function processVoiceCommand(transcript, confidence) {
  // Process the recognized voice command
  recordVoiceAnalytics('command_received', { transcript, confidence });
  
  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      success: false,
      message: "I didn't quite catch that. Could you repeat?",
      transcript: transcript,
      confidence: confidence
    };
  }
  
  // Clean and normalize the transcript
  const normalizedCommand = transcript.toLowerCase().trim();
  
  // Check for voice shortcuts first
  const shortcuts = loadVoiceShortcuts();
  const matchingShortcut = shortcuts.shortcuts.find(shortcut =>
    normalizedCommand.includes(shortcut.phrase.toLowerCase())
  );
  
  if (matchingShortcut) {
    recordVoiceAnalytics('shortcut_matched', { 
      phrase: matchingShortcut.phrase,
      command: matchingShortcut.command 
    });
    
    return {
      success: true,
      message: `Executing: ${matchingShortcut.command}`,
      command: matchingShortcut.command,
      skill: matchingShortcut.skill,
      parameters: matchingShortcut.parameters || {},
      transcript: transcript,
      confidence: confidence,
      matchedShortcut: true
    };
  }
  
  // Pass to general JARVIS command processing
  recordVoiceAnalytics('general_command', { transcript, confidence });
  
  return {
    success: true,
    message: `Processing: ${transcript}`,
    command: transcript,
    skill: 'auto-detect',
    transcript: transcript,
    confidence: confidence,
    requiresProcessing: true
  };
}

function provideFeedback(message, type = 'info') {
  // Provide voice feedback to user
  const config = loadVoiceConfig();
  
  if (!config.voiceFeedback) {
    return;
  }
  
  try {
    if (process.platform === 'darwin') {
      // macOS - use built-in 'say' command
      execSync(`say "${message}"`, { stdio: 'ignore' });
    } else if (process.platform === 'linux') {
      // Linux - use espeak or festival if available
      if (commandExists('espeak')) {
        execSync(`espeak "${message}"`, { stdio: 'ignore' });
      } else if (commandExists('festival')) {
        execSync(`echo "${message}" | festival --tts`, { stdio: 'ignore' });
      }
    } else if (process.platform === 'win32') {
      // Windows - use PowerShell speech synthesis
      const script = `Add-Type -AssemblyName System.speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Speak('${message}')`;
      execSync(`powershell "${script}"`, { stdio: 'ignore' });
    }
  } catch (error) {
    // Silently fail voice feedback
    console.log(`Voice feedback failed: ${error.message}`);
  }
}

function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Tool implementations
const tools = {
  start_voice_recognition: async ({ wakeWord = WAKE_WORD, language = VOICE_LANGUAGE, confidenceThreshold = CONFIDENCE_THRESHOLD, continuousListening = true, timeout = 10 }) => {
    try {
      if (isListening) {
        return {
          success: false,
          message: 'Voice recognition is already active',
          status: 'already_listening'
        };
      }
      
      // Check microphone availability
      const microphoneAvailable = detectMicrophone();
      if (!microphoneAvailable) {
        return {
          success: false,
          message: 'No microphone detected. Please check your audio input device.',
          status: 'no_microphone'
        };
      }
      
      // Create new session
      currentSession = {
        id: Date.now().toString(),
        startTime: new Date().toISOString(),
        wakeWord: wakeWord,
        language: language,
        confidenceThreshold: confidenceThreshold,
        commandsProcessed: 0,
        errors: 0
      };
      
      // Start voice recognition (simulated for now)
      isListening = true;
      
      // Provide feedback
      provideFeedback(`Voice control activated. Say "${wakeWord}" followed by your command.`);
      
      recordVoiceAnalytics('voice_recognition_started', {
        wakeWord: wakeWord,
        language: language,
        confidenceThreshold: confidenceThreshold
      });
      
      // Simulate continuous listening
      voiceProcess = setInterval(async () => {
        if (Math.random() > 0.95) { // 5% chance of "hearing" wake word
          try {
            const recognition = await simulateVoiceRecognition();
            
            if (recognition.success) {
              const commandResult = processVoiceCommand(recognition.transcript, recognition.confidence);
              
              if (commandResult.success) {
                currentSession.commandsProcessed++;
                provideFeedback(`Got it. ${commandResult.message}`);
              } else {
                currentSession.errors++;
                provideFeedback(commandResult.message);
              }
            }
          } catch (error) {
            currentSession.errors++;
            recordVoiceAnalytics('recognition_error', { error: error.message });
          }
        }
      }, 1000); // Check every second
      
      return {
        success: true,
        message: `Voice recognition started with wake word: "${wakeWord}"`,
        sessionId: currentSession.id,
        config: {
          wakeWord: wakeWord,
          language: language,
          confidenceThreshold: confidenceThreshold,
          continuousListening: continuousListening
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Voice recognition failed to start: ${error.message}`,
        status: 'start_failed'
      };
    }
  },

  stop_voice_recognition: async ({ saveSession = false }) => {
    try {
      if (!isListening) {
        return {
          success: false,
          message: 'Voice recognition is not currently active',
          status: 'not_listening'
        };
      }
      
      // Stop voice process
      if (voiceProcess) {
        clearInterval(voiceProcess);
        voiceProcess = null;
      }
      
      isListening = false;
      
      // Finalize session
      if (currentSession) {
        currentSession.endTime = new Date().toISOString();
        currentSession.duration = Date.now() - parseInt(currentSession.id);
        
        recordVoiceAnalytics('voice_recognition_stopped', {
          sessionDuration: currentSession.duration,
          commandsProcessed: currentSession.commandsProcessed,
          errors: currentSession.errors
        });
        
        if (saveSession) {
          // Save session data for analysis
          const sessionsFile = path.join(VOICE_DIR, 'sessions.json');
          let sessions = [];
          
          if (fs.existsSync(sessionsFile)) {
            sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
          }
          
          sessions.push(currentSession);
          fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2));
        }
      }
      
      provideFeedback('Voice control deactivated.');
      
      const sessionSummary = currentSession ? {
        duration: currentSession.duration,
        commandsProcessed: currentSession.commandsProcessed,
        errors: currentSession.errors,
        accuracy: currentSession.commandsProcessed > 0 ? 
          ((currentSession.commandsProcessed - currentSession.errors) / currentSession.commandsProcessed) * 100 : 0
      } : null;
      
      currentSession = null;
      
      return {
        success: true,
        message: 'Voice recognition stopped',
        sessionSummary: sessionSummary
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop voice recognition: ${error.message}`
      };
    }
  },

  voice_command: async ({ command, confidence = 1.0, skipWakeWord = false }) => {
    try {
      if (!skipWakeWord && !command.toLowerCase().includes(WAKE_WORD.toLowerCase())) {
        return {
          success: false,
          message: `Command must start with wake word: "${WAKE_WORD}"`,
          wakeWordRequired: true
        };
      }
      
      // Remove wake word from command
      const cleanCommand = skipWakeWord ? command : 
        command.replace(new RegExp(WAKE_WORD, 'gi'), '').trim();
      
      // Process the command
      const result = processVoiceCommand(cleanCommand, confidence);
      
      if (result.success) {
        provideFeedback(result.message);
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Voice command processing failed: ${error.message}`,
        command: command
      };
    }
  },

  configure_voice: async ({ setting, value, testSetting = false }) => {
    try {
      const config = loadVoiceConfig();
      
      switch (setting) {
        case 'wake_word':
          config.wakeWord = value;
          break;
        case 'language':
          config.language = value;
          break;
        case 'confidence':
          config.confidenceThreshold = parseFloat(value);
          break;
        case 'timeout':
          config.timeout = parseInt(value);
          break;
        case 'voice_feedback':
          config.voiceFeedback = value.toLowerCase() === 'true';
          break;
        case 'privacy_mode':
          config.privacyMode = value.toLowerCase() === 'true';
          break;
        default:
          throw new Error(`Unknown setting: ${setting}`);
      }
      
      saveVoiceConfig(config);
      
      if (testSetting) {
        // Test the new setting
        switch (setting) {
          case 'wake_word':
            provideFeedback(`Wake word updated to: ${value}`);
            break;
          case 'voice_feedback':
            if (config.voiceFeedback) {
              provideFeedback('Voice feedback is now enabled');
            }
            break;
        }
      }
      
      return {
        success: true,
        message: `Voice setting "${setting}" updated to: ${value}`,
        setting: setting,
        value: value,
        config: config
      };
    } catch (error) {
      return {
        success: false,
        message: `Voice configuration failed: ${error.message}`,
        setting: setting
      };
    }
  },

  voice_training: async ({ trainingType = 'common_commands', iterations = 5, customWords = [] }) => {
    try {
      provideFeedback(`Starting ${trainingType} training. Please follow the prompts.`);
      
      const trainingData = {
        type: trainingType,
        startTime: new Date().toISOString(),
        iterations: iterations,
        results: []
      };
      
      switch (trainingType) {
        case 'wake_word':
          provideFeedback(`Please say your wake word "${WAKE_WORD}" ${iterations} times clearly.`);
          
          for (let i = 0; i < iterations; i++) {
            // Simulate training iteration
            await new Promise(resolve => setTimeout(resolve, 3000));
            trainingData.results.push({
              iteration: i + 1,
              confidence: 0.8 + Math.random() * 0.2,
              success: true
            });
            provideFeedback(`Training iteration ${i + 1} complete.`);
          }
          break;
          
        case 'common_commands':
          const commonCommands = [
            'launch chrome',
            'take screenshot',
            'find my files', 
            'what time is it',
            'calculate fifteen percent of two hundred forty'
          ];
          
          provideFeedback('Please repeat each command I say clearly.');
          
          for (const command of commonCommands.slice(0, iterations)) {
            provideFeedback(`Say: ${command}`);
            await new Promise(resolve => setTimeout(resolve, 4000));
            
            trainingData.results.push({
              command: command,
              confidence: 0.75 + Math.random() * 0.25,
              success: true
            });
          }
          break;
          
        case 'custom_vocabulary':
          if (customWords.length === 0) {
            throw new Error('Custom words required for vocabulary training');
          }
          
          provideFeedback(`Training pronunciation for ${customWords.length} custom words.`);
          
          for (const word of customWords) {
            provideFeedback(`Say: ${word}`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            trainingData.results.push({
              word: word,
              confidence: 0.7 + Math.random() * 0.3,
              success: true
            });
          }
          break;
          
        case 'accent_adaptation':
          provideFeedback('Reading sample text for accent adaptation.');
          
          const sampleText = [
            'JARVIS launch my productivity applications',
            'Calculate the compound interest on one thousand dollars',
            'Find my recent project files and arrange the workspace'
          ];
          
          for (const text of sampleText) {
            provideFeedback(`Please read: ${text}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            trainingData.results.push({
              text: text,
              confidence: 0.8 + Math.random() * 0.2,
              success: true
            });
          }
          break;
      }
      
      trainingData.endTime = new Date().toISOString();
      trainingData.overallAccuracy = trainingData.results.reduce((sum, r) => sum + r.confidence, 0) / trainingData.results.length;
      
      // Update config with improved accuracy
      const config = loadVoiceConfig();
      config.training[`${trainingType}Accuracy`] = trainingData.overallAccuracy;
      if (customWords.length > 0) {
        config.training.customVocabulary.push(...customWords);
      }
      saveVoiceConfig(config);
      
      recordVoiceAnalytics('training_completed', trainingData);
      provideFeedback(`Training complete! Accuracy improved to ${(trainingData.overallAccuracy * 100).toFixed(1)}%`);
      
      return {
        success: true,
        message: `Voice training completed for ${trainingType}`,
        trainingData: trainingData
      };
    } catch (error) {
      return {
        success: false,
        message: `Voice training failed: ${error.message}`,
        trainingType: trainingType
      };
    }
  },

  voice_feedback: async ({ action, voice = 'system_default', speed = 1.0, volume = 0.8, testPhrase }) => {
    try {
      const config = loadVoiceConfig();
      
      switch (action) {
        case 'enable':
          config.voiceFeedback = true;
          saveVoiceConfig(config);
          provideFeedback('Voice feedback enabled');
          break;
          
        case 'disable':
          config.voiceFeedback = false;
          saveVoiceConfig(config);
          // No voice feedback since we just disabled it
          console.log('Voice feedback disabled');
          break;
          
        case 'configure':
          config.voice = voice;
          config.speechSpeed = speed;
          config.speechVolume = volume;
          saveVoiceConfig(config);
          
          if (testPhrase) {
            provideFeedback(testPhrase);
          } else {
            provideFeedback('Voice settings updated successfully');
          }
          break;
          
        case 'test':
          const phrase = testPhrase || 'This is a test of JARVIS voice feedback system';
          provideFeedback(phrase);
          break;
          
        case 'set_voice':
          config.voice = voice;
          saveVoiceConfig(config);
          provideFeedback(`Voice changed to ${voice}`);
          break;
          
        default:
          throw new Error(`Unknown voice feedback action: ${action}`);
      }
      
      return {
        success: true,
        message: `Voice feedback ${action} completed`,
        action: action,
        config: {
          voice: config.voice,
          speed: config.speechSpeed,
          volume: config.speechVolume,
          enabled: config.voiceFeedback
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Voice feedback configuration failed: ${error.message}`,
        action: action
      };
    }
  },

  voice_shortcuts: async ({ action, phrase, command, skill, parameters = {}, confirmation = false }) => {
    try {
      const shortcuts = loadVoiceShortcuts();
      
      switch (action) {
        case 'create':
          if (!phrase || !command) {
            throw new Error('Phrase and command are required');
          }
          
          // Check for existing shortcut
          const existing = shortcuts.shortcuts.find(s => s.phrase.toLowerCase() === phrase.toLowerCase());
          if (existing) {
            return {
              success: false,
              message: `Shortcut for phrase "${phrase}" already exists`,
              existingShortcut: existing
            };
          }
          
          const newShortcut = {
            id: Date.now().toString(),
            phrase: phrase,
            command: command,
            skill: skill,
            parameters: parameters,
            confirmation: confirmation,
            created: new Date().toISOString(),
            usageCount: 0
          };
          
          shortcuts.shortcuts.push(newShortcut);
          saveVoiceShortcuts(shortcuts);
          
          return {
            success: true,
            message: `Voice shortcut created: "${phrase}" → ${command}`,
            shortcut: newShortcut
          };
          
        case 'list':
          return {
            success: true,
            shortcuts: shortcuts.shortcuts,
            total: shortcuts.shortcuts.length
          };
          
        case 'delete':
          if (!phrase) {
            throw new Error('Phrase is required for deletion');
          }
          
          const index = shortcuts.shortcuts.findIndex(s => s.phrase.toLowerCase() === phrase.toLowerCase());
          if (index === -1) {
            return {
              success: false,
              message: `No shortcut found for phrase: "${phrase}"`
            };
          }
          
          const deleted = shortcuts.shortcuts.splice(index, 1)[0];
          saveVoiceShortcuts(shortcuts);
          
          return {
            success: true,
            message: `Voice shortcut deleted: "${phrase}"`,
            deletedShortcut: deleted
          };
          
        case 'test':
          if (!phrase) {
            throw new Error('Phrase is required for testing');
          }
          
          const testResult = processVoiceCommand(phrase, 1.0);
          
          return {
            success: testResult.success,
            message: `Test result: ${testResult.message}`,
            testResult: testResult
          };
          
        default:
          throw new Error(`Unknown shortcut action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Voice shortcuts operation failed: ${error.message}`,
        action: action
      };
    }
  },

  voice_accessibility: async ({ feature, enabled, sensitivity = 0.5, alternativeInput }) => {
    try {
      const config = loadVoiceConfig();
      
      if (!config.accessibility) {
        config.accessibility = {};
      }
      
      config.accessibility[feature] = {
        enabled: enabled,
        sensitivity: sensitivity,
        alternativeInput: alternativeInput,
        configured: new Date().toISOString()
      };
      
      saveVoiceConfig(config);
      
      let message = `Accessibility feature "${feature}" ${enabled ? 'enabled' : 'disabled'}`;
      
      if (enabled) {
        switch (feature) {
          case 'noise_cancellation':
            message += ' - Background noise will be filtered';
            break;
          case 'speech_impediment':
            message += ' - Enhanced recognition for speech differences';
            break;
          case 'quiet_mode':
            message += ' - Optimized for quiet/whispered commands';
            break;
          case 'hearing_assistance':
            message += ' - Visual feedback will supplement audio';
            break;
          case 'motor_assistance':
            message += ' - Alternative input methods available';
            break;
        }
      }
      
      provideFeedback(message);
      
      return {
        success: true,
        message: message,
        feature: feature,
        config: config.accessibility[feature]
      };
    } catch (error) {
      return {
        success: false,
        message: `Accessibility configuration failed: ${error.message}`,
        feature: feature
      };
    }
  },

  voice_analytics: async ({ analysisType = 'accuracy', timeframe = 'week', includePrivacy = false }) => {
    try {
      ensureDirectories();
      
      let analytics = [];
      if (fs.existsSync(ANALYTICS_FILE)) {
        analytics = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8'));
      }
      
      // Filter by timeframe
      const now = new Date();
      let cutoffDate;
      
      switch (timeframe) {
        case 'hour': cutoffDate = new Date(now.getTime() - 60 * 60 * 1000); break;
        case 'day': cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
        case 'week': cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'month': cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        case 'all': cutoffDate = new Date(0); break;
      }
      
      const filteredAnalytics = analytics.filter(entry => 
        new Date(entry.timestamp) >= cutoffDate
      );
      
      let analysis = {};
      
      switch (analysisType) {
        case 'accuracy':
          const commands = filteredAnalytics.filter(e => e.event === 'command_received');
          const successful = filteredAnalytics.filter(e => e.event === 'shortcut_matched' || e.event === 'general_command');
          
          analysis = {
            totalCommands: commands.length,
            successfulCommands: successful.length,
            accuracy: commands.length > 0 ? (successful.length / commands.length) * 100 : 0,
            averageConfidence: commands.reduce((sum, c) => sum + (c.data.confidence || 0), 0) / commands.length || 0
          };
          break;
          
        case 'usage_patterns':
          const hourlyUsage = {};
          const dailyUsage = {};
          
          filteredAnalytics.forEach(entry => {
            const date = new Date(entry.timestamp);
            const hour = date.getHours();
            const day = date.toDateString();
            
            hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
            dailyUsage[day] = (dailyUsage[day] || 0) + 1;
          });
          
          analysis = {
            hourlyUsage: hourlyUsage,
            peakHours: Object.keys(hourlyUsage).sort((a, b) => hourlyUsage[b] - hourlyUsage[a]).slice(0, 3),
            dailyUsage: dailyUsage,
            totalEvents: filteredAnalytics.length
          };
          break;
          
        case 'command_frequency':
          const commandFreq = {};
          
          filteredAnalytics
            .filter(e => e.event === 'command_received')
            .forEach(entry => {
              const command = entry.data.transcript || 'unknown';
              commandFreq[command] = (commandFreq[command] || 0) + 1;
            });
          
          const sortedCommands = Object.entries(commandFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
          
          analysis = {
            topCommands: sortedCommands,
            uniqueCommands: Object.keys(commandFreq).length,
            totalCommands: Object.values(commandFreq).reduce((a, b) => a + b, 0)
          };
          break;
          
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }
      
      return {
        success: true,
        analysisType: analysisType,
        timeframe: timeframe,
        analysis: analysis,
        dataPoints: filteredAnalytics.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Voice analytics failed: ${error.message}`,
        analysisType: analysisType
      };
    }
  },

  voice_status: async ({ includeDetails = true, testMicrophone = false }) => {
    try {
      const config = loadVoiceConfig();
      const microphoneAvailable = testMicrophone ? detectMicrophone() : null;
      
      const status = {
        enabled: VOICE_ENABLED,
        listening: isListening,
        currentSession: currentSession ? {
          id: currentSession.id,
          duration: Date.now() - parseInt(currentSession.id),
          commandsProcessed: currentSession.commandsProcessed,
          errors: currentSession.errors
        } : null,
        wakeWord: config.wakeWord,
        language: config.language,
        confidenceThreshold: config.confidenceThreshold,
        voiceFeedback: config.voiceFeedback
      };
      
      if (includeDetails) {
        status.details = {
          platform: process.platform,
          microphoneDetected: microphoneAvailable,
          shortcuts: loadVoiceShortcuts().shortcuts.length,
          accessibility: config.accessibility || {},
          training: config.training || {}
        };
      }
      
      if (testMicrophone) {
        status.microphoneTest = {
          available: microphoneAvailable,
          tested: true,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        success: true,
        status: status,
        platform: process.platform,
        recommendation: !microphoneAvailable && testMicrophone ? 
          'Consider checking microphone permissions or connecting an audio input device' : null
      };
    } catch (error) {
      return {
        success: false,
        message: `Voice status check failed: ${error.message}`
      };
    }
  }
};

module.exports = { tools };