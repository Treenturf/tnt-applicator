@echo off
title TNT Applicator Smart Launcher
cd /d "c:\Users\Guy\TNT App\data\TNT React"

echo ========================================
echo    TNT APPLICATOR SMART LAUNCHER
echo ========================================
echo.

REM Use the smart conflict resolution
echo Checking for conflicts and cleaning up...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do (
    echo Stopping process on port 5173...
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174.*LISTENING"') do (
    echo Stopping process on port 5174...
    taskkill /f /pid %%a >nul 2>&1
)

REM Wait for processes to fully terminate
timeout /t 2 /nobreak >nul

echo Starting TNT Applicator App (Smart Mode)...
echo Please wait, starting server and opening browser...

REM Check if port 5173 is available, if not use 5175
netstat -ano | findstr ":5173.*LISTENING" >nul
if %errorlevel% equ 0 (
    echo Port 5173 still occupied, using alternative port 5175...
    start /B npm run dev -- --port 5175
    set "APP_PORT=5175"
) else (
    echo Port 5173 available, starting normally...
    start /B npm run dev
    set "APP_PORT=5173"
)

REM Wait for the server to start
echo Waiting for server to initialize...
timeout /t 8 /nobreak >nul

REM Open the browser to the app
echo Opening browser on port %APP_PORT%...
start http://localhost:%APP_PORT%

echo.
echo ========================================
echo  TNT APPLICATOR IS NOW RUNNING
echo  Port: %APP_PORT%
echo ========================================
echo.
echo - App should open in your browser
echo - Smart conflict resolution enabled
echo - Keep this window open to keep the app running
echo - Close this window to stop the app
echo.
pause