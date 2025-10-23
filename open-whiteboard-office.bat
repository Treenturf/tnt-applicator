@echo off
title TNT Whiteboard Smart Office Launcher
echo ========================================
echo   TNT WHITEBOARD SMART OFFICE LAUNCHER
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
    echo 1. Yes - Start server then open browser
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
echo 🌐 Opening Office View: http://10.10.20.218:%FOUND_PORT%
echo.

REM Try Chrome first, then Edge, then default browser
where chrome >nul 2>nul
if %errorlevel%==0 (
    start chrome --app=http://10.10.20.218:%FOUND_PORT%
    echo 🎉 Opened in Chrome (app mode)
) else (
    where msedge >nul 2>nul
    if %errorlevel%==0 (
        start msedge --app=http://10.10.20.218:%FOUND_PORT%
        echo 🎉 Opened in Edge (app mode)
    ) else (
        start http://10.10.20.218:%FOUND_PORT%
        echo 🎉 Opened in default browser
    )
)

echo.
echo Press any key to close...
pause >nul