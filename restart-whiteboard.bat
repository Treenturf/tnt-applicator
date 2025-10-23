@echo off
title TNT Whiteboard Server Restart
echo ========================================
echo    TNT WHITEBOARD SERVER RESTART
echo ========================================
echo.

echo Stopping all whiteboard servers...

REM Kill processes on whiteboard ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5175.*LISTENING"') do (
    echo Stopping server on port 5175 (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstar -ano ^| findstr ":5176.*LISTENING"') do (
    echo Stopping server on port 5176 (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5174.*LISTENING"') do (
    echo Stopping notification service on port 5174 (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

REM Wait for processes to fully terminate
echo Waiting for processes to stop...
timeout /t 3 /nobreak >nul

echo.
echo ✅ All whiteboard services stopped
echo.

echo Choose restart option:
echo 1. Start Whiteboard Server (Smart Mode)
echo 2. Start with Process Manager
echo 3. Check Status Only
echo 4. Exit
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto startserver
if "%choice%"=="2" goto processmanager
if "%choice%"=="3" goto checkstatus
if "%choice%"=="4" goto exit

:startserver
echo.
echo Starting TNT Whiteboard Server (Smart Mode)...
call "start-whiteboard-smart.bat"
goto exit

:processmanager
echo.
echo Opening Process Manager...
call "tnt-process-manager.bat"
goto exit

:checkstatus
echo.
echo Current Status:
echo ================
echo.
echo Ports in use:
netstat -ano | findstr ":517" | findstr "LISTENING"
if %errorlevel% neq 0 echo No whiteboard servers running
echo.
echo Node.js processes:
tasklist | findstr node.exe
if %errorlevel% neq 0 echo No Node.js processes running
echo.
pause
goto exit

:exit
echo.
echo Restart complete!
pause