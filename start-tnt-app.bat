@echo off
title TNT Applicator
cd /d "c:\Users\Guy\TNT App\data\TNT React"

echo ========================================
echo    TNT APPLICATOR LAUNCHER
echo ========================================
echo.

REM Kill any existing Node.js processes
echo Stopping any existing servers...
taskkill /F /IM node.exe /T >nul 2>&1

echo Starting TNT Applicator App...
echo Please wait, starting server and opening browser...

REM Start the development server in the background
start /B npm run dev

REM Wait for the server to start (7 seconds)
echo Waiting for server to initialize...
timeout /t 7 /nobreak >nul

REM Open the browser to the app
echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo  TNT APPLICATOR IS NOW RUNNING
echo ========================================
echo.
echo - App should open in your browser
echo - Keep this window open to keep the app running
echo - Close this window to stop the app
echo.
pause