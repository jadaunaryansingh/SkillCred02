@echo off
echo Starting API Server...
cd /d "%~dp0"
npx tsx dev-server.js
pause
