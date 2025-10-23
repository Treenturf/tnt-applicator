# TNT Whiteboard Desktop Shortcuts Setup

## 🚀 **Quick Setup (Recommended)**

### **Step 1: Create Server Shortcut**
1. **Right-click on Desktop** → New → Shortcut
2. **Target:**
   ```
   "c:\Users\Guy\TNT App\data\TNT React\start-whiteboard-smart.bat"
   ```
3. **Name:** `TNT Whiteboard Server`
4. **Click Finish**

### **Step 2: Create Office View Shortcut**
1. **Right-click on Desktop** → New → Shortcut
2. **Target:**
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://10.10.20.218:5175
   ```
3. **Name:** `TNT Whiteboard - Office`
4. **Click Finish**

### **Step 3: Create Kiosk View Shortcut**
1. **Right-click on Desktop** → New → Shortcut
2. **Target:**
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk http://10.10.20.218:5175/kiosk
   ```
3. **Name:** `TNT Whiteboard - Kiosk`
4. **Click Finish**

---

## 🎯 **How to Use**

### **Starting the Whiteboard:**
1. **Double-click "TNT Whiteboard Server"** first
2. **Wait for it to say "TNT WHITEBOARD IS NOW RUNNING"**
3. **Note the port number** it shows (usually 5175 or 5176)
4. **Double-click either Office or Kiosk shortcut**

### **If Port Changes:**
If the server starts on a different port (like 5176), update your browser shortcuts:
1. **Right-click shortcut** → Properties
2. **Change the port number** in Target field
3. **Click OK**

---

## 🔧 **Smart Features**

### **Automatic Conflict Resolution:**
- ✅ Detects port conflicts automatically
- ✅ Uses alternative ports (5175 → 5176)
- ✅ Kills conflicting processes safely
- ✅ No manual cleanup needed

### **Status Monitoring:**
- Shows which port is being used
- Displays server status clearly
- Provides network URLs for remote access
- Auto-installs dependencies if needed

---

## 🌐 **Network Access**

### **From Other Computers:**
- **Office View:** `http://10.10.20.218:5175`
- **Kiosk View:** `http://10.10.20.218:5175/kiosk`
- **Amy's Notifications:** Uses port 5174

### **Firewall Note:**
Make sure Windows Firewall allows connections on ports 5174-5176 for network access.

---

## 🛠️ **Alternative Chrome Paths**

If Chrome is installed elsewhere, update the shortcuts:

**Common Chrome Locations:**
```
"C:\Program Files\Google\Chrome\Application\chrome.exe"
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
"C:\Users\%USERNAME%\AppData\Local\Google\Chrome\Application\chrome.exe"
```

**For Microsoft Edge:**
```
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
```

---

## 🎨 **Adding Icons (Optional)**

1. **Right-click shortcut** → Properties
2. **Click "Change Icon..."**
3. **Browse to:** `c:\Users\Guy\TNT App\whiteboard app\public\`
4. **Select icon file** (if available)
5. **Click OK**

---

## ✅ **Testing Your Setup**

1. **Start the server shortcut**
2. **Verify it shows "RUNNING" status**
3. **Note the port number**
4. **Test office shortcut** - should open clean window
5. **Test kiosk shortcut** - should open fullscreen

**Success!** Your whiteboard is now accessible from any computer on the network.