@echo off
REM Start JARVIS gateway on ROG Ally (no pause — for Task Scheduler / auto-start)
cd /d "%~dp0.."
npx clawdbot gateway run
