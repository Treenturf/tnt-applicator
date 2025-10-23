# TNT Whiteboard Server Quick Restart
# PowerShell version for faster execution

Write-Host "🔄 TNT Whiteboard Server Restart" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Function to kill processes on specific ports
function Stop-ProcessOnPort {
    param([int]$Port)
    
    $processes = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($process in $processes) {
        $pid = $process.OwningProcess
        Write-Host "🛑 Stopping process on port $Port (PID: $pid)" -ForegroundColor Yellow
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "🧹 Cleaning up existing servers..." -ForegroundColor Yellow

# Stop whiteboard servers
Stop-ProcessOnPort -Port 5175
Stop-ProcessOnPort -Port 5176  
Stop-ProcessOnPort -Port 5174

# Wait for cleanup
Start-Sleep -Seconds 2

Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# Ask user what to do next
Write-Host "Choose restart option:" -ForegroundColor Cyan
Write-Host "1. 🚀 Start Whiteboard Server (Smart Mode)" -ForegroundColor White
Write-Host "2. 🔧 Open Process Manager" -ForegroundColor White  
Write-Host "3. 📊 Check Status Only" -ForegroundColor White
Write-Host "4. ❌ Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host "🚀 Starting Whiteboard Server..." -ForegroundColor Green
        Set-Location "C:\Users\Guy\TNT App\data\TNT React"
        Start-Process "start-whiteboard-smart.bat" -WorkingDirectory "C:\Users\Guy\TNT App\data\TNT React"
    }
    "2" {
        Write-Host "🔧 Opening Process Manager..." -ForegroundColor Green
        Start-Process "tnt-process-manager.bat" -WorkingDirectory "C:\Users\Guy\TNT App\data\TNT React"
    }
    "3" {
        Write-Host ""
        Write-Host "📊 Current Status:" -ForegroundColor Cyan
        Write-Host "=================" -ForegroundColor Cyan
        
        Write-Host "Checking ports 5174-5176..." -ForegroundColor Yellow
        $listening = Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 5174,5175,5176 }
        
        if ($listening) {
            foreach ($conn in $listening) {
                $processName = (Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue).ProcessName
                Write-Host "✅ Port $($conn.LocalPort): $processName (PID: $($conn.OwningProcess))" -ForegroundColor Green
            }
        } else {
            Write-Host "❌ No whiteboard servers running" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Press any key to continue..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    "4" {
        Write-Host "👋 Goodbye!" -ForegroundColor Green
        return
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Restart operation complete!" -ForegroundColor Green