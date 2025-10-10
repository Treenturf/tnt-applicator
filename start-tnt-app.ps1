# TNT Applicator App Launcher
# This script starts the development server and opens the browser

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    TNT APPLICATOR LAUNCHER" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan

Set-Location "c:\Users\Guy\TNT App\data\TNT React"

Write-Host "Starting TNT Applicator App..." -ForegroundColor Green

# Start the development server in the background
Write-Host "Launching development server..." -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    Set-Location "c:\Users\Guy\TNT App\data\TNT React"
    npm run dev
}

# Wait for the server to start
Write-Host "Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 7

# Check if Chrome is available for kiosk mode
$chromeExists = Get-Command chrome -ErrorAction SilentlyContinue
$edgeExists = Get-Command msedge -ErrorAction SilentlyContinue

Write-Host "Opening browser..." -ForegroundColor Yellow

if ($chromeExists) {
    Write-Host "Launching in Chrome kiosk mode..." -ForegroundColor Green
    Start-Process "chrome" -ArgumentList "--kiosk", "--start-fullscreen", "http://localhost:5173"
} elseif ($edgeExists) {
    Write-Host "Launching in Edge kiosk mode..." -ForegroundColor Green
    Start-Process "msedge" -ArgumentList "--kiosk", "--start-fullscreen", "http://localhost:5173"
} else {
    Write-Host "Launching in default browser..." -ForegroundColor Green
    Start-Process "http://localhost:5173"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  TNT APPLICATOR IS NOW RUNNING" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "URL: http://localhost:5173" -ForegroundColor White
Write-Host "Press Alt+F4 to exit kiosk mode" -ForegroundColor Yellow
Write-Host "Close this window to stop the server" -ForegroundColor Yellow
Write-Host ""

# Keep the window open and show server status
try {
    while ($job.State -eq "Running") {
        Start-Sleep -Seconds 30
        $timestamp = Get-Date -Format 'HH:mm:ss'
        Write-Host "[$timestamp] Server Status: RUNNING" -ForegroundColor Cyan
    }
} catch {
    Write-Host "Stopping server..." -ForegroundColor Red
}

# Clean up
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue