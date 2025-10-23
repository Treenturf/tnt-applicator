# Create Desktop Shortcut for Whiteboard Restart

$Desktop = [Environment]::GetFolderPath("Desktop")
$WshShell = New-Object -ComObject WScript.Shell

Write-Host "Creating Whiteboard Restart shortcut..." -ForegroundColor Yellow

$RestartShortcut = $WshShell.CreateShortcut("$Desktop\🔄 Restart Whiteboard.lnk")
$RestartShortcut.TargetPath = "powershell.exe"
$RestartShortcut.Arguments = "-ExecutionPolicy Bypass -File `"c:\Users\Guy\TNT App\data\TNT React\restart-whiteboard.ps1`""
$RestartShortcut.WorkingDirectory = "c:\Users\Guy\TNT App\data\TNT React"
$RestartShortcut.Description = "Restart TNT Whiteboard Server"
$RestartShortcut.Save()

Write-Host "✅ Restart shortcut created on desktop!" -ForegroundColor Green