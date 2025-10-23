# Create Smart Whiteboard Shortcuts - Auto-detect ports

Write-Host "Creating Smart Whiteboard Shortcuts..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

$Desktop = [Environment]::GetFolderPath("Desktop")
$WshShell = New-Object -ComObject WScript.Shell

# Remove old shortcuts if they exist
$oldShortcuts = @(
    "$Desktop\TNT Whiteboard - Office.lnk",
    "$Desktop\TNT Whiteboard - Kiosk.lnk"
)

foreach ($shortcut in $oldShortcuts) {
    if (Test-Path $shortcut) {
        Remove-Item $shortcut -Force
        Write-Host "Removed old shortcut: $(Split-Path $shortcut -Leaf)" -ForegroundColor Yellow
    }
}

# Create Smart Office Shortcut
Write-Host "Creating Smart Office shortcut..." -ForegroundColor Cyan
$OfficeShortcut = $WshShell.CreateShortcut("$Desktop\TNT Whiteboard - Office (Smart).lnk")
$OfficeShortcut.TargetPath = "powershell.exe"
$OfficeShortcut.Arguments = "-ExecutionPolicy Bypass -File `"c:\Users\Guy\TNT App\data\TNT React\open-whiteboard-office.ps1`""
$OfficeShortcut.WorkingDirectory = "c:\Users\Guy\TNT App\data\TNT React"
$OfficeShortcut.Description = "Smart TNT Whiteboard Office View - Auto-detects port"
$OfficeShortcut.Save()
Write-Host "Smart Office shortcut created" -ForegroundColor Green

# Create Smart Kiosk Shortcut
Write-Host "Creating Smart Kiosk shortcut..." -ForegroundColor Cyan
$KioskShortcut = $WshShell.CreateShortcut("$Desktop\TNT Whiteboard - Kiosk (Smart).lnk")
$KioskShortcut.TargetPath = "c:\Users\Guy\TNT App\data\TNT React\open-whiteboard-kiosk.bat"
$KioskShortcut.WorkingDirectory = "c:\Users\Guy\TNT App\data\TNT React"
$KioskShortcut.Description = "Smart TNT Whiteboard Kiosk View - Auto-detects port"
$KioskShortcut.Save()
Write-Host "Smart Kiosk shortcut created" -ForegroundColor Green

Write-Host ""
Write-Host "Smart shortcuts created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "What is New:" -ForegroundColor Cyan
Write-Host "- Auto-detects server port (5174, 5175, or 5176)" -ForegroundColor White
Write-Host "- Offers to start server if not running" -ForegroundColor White
Write-Host "- Works regardless of which port server uses" -ForegroundColor White
Write-Host ""