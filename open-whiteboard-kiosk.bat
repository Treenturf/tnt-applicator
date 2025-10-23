@echo off
title TNT Whiteboard Smart Kiosk Launcher
echo ========================================
echo   TNT WHITEBOARD SMART KIOSK LAUNCHER
echo ========================================
echo.

REM Detect which port the whiteboard server is running on
echo 🔍 Detecting whiteboard server port...

set "FOUND_PORT="
for /f "tokens=2 delims=:" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":517"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set "FOUND_PORT=%%b"
        goto :found
    )
)

:found
if "%FOUND_PORT%"=="" (
    echo ❌ No whiteboard server found running on ports 5174-5176
    echo.
    echo Would you like to start the server first?
    echo 1. Yes - Start server then open kiosk
    echo 2. No - Try port 5175 anyway
    echo 3. Cancel
    echo.
    set /p choice="Enter choice (1-3): "
    
    if "!choice!"=="1" (
        echo 🚀 Starting whiteboard server...
        start /wait "start-whiteboard-smart.bat"
        REM Re-detect port after starting
        for /f "tokens=2 delims=:" %%a in ('netstat -ano ^| findstr "LISTENING" ^| findstr ":517"') do (
            for /f "tokens=1" %%b in ("%%a") do (
                set "FOUND_PORT=%%b"
                goto :found2
            )
        )
        :found2
    )
    if "!choice!"=="2" (
        set "FOUND_PORT=5175"
    )
    if "!choice!"=="3" (
        echo Cancelled.
        pause
        exit /b
    )
)

echo ✅ Found whiteboard server on port %FOUND_PORT%
echo 🖥️ Opening Kiosk View: http://10.10.20.218:%FOUND_PORT%/kiosk
echo.

REM Try Chrome first, then Edge, then default browser
where chrome >nul 2>nul
if %errorlevel%==0 (
    start chrome --kiosk http://10.10.20.218:%FOUND_PORT%/kiosk
    echo 🎉 Opened in Chrome (kiosk mode)
) else (
    where msedge >nul 2>nul
    if %errorlevel%==0 (
        start msedge --kiosk http://10.10.20.218:%FOUND_PORT%/kiosk
        echo 🎉 Opened in Edge (kiosk mode)
    ) else (
        start http://10.10.20.218:%FOUND_PORT%/kiosk
        echo 🎉 Opened in default browser
    )
)

echo.
echo 📋 Kiosk Mode Controls:
echo - Press Alt+F4 to exit fullscreen
echo - Press F11 to toggle fullscreen
echo - Press Ctrl+Alt+Del for task manager
echo.
echo Server running on port %FOUND_PORT%
pause