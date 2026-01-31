@echo off
REM Start JARVIS gateway on ROG Ally (no global clawdbot required)
cd /d "%~dp0.."
echo Starting JARVIS gateway...
npx clawdbot gateway run
pause
