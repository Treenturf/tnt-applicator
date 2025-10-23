# Smart Whiteboard Kiosk Launcher - Auto-detects port

Write-Host "🖥️ TNT Whiteboard Smart Kiosk Launcher" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Function to detect whiteboard server port
function Get-WhiteboardPort {
    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
                   Where-Object { $_.LocalPort -in 5174,5175,5176 }
    
    if ($connections) {
        $port = $connections[0].LocalPort
        Write-Host "✅ Found whiteboard server on port $port" -ForegroundColor Green
        return $port
    }
    
    Write-Host "❌ No whiteboard server found on ports 5174-5176" -ForegroundColor Red
    return $null
}

# Detect port
$port = Get-WhiteboardPort

if (-not $port) {
    Write-Host ""
    Write-Host "Would you like to:" -ForegroundColor Yellow
    Write-Host "1. 🚀 Start server first, then open kiosk" -ForegroundColor White
    Write-Host "2. 🌐 Try port 5174 anyway" -ForegroundColor White
    Write-Host "3. ❌ Cancel" -ForegroundColor White
    
    $choice = Read-Host "Enter choice (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Host "🚀 Starting whiteboard server..." -ForegroundColor Green
            Set-Location "C:\Users\Guy\TNT App\whiteboard app"
            Start-Process "start-vite.bat" -WorkingDirectory "C:\Users\Guy\TNT App\whiteboard app" -Wait
            
            # Wait a moment and re-detect
            Start-Sleep -Seconds 5
            $port = Get-WhiteboardPort
            if (-not $port) { $port = 5174 }
        }
        "2" { $port = 5174 }
        "3" { 
            Write-Host "👋 Cancelled" -ForegroundColor Yellow
            return 
        }
        default {
            Write-Host "❌ Invalid choice, using port 5174" -ForegroundColor Red
            $port = 5174
        }
    }
}

$url = "http://10.10.20.218:$port/kiosk"
Write-Host "🖥️ Opening Kiosk View (Read-Only): $url" -ForegroundColor Green

# Try different browsers in kiosk mode
$browsers = @(
    @{ Name = "Chrome"; Path = "C:\Program Files\Google\Chrome\Application\chrome.exe"; Args = "--kiosk --start-fullscreen $url" },
    @{ Name = "Chrome (x86)"; Path = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"; Args = "--kiosk --start-fullscreen $url" },
    @{ Name = "Edge"; Path = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"; Args = "--kiosk --start-fullscreen $url" }
)

$launched = $false
foreach ($browser in $browsers) {
    if (Test-Path $browser.Path) {
        Start-Process $browser.Path -ArgumentList $browser.Args.Split(' ') -ErrorAction SilentlyContinue
        Write-Host "🎉 Opened in $($browser.Name) (fullscreen kiosk mode)" -ForegroundColor Green
        $launched = $true
        break
    }
}

if (-not $launched) {
    Start-Process $url
    Write-Host "🎉 Opened in default browser" -ForegroundColor Green
}

Write-Host ""
Write-Host "Kiosk view launched successfully!" -ForegroundColor Green
Write-Host "Server: Port $port" -ForegroundColor Cyan
Write-Host "URL: $url" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Kiosk Controls:" -ForegroundColor Yellow
Write-Host "• Press Alt+F4 to exit fullscreen" -ForegroundColor White
Write-Host "• Press F11 to toggle fullscreen" -ForegroundColor White
Write-Host "• This is READ-ONLY view for shop display" -ForegroundColor White