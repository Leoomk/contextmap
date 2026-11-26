@echo off
chcp 65001 >nul
title ContextMap
echo ===================================================
echo   STARTING CONTEXTMAP...
echo   Open in your browser: http://localhost:3000
echo ===================================================
cd /d "%~dp0"
node index.js
pause
