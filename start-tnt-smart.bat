@echo off
echo TNT Smart Startup - Avoiding Conflicts
echo =====================================

REM Kill any existing Node.js processes that might conflict
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174.*LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

REM Change to TNT React directory
cd "C:\Users\Guy\TNT App\data\TNT React"

REM Check if port 5173 is available, if not use 5175
netstat -ano | findstr ":5173.*LISTENING" >nul
if %errorlevel% equ 0 (
    echo Port 5173 still occupied, using alternative port 5175...
    npm run dev -- --port 5175
) else (
    echo Port 5173 available, starting normally...
    npm run dev
)

pause