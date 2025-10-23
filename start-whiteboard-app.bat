@echo off
REM Whiteboard App Startup Script
REM Auto-restarts on crash, runs in background

echo Starting Whiteboard App...

:START
cd /d "C:\Users\Guy\TNT App\whiteboard"

REM Check if node_modules exists, install if not
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Start the app
echo Starting Whiteboard App at %date% %time%
npm run dev

REM If app exits/crashes, wait 5 seconds and restart
echo App exited at %date% %time%
echo Restarting in 5 seconds...
timeout /t 5 /nobreak

goto START