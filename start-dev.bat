@echo off
REM Start the WeCoach backend (dev) bound to all interfaces so the
REM Android emulator (10.0.2.2) and physical devices can reach it.
cd /d "%~dp0"
set NODE_ENV=development
call npm run dev -- --hostname 0.0.0.0 --port 3000