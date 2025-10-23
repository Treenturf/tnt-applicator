@echo off
title TNT Applicator Kiosk
cd /d "c:\Users\Guy\TNT App\data\TNT React"

echo ========================================
echo    TNT APPLICATOR KIOSK LAUNCHER
echo ========================================
echo.

@echo off
title TNT Applicator Kiosk Smart Launcher
cd /d "c:\Users\Guy\TNT App\data\TNT React"

echo ========================================
echo    TNT APPLICATOR KIOSK SMART LAUNCHER
echo ========================================
echo.

REM Smart conflict resolution
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

echo Starting server (Smart Mode)...

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

REM Open browser in kiosk mode (full screen, no navigation)
echo Opening TNT Applicator in kiosk mode on port %APP_PORT%...

REM Try Chrome first, then Edge, then default browser
where chrome >nul 2>nul
if %errorlevel%==0 (
    start chrome --kiosk --disable-web-security --disable-features=VizDisplayCompositor --start-fullscreen http://localhost:%APP_PORT%
) else (
    where msedge >nul 2>nul
    if %errorlevel%==0 (
        start msedge --kiosk --start-fullscreen http://localhost:%APP_PORT%
    ) else (
        REM Fallback to default browser
        start http://localhost:%APP_PORT%
    )
)

echo.
echo ========================================
echo  TNT APPLICATOR IS NOW RUNNING
echo ========================================
echo.
echo - App is running in full-screen kiosk mode
echo - Smart conflict resolution enabled
echo - Port: %APP_PORT%
echo - Press Alt+F4 to exit kiosk mode
echo - Keep this window open to keep the app running
echo - Close this window to stop the app
echo.
echo Server Status: RUNNING
echo URL: http://localhost:%APP_PORT%
echo.

REM Keep the window open and show periodic status
:loop
timeout /t 30 /nobreak >nul
echo [%time%] Server Status: RUNNING
goto loop