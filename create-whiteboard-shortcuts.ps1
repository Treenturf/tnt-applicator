# TNT Whiteboard Desktop Shortcuts Creator
# Run this script to automatically create desktop shortcuts

Write-Host "Creating TNT Whiteboard Desktop Shortcuts..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

$Desktop = [Environment]::GetFolderPath("Desktop")
$WshShell = New-Object -ComObject WScript.Shell

# Create Server Shortcut
Write-Host "Creating Server shortcut..." -ForegroundColor Yellow
$ServerShortcut = $WshShell.CreateShortcut("$Desktop\TNT Whiteboard Server.lnk")
$ServerShortcut.TargetPath = "c:\Users\Guy\TNT App\data\TNT React\start-whiteboard-smart.bat"
$ServerShortcut.WorkingDirectory = "c:\Users\Guy\TNT App\data\TNT React"
$ServerShortcut.Description = "Start TNT Whiteboard Server (Smart Mode)"
$ServerShortcut.Save()
Write-Host "✅ Server shortcut created" -ForegroundColor Green

# Create Office View Shortcut
Write-Host "Creating Office View shortcut..." -ForegroundColor Yellow
$OfficeShortcut = $WshShell.CreateShortcut("$Desktop\TNT Whiteboard - Office.lnk")
$OfficeShortcut.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$OfficeShortcut.Arguments = "--app=http://10.10.20.218:5175"
$OfficeShortcut.Description = "TNT Whiteboard Office View"
$OfficeShortcut.Save()
Write-Host "✅ Office View shortcut created" -ForegroundColor Green

# Create Kiosk View Shortcut  
Write-Host "Creating Kiosk View shortcut..." -ForegroundColor Yellow
$KioskShortcut = $WshShell.CreateShortcut("$Desktop\TNT Whiteboard - Kiosk.lnk")
$KioskShortcut.TargetPath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$KioskShortcut.Arguments = "--kiosk http://10.10.20.218:5175/kiosk"
$KioskShortcut.Description = "TNT Whiteboard Kiosk View (Fullscreen)"
$KioskShortcut.Save()
Write-Host "✅ Kiosk View shortcut created" -ForegroundColor Green

# Create Process Manager Shortcut
Write-Host "Creating Process Manager shortcut..." -ForegroundColor Yellow
$ManagerShortcut = $WshShell.CreateShortcut("$Desktop\TNT Process Manager.lnk")
$ManagerShortcut.TargetPath = "c:\Users\Guy\TNT App\data\TNT React\tnt-process-manager.bat"
$ManagerShortcut.WorkingDirectory = "c:\Users\Guy\TNT App\data\TNT React"
$ManagerShortcut.Description = "TNT Process Manager for troubleshooting"
$ManagerShortcut.Save()
Write-Host "✅ Process Manager shortcut created" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 All shortcuts created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Usage Instructions:" -ForegroundColor Cyan
Write-Host "1. Double-click 'TNT Whiteboard Server' first" -ForegroundColor White
Write-Host "2. Wait for 'RUNNING' status message" -ForegroundColor White  
Write-Host "3. Double-click 'Office' or 'Kiosk' shortcut" -ForegroundColor White
Write-Host ""
Write-Host "🔧 If Chrome path is different, right-click shortcuts → Properties to update" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")