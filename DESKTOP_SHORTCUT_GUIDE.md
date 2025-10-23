# Desktop Shortcut Setup for TNT Applicator App (Smart Mode)

## Option 1: Smart Launcher (RECOMMENDED - Conflict-Free!)

1. **Right-click on your Desktop** → New → Shortcut
2. **For the location, enter:**
   ```
   "c:\Users\Guy\TNT App\data\TNT React\start-tnt-app.bat"
   ```
3. **Click Next**
4. **Name it:** `TNT Applicator (Smart)`
5. **Click Finish**

**What it does:**
- ✅ Automatically resolves port conflicts
- ✅ Uses alternative ports if needed (5173, 5175)
- ✅ Kills conflicting processes safely
- ✅ Opens browser automatically
- ✅ Shows which port is being used
- ✅ **NO MORE REBOOTS NEEDED!**

## Option 2: Smart Kiosk Mode (RECOMMENDED for Kiosk!)

1. **Right-click on your Desktop** → New → Shortcut
2. **For the location, enter:**
   ```
   "c:\Users\Guy\TNT App\data\TNT React\start-tnt-kiosk.bat"
   ```
3. **Click Next**
4. **Name it:** `TNT Kiosk (Smart)`
5. **Click Finish**

**What it does:**
- ✅ Smart conflict resolution
- ✅ Opens in full-screen kiosk mode
- ✅ Adapts to available ports automatically
- ✅ Perfect for touch screens
- ✅ **ELIMINATES app conflicts!**

## Option 3: Advanced Smart Mode

1. **Right-click on your Desktop** → New → Shortcut
2. **For the location, enter:**
   ```
   "c:\Users\Guy\TNT App\data\TNT React\start-tnt-smart.bat"
   ```
3. **Click Next**
4. **Name it:** `TNT Advanced Smart`
5. **Click Finish**

## Option 4: Process Manager (Troubleshooting)

1. **Right-click on your Desktop** → New → Shortcut
2. **For the location, enter:**
   ```
   "c:\Users\Guy\TNT App\data\TNT React\tnt-process-manager.bat"
   ```
3. **Click Next**
4. **Name it:** `TNT Process Manager`
5. **Click Finish**

**Use this when:**
- Need to check what's running
- Want to manually kill processes
- Troubleshooting conflicts

## ⚡ SMART MODE BENEFITS:

### 🔧 **Conflict Resolution**:
- **Automatically detects** port conflicts (5173, 5174)
- **Kills conflicting processes** safely (no more manual cleanup)
- **Uses alternative ports** (5175, 5176) if needed
- **Shows which port** is being used

### 🚀 **No More Reboots**:
- **Zero downtime** between app switches
- **Instant recovery** from conflicts
- **Works with any PowerShell app** that might conflict
- **Safe process management**

### 📊 **Smart Detection**:
- Checks port availability before starting
- Waits for processes to fully terminate
- Provides clear status messages
- Shows real-time port usage

## 🎯 **RECOMMENDED SETUP**:

1. **Replace your current shortcut** with Option 1 (Smart Launcher)
2. **Keep the Process Manager** shortcut for troubleshooting
3. **Test with your other PowerShell app** - no more conflicts!

## 🔧 **How Smart Mode Works**:

## 🔧 **How Smart Mode Works**:

1. **Scans for conflicts**: Checks ports 5173-5174 for existing processes
2. **Safe cleanup**: Kills only conflicting processes (not all Node.js)
3. **Port selection**: Uses 5173 if available, falls back to 5175
4. **Verification**: Confirms port is free before starting
5. **Browser launch**: Opens to the correct port automatically

## ✅ **What This Solves**:
- ❌ "App won't start - port in use"
- ❌ "Need to reboot to fix conflicts"
- ❌ "PowerShell apps interfere with each other"
- ❌ "Manual process killing required"

## 📋 **Old vs New Shortcuts**:

| Old Method | Smart Method |
|------------|--------------|
| Fixed port 5173 | Dynamic port selection |
| Kill ALL Node.js | Kill only conflicts |
| Manual cleanup | Automatic resolution |
| Reboot required | Instant recovery |

## 🚀 **Quick Setup**:

**Right now, update your desktop shortcut**:
1. Right-click your existing TNT shortcut → Properties
2. Change Target to: `"c:\Users\Guy\TNT App\data\TNT React\start-tnt-app.bat"`
3. Click OK
4. **Done!** Your shortcut now uses Smart Mode

## Testing Your Smart Shortcut:

## Testing Your Smart Shortcut:

1. **Start your other PowerShell app first** (the one that causes conflicts)
2. **Double-click your TNT shortcut**
3. **Watch the smart resolution**:
   - "Checking for conflicts and cleaning up..."
   - "Port 5173 still occupied, using alternative port 5175..."
   - "Opening browser on port 5175..."
4. **Success!** Both apps running without conflicts

## 🛠️ **Troubleshooting**:

**If shortcut doesn't work:**
1. Right-click shortcut → "Run as administrator"
2. Check that file path is correct
3. Use Process Manager shortcut to check status
4. Verify Node.js is installed

**If conflicts persist:**
1. Use `tnt-process-manager.bat`
2. Choose option 1 (Kill all Node.js processes)
3. Try your shortcut again

**For PowerShell execution issues:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 🎉 **You're All Set!**

Your shortcut now uses **Smart Mode** and will:
- ✅ **Never conflict** with other apps
- ✅ **Auto-resolve** port issues  
- ✅ **Work every time** without reboots
- ✅ **Show clear status** messages