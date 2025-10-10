# Desktop Shortcut Setup for TNT Applicator App

## Option 1: Basic Launcher (Updated - Now Opens Browser!)

1. **Right-click on your Desktop** → New → Shortcut
2. **For the location, enter:**
   ```
   "c:\Users\Guy\TNT App\data\TNT React\start-tnt-app.bat"
   ```
3. **Click Next**
4. **Name it:** `TNT Applicator`
5. **Click Finish**

**What it does:**
- ✅ Starts the development server
- ✅ Automatically opens browser after 5 seconds
- ✅ Shows command window for status
- ✅ Simple and reliable

## Option 2: Kiosk Mode Launcher (Recommended for Kiosk!)

1. **Right-click on your Desktop** → New → Shortcut
2. **For the location, enter:**
   ```
   "c:\Users\Guy\TNT App\data\TNT React\start-tnt-kiosk.bat"
   ```
3. **Click Next**
4. **Name it:** `TNT Kiosk`
5. **Click Finish**

**What it does:**
- ✅ Starts the development server
- ✅ Opens in full-screen kiosk mode (Chrome/Edge)
- ✅ Professional kiosk interface
- ✅ Status monitoring
- ✅ Perfect for touch screens

## Option 2: PowerShell Script Shortcut (More Advanced)

1. **Right-click on your Desktop** → New → Shortcut
2. **For the location, enter:**
   ```
   powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File "c:\Users\Guy\TNT App\data\TNT React\start-tnt-app.ps1"
   ```
3. **Click Next**
4. **Name it:** `TNT Applicator (Auto-Open)`
5. **Click Finish**

## Option 3: Direct Browser Shortcut (If Server is Always Running)

1. **Right-click on your Desktop** → New → Shortcut
2. **For the location, enter:**
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --new-window --kiosk "http://localhost:5173"
   ```
   (Adjust Chrome path if different, or use Edge: `msedge --new-window --kiosk "http://localhost:5173"`)
3. **Click Next**
4. **Name it:** `TNT Kiosk Mode`
5. **Click Finish**

## For Kiosk Mode (Full Screen Browser)

If you want true kiosk mode where users can't navigate away:

1. Use Option 3 above with the `--kiosk` flag
2. Or modify the PowerShell script to open in kiosk mode:

Replace the browser opening line in `start-tnt-app.ps1` with:
```powershell
Start-Process "chrome.exe" -ArgumentList "--kiosk", "http://localhost:5173"
```

## What Each Option Does:

- **Option 1 (Batch)**: Simple, shows command window, good for troubleshooting
- **Option 2 (PowerShell)**: Automatically opens browser, hides command window
- **Option 3 (Direct)**: Only works if server is already running, instant launch

## Recommended for Your Kiosk:

Use **Option 2** for the best user experience:
- Automatically starts the server
- Opens the browser automatically
- Can be configured for kiosk mode
- Professional appearance

## Testing Your Shortcut:

1. Double-click the shortcut
2. Wait 5-10 seconds for the server to start
3. Browser should open to http://localhost:5173
4. You should see the TNT login screen with 4-digit code input

## Troubleshooting:

If the shortcut doesn't work:
1. Make sure Node.js is installed and npm is in your PATH
2. Try running the batch file directly first
3. Check that the file paths in the shortcut are correct
4. For PowerShell issues, you may need to enable script execution:
   ```
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```