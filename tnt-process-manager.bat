@echo off
echo TNT App Process Manager
echo =====================

echo.
echo Current processes using ports 5173-5175:
netstat -ano | findstr ":517" | findstr "LISTENING"

echo.
echo Node.js processes currently running:
tasklist | findstr node.exe

echo.
echo Choose an option:
echo 1. Kill all Node.js processes (clean restart)
echo 2. Kill only port conflicts (safer)
echo 3. Check port availability
echo 4. Start whiteboard with alternative port
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto killall
if "%choice%"=="2" goto killports
if "%choice%"=="3" goto checkports
if "%choice%"=="4" goto altstart
if "%choice%"=="5" goto exit

:killall
echo Killing all Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo Done! All Node.js processes stopped.
pause
goto menu

:killports
echo Checking for processes on conflicting ports...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do (
    echo Killing process %%a on port 5173...
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174.*LISTENING"') do (
    echo Killing process %%a on port 5174...
    taskkill /f /pid %%a >nul 2>&1
)
echo Done! Port conflicts resolved.
pause
goto menu

:checkports
echo Checking port availability...
echo Port 5173:
netstat -ano | findstr ":5173" | findstr "LISTENING" && echo "  OCCUPIED" || echo "  AVAILABLE"
echo Port 5174:
netstat -ano | findstr ":5174" | findstr "LISTENING" && echo "  OCCUPIED" || echo "  AVAILABLE"
echo Port 5175:
netstat -ano | findstr ":5175" | findstr "LISTENING" && echo "  OCCUPIED" || echo "  AVAILABLE"
pause
goto menu

:altstart
echo Starting whiteboard app on alternative port...
cd "C:\Users\Guy\TNT App\data\TNT React"
echo Using alternative configuration (port 5175)...
npm run dev -- --config vite.config.alternative.ts
pause
goto menu

:menu
cls
goto start

:exit
echo Goodbye!
exit