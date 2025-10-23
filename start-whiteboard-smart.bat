@echo off
title TNT Whiteboard Smart Launcher
echo ========================================
echo    TNT WHITEBOARD SMART LAUNCHER
echo ========================================
echo.

REM Smart conflict resolution for whiteboard app
echo Checking for conflicts and cleaning up...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5175.*LISTENING"') do (
    echo Stopping process on port 5175...
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174.*LISTENING"') do (
    echo Stopping process on port 5174...
    taskkill /f /pid %%a >nul 2>&1
)

REM Wait for processes to fully terminate
timeout /t 2 /nobreak >nul

REM Change to whiteboard directory
cd /d "C:\Users\Guy\TNT App\whiteboard app"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting TNT Whiteboard (Smart Mode)...
echo Please wait, starting server...

REM Check if port 5175 is available, if not use 5176
netstat -ano | findstr ":5175.*LISTENING" >nul
if %errorlevel% equ 0 (
    echo Port 5175 still occupied, using alternative port 5176...
    start /B npm run dev -- --port 5176
    set "APP_PORT=5176"
) else (
    echo Port 5175 available, starting normally...
    start /B npm run dev
    set "APP_PORT=5175"
)

REM Wait for the server to start
echo Waiting for server to initialize...
timeout /t 8 /nobreak >nul

REM Show connection info
echo.
echo ========================================
echo  TNT WHITEBOARD IS NOW RUNNING
echo ========================================
echo.
echo - Server running on port %APP_PORT%
echo - Office View:  http://10.10.20.218:%APP_PORT%
echo - Kiosk View:   http://10.10.20.218:%APP_PORT%/kiosk
echo - Keep this window open to keep the app running
echo - Press Ctrl+C to stop the server
echo.

REM Keep the server running
echo Press any key to open browser, or Ctrl+C to stop...
pause >nul

REM Open browser to whiteboard
start http://10.10.20.218:%APP_PORT%

REM Keep window open
echo Browser opened. Server is running...
echo Press Ctrl+C to stop the server.
pause >nul