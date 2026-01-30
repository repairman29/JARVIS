#!/bin/bash

# JARVIS Installation Script
# One-command setup for the ultimate productivity system
# curl -sSL https://install.jarvis.ai | bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# JARVIS ASCII Art
print_jarvis_logo() {
    echo -e "${CYAN}"
    cat << 'EOF'
     ██ █████  ██████  ██    ██ ██ ███████ 
     ██ ██  ██ ██   ██ ██    ██ ██ ██      
     ██ █████  ██████  ██    ██ ██ ███████ 
██   ██ ██  ██ ██   ██  ██  ██  ██      ██ 
 █████  ██  ██ ██   ██   ████   ██ ███████ 

Just A Rather Very Intelligent System
The Future of Conversational Computing
EOF
    echo -e "${NC}"
}

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Print step header
print_step() {
    local step=$1
    local description=$2
    echo ""
    print_message $PURPLE "🚀 Step $step: $description"
    echo "----------------------------------------"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PLATFORM="macOS"
    elif [[ "$OSTYPE" == "linux"* ]]; then
        OS="linux"
        PLATFORM="Linux"
    elif [[ "$OSTYPE" == "msys"* ]] || [[ "$OSTYPE" == "win32"* ]]; then
        OS="windows"
        PLATFORM="Windows"
    else
        OS="unknown"
        PLATFORM="Unknown"
    fi
}

# Check prerequisites
check_prerequisites() {
    print_step "1" "Checking Prerequisites"
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_message $GREEN "✅ Node.js found: $NODE_VERSION"
    else
        print_message $RED "❌ Node.js not found"
        print_message $YELLOW "Please install Node.js 16+ from https://nodejs.org"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_message $GREEN "✅ npm found: v$NPM_VERSION"
    else
        print_message $RED "❌ npm not found"
        exit 1
    fi
    
    # Check git
    if command_exists git; then
        GIT_VERSION=$(git --version)
        print_message $GREEN "✅ Git found: $GIT_VERSION"
    else
        print_message $RED "❌ Git not found"
        print_message $YELLOW "Please install Git from https://git-scm.com"
        exit 1
    fi
    
    # Platform-specific checks
    case $OS in
        macos)
            print_message $GREEN "✅ Platform: $PLATFORM (fully supported)"
            ;;
        linux)
            print_message $GREEN "✅ Platform: $PLATFORM (supported)"
            ;;
        windows)
            print_message $YELLOW "⚠️  Platform: $PLATFORM (basic support)"
            ;;
        *)
            print_message $RED "❌ Unsupported platform: $PLATFORM"
            exit 1
            ;;
    esac
}

# Install Clawdbot if needed
install_clawdbot() {
    print_step "2" "Installing Clawdbot (JARVIS Runtime)"
    
    if command_exists clawdbot; then
        print_message $GREEN "✅ Clawdbot already installed"
        return
    fi
    
    print_message $BLUE "📦 Installing Clawdbot via npm..."
    
    if npm install -g clawdbot; then
        print_message $GREEN "✅ Clawdbot installed successfully"
    else
        print_message $RED "❌ Clawdbot installation failed"
        print_message $YELLOW "Try running with sudo: sudo npm install -g clawdbot"
        exit 1
    fi
}

# Clone JARVIS repository
clone_jarvis() {
    print_step "3" "Downloading JARVIS Skills & Configuration"
    
    JARVIS_DIR="$HOME/.jarvis-setup"
    
    if [ -d "$JARVIS_DIR" ]; then
        print_message $YELLOW "🔄 JARVIS setup directory exists, updating..."
        cd "$JARVIS_DIR"
        git pull
    else
        print_message $BLUE "📥 Cloning JARVIS repository..."
        git clone https://github.com/repairman29/JARVIS.git "$JARVIS_DIR"
        cd "$JARVIS_DIR"
    fi
    
    print_message $GREEN "✅ JARVIS repository ready"
}

# Set up JARVIS workspace
setup_jarvis_workspace() {
    print_step "4" "Setting Up JARVIS Workspace"
    
    JARVIS_HOME="$HOME/jarvis"
    
    # Create JARVIS directory
    mkdir -p "$JARVIS_HOME"
    
    # Copy or merge JARVIS templates
    if [ -f "$JARVIS_HOME/TOOLS.md" ]; then
        print_message $YELLOW "🔄 JARVIS workspace exists, backing up existing config..."
        cp "$JARVIS_HOME/TOOLS.md" "$JARVIS_HOME/TOOLS.md.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$JARVIS_HOME/AGENTS.md" "$JARVIS_HOME/AGENTS.md.backup.$(date +%Y%m%d_%H%M%S)" 2>/dev/null || true
        
        print_message $BLUE "📝 Merging new JARVIS configuration..."
        # Merge configurations intelligently (append new skills)
        cat "$JARVIS_DIR/jarvis/TOOLS.md" >> "$JARVIS_HOME/TOOLS.md"
    else
        print_message $BLUE "📝 Creating new JARVIS workspace..."
        cp -r "$JARVIS_DIR/jarvis/"* "$JARVIS_HOME/"
    fi
    
    print_message $GREEN "✅ JARVIS workspace configured"
}

# Install productivity skills
install_skills() {
    print_step "5" "Installing JARVIS Productivity Skills"
    
    SKILLS_HOME="$HOME/jarvis/skills"
    mkdir -p "$SKILLS_HOME"
    
    # Copy all skills
    print_message $BLUE "📦 Installing 8 core productivity skills..."
    
    CORE_SKILLS=(
        "launcher"
        "window-manager"
        "file-search"
        "clipboard-history" 
        "snippets"
        "calculator"
        "workflow-automation"
        "skill-marketplace"
    )
    
    for skill in "${CORE_SKILLS[@]}"; do
        if [ -d "$SKILLS_HOME/$skill" ]; then
            print_message $YELLOW "🔄 Updating $skill..."
            rm -rf "$SKILLS_HOME/$skill"
        fi
        
        cp -r "$JARVIS_DIR/skills/$skill" "$SKILLS_HOME/"
        print_message $GREEN "✅ Installed $skill"
    done
    
    # Install Kroger skill (grocery integration)
    if [ -d "$JARVIS_DIR/skills/kroger" ]; then
        cp -r "$JARVIS_DIR/skills/kroger" "$SKILLS_HOME/"
        print_message $GREEN "✅ Installed kroger (grocery shopping)"
    fi
    
    print_message $GREEN "🎉 All skills installed successfully!"
}

# Configure environment
configure_environment() {
    print_step "6" "Configuring Environment"
    
    CLAWDBOT_DIR="$HOME/.clawdbot"
    mkdir -p "$CLAWDBOT_DIR"
    
    # Copy environment template if it doesn't exist
    if [ ! -f "$CLAWDBOT_DIR/.env" ]; then
        print_message $BLUE "📝 Creating environment configuration..."
        cp "$JARVIS_DIR/.env.example" "$CLAWDBOT_DIR/.env"
        print_message $YELLOW "⚠️  Please edit $CLAWDBOT_DIR/.env with your API keys"
    else
        print_message $GREEN "✅ Environment configuration exists"
    fi
    
    print_message $GREEN "✅ Environment configured"
}

# Set up platform-specific features
setup_platform_features() {
    print_step "7" "Setting Up Platform-Specific Features"
    
    case $OS in
        macos)
            print_message $BLUE "🍎 Configuring macOS-specific features..."
            
            # Check for Homebrew (recommended for additional tools)
            if command_exists brew; then
                print_message $GREEN "✅ Homebrew found"
                
                # Suggest useful tools
                print_message $BLUE "💡 Recommended tools for enhanced functionality:"
                echo "   brew install blueutil      # Bluetooth control"
                echo "   brew install brightness    # Screen brightness control"
                echo "   brew install yabai        # Advanced window management"
            else
                print_message $YELLOW "💡 Consider installing Homebrew for enhanced features:"
                echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            fi
            
            print_message $YELLOW "🔐 Required: Grant Accessibility permissions for window management"
            echo "   System Preferences → Security & Privacy → Privacy → Accessibility"
            echo "   Add Terminal (or your terminal app) to allow JARVIS window control"
            ;;
            
        linux)
            print_message $BLUE "🐧 Configuring Linux-specific features..."
            
            # Check for required tools
            if command_exists xclip; then
                print_message $GREEN "✅ xclip found (clipboard support)"
            else
                print_message $YELLOW "💡 Install xclip for clipboard features:"
                echo "   sudo apt install xclip     # Ubuntu/Debian"
                echo "   sudo yum install xclip     # CentOS/RHEL"
            fi
            ;;
            
        windows)
            print_message $BLUE "🪟 Configuring Windows-specific features..."
            print_message $YELLOW "💡 Windows support is basic - full implementation coming soon"
            ;;
    esac
    
    print_message $GREEN "✅ Platform features configured"
}

