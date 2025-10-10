@echo off
title TNT Applicator Kiosk
cd /d "c:\Users\Guy\TNT App\data\TNT React"

echo ========================================
echo    TNT APPLICATOR KIOSK LAUNCHER
echo ========================================
echo.

REM Kill any existing Node.js processes first
echo Stopping any existing servers...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo Starting server...

REM Start the development server in the background
start /B npm run dev

REM Wait for the server to start
echo Waiting for server to initialize...
timeout /t 8 /nobreak >nul

REM Open browser in kiosk mode (full screen, no navigation)
echo Opening TNT Applicator in kiosk mode...

REM Try Chrome first, then Edge, then default browser
where chrome >nul 2>nul
if %errorlevel%==0 (
    start chrome --kiosk --disable-web-security --disable-features=VizDisplayCompositor --start-fullscreen http://localhost:5173
) else (
    where msedge >nul 2>nul
    if %errorlevel%==0 (
        start msedge --kiosk --start-fullscreen http://localhost:5173
    ) else (
        REM Fallback to default browser
        start http://localhost:5173
    )
)

echo.
echo ========================================
echo  TNT APPLICATOR IS NOW RUNNING
echo ========================================
echo.
echo - App is running in full-screen kiosk mode
echo - Press Alt+F4 to exit kiosk mode
echo - Keep this window open to keep the app running
echo - Close this window to stop the app
echo.
echo Server Status: RUNNING
echo URL: http://localhost:5173
echo.

REM Keep the window open and show periodic status
:loop
timeout /t 30 /nobreak >nul
echo [%time%] Server Status: RUNNING
goto loop