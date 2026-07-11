@echo off
setlocal
cd /d "%~dp0"


set "BUNDLED_NODE=C:\Users\arina\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%BUNDLED_NODE%" (
  "%BUNDLED_NODE%" dist\dashboard.js
) else (
  node dist\dashboard.js
)

if errorlevel 1 (
  echo.
  echo The dashboard could not start. Install Node.js 20 or newer, then try again.
  pause
)