# Start JARVIS gateway
start_jarvis() {
    print_step "8" "Starting JARVIS Gateway"
    
    print_message $BLUE "🚀 Starting Clawdbot gateway..."
    
    # Start gateway in background
    if clawdbot gateway start; then
        print_message $GREEN "✅ JARVIS gateway started successfully"
        
        # Wait a moment for startup
        sleep 3
        
        # Check status
        if clawdbot gateway status | grep -q "running"; then
            print_message $GREEN "🎉 JARVIS is online and ready!"
        else
            print_message $YELLOW "⚠️  Gateway started but may need configuration"
        fi
    else
        print_message $YELLOW "⚠️  Gateway start failed - please check configuration"
        print_message $BLUE "💡 Try: clawdbot gateway restart"
    fi
}

# Run demo commands
run_demo() {
    print_step "9" "Running Demo Commands"
    
    print_message $BLUE "🎬 Let's test your new JARVIS capabilities!"
    
    echo ""
    print_message $CYAN "Try these commands with JARVIS:"
    echo ""
    echo "  🚀 App Management:"
    echo "     \"Launch Chrome and take a screenshot\""
    echo "     \"What apps are using the most memory?\""
    echo ""
    echo "  🧮 Quick Calculations:"
    echo "     \"What's 15% of 240?\""
    echo "     \"Convert 5 miles to kilometers\""
    echo ""
    echo "  📁 File Operations:"
    echo "     \"Find my React project files\""
    echo "     \"Show recent documents\""
    echo ""
    echo "  🪟 Window Management:"
    echo "     \"Snap VS Code to the left half\""
    echo "     \"Arrange windows for coding\""
    echo ""
    echo "  🤖 Workflow Creation:"
    echo "     \"Create a morning routine workflow\""
    echo "     \"Automate my project setup process\""
    echo ""
    
    print_message $GREEN "🎉 Installation complete! Your AI productivity revolution begins now!"
}

# Print final instructions
print_final_instructions() {
    echo ""
    print_message $PURPLE "═══════════════════════════════════════"
    print_message $PURPLE "🎉 JARVIS Installation Complete!"
    print_message $PURPLE "═══════════════════════════════════════"
    echo ""
    
    print_message $CYAN "📍 What's Installed:"
    echo "   • 8 Core Productivity Skills (85+ tools)"
    echo "   • AI Workflow Automation Engine"
    echo "   • Natural Language Processing"
    echo "   • Cross-Skill Orchestration"
    echo "   • Community Skill Marketplace"
    echo ""
    
    print_message $CYAN "🎯 Quick Start:"
    echo "   1. Configure API keys in: ~/.clawdbot/.env"
    echo "   2. Grant accessibility permissions (macOS)"
    echo "   3. Start chatting: \"JARVIS, help me set up my workspace\""
    echo ""
    
    print_message $CYAN "📚 Resources:"
    echo "   • Documentation: https://github.com/repairman29/JARVIS"
    echo "   • Community: Join our Discord server"
    echo "   • Blog: Read \"How JARVIS Reigns Supreme\""
    echo "   • Skills: Browse the community marketplace"
    echo ""
    
    print_message $CYAN "🆘 Need Help?"
    echo "   • Check status: clawdbot gateway status"
    echo "   • Restart: clawdbot gateway restart"
    echo "   • Logs: clawdbot gateway logs"
    echo "   • Community: Discord support channel"
    echo ""
    
    print_message $GREEN "Welcome to the future of productivity! 🧠✨"
}

# Error handler
error_handler() {
    local exit_code=$?
    local line_number=$1
    
    echo ""
    print_message $RED "❌ Installation failed at line $line_number (exit code: $exit_code)"
    print_message $YELLOW "🔧 Troubleshooting:"
    echo "   1. Check you have Node.js 16+ installed"
    echo "   2. Ensure you have internet connectivity"
    echo "   3. Try running with sudo if permissions fail"
    echo "   4. Join our Discord for help: [coming soon]"
    echo ""
    
    exit $exit_code
}

# Set up error handling
trap 'error_handler $LINENO' ERR

# Main installation function
main() {
    print_jarvis_logo
    
    print_message $BLUE "Welcome to the JARVIS Installation!"
    print_message $BLUE "This will set up the most advanced productivity system ever created."
    echo ""
    
    # Detect OS
    detect_os
    print_message $GREEN "✅ Detected platform: $PLATFORM"
    
    # Run installation steps
    check_prerequisites
    install_clawdbot
    clone_jarvis
    setup_jarvis_workspace
    install_skills
    configure_environment
    setup_platform_features
    start_jarvis
    run_demo
    print_final_instructions
    
    # Clean up temporary directory
    print_message $BLUE "🧹 Cleaning up temporary files..."
    rm -rf "$HOME/.jarvis-setup"
    
    print_message $GREEN "🎊 JARVIS installation completed successfully!"
    print_message $CYAN "Your productivity revolution starts now. Enjoy! 🚀"
}

# Run installation
main "$@"