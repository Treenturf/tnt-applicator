# Raspberry Pi Kiosk Setup Guide

## Your Network Information
- **PC IP Address**: `10.10.20.218`
- **Vite Dev Server**: `http://10.10.20.218:5173`

---

## Method 1: Network Access (Quick & Easy) ⚡

### On Your Windows PC:

1. **Start the development server**:
   ```powershell
   npm run dev
   ```

2. **Verify server is accessible**:
   - Server will show: `Network: http://10.10.20.218:5173`
   - This means it's accessible from other devices on your network

### On Your Raspberry Pi:

1. **Open Chromium browser** (should already be installed)

2. **Navigate to**: `http://10.10.20.218:5173`

3. **Set up full-screen kiosk mode**:
   ```bash
   # First, create the directory if it doesn't exist
   mkdir -p ~/.config/lxsession/LXDE-pi
   
   # Now edit the autostart file
   nano ~/.config/lxsession/LXDE-pi/autostart
   
   # Add these lines:
   @xset s off
   @xset -dpms
   @xset s noblank
   @chromium-browser --kiosk --app=http://10.10.20.218:5173
   ```

4. **Reboot Pi**:
   ```bash
   sudo reboot
   ```

---

## Method 2: Deploy to Raspberry Pi (Production) 🚀

### Step 1: Build the App

On your Windows PC:
```powershell
# Build the production version
npm run build

# This creates a 'dist' folder with optimized files
```

### Step 2: Copy to Raspberry Pi

```powershell
# Using SCP (if you have it installed)
scp -r dist pi@RASPBERRY_PI_IP:/home/pi/tnt-app

# Or use WinSCP (GUI tool) to copy the 'dist' folder to Pi
```

### Step 3: Set Up Web Server on Pi

SSH into your Raspberry Pi:
```bash
# Install a simple HTTP server
sudo apt-get update
sudo apt-get install -y nginx

# Copy built files to nginx
sudo cp -r /home/pi/tnt-app/dist/* /var/www/html/

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 4: Configure Kiosk Mode

```bash
# First, create the directory if it doesn't exist
mkdir -p ~/.config/lxsession/LXDE-pi

# Edit autostart
nano ~/.config/lxsession/LXDE-pi/autostart

# Add:
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --app=http://localhost
```

---

## Method 3: Standalone Node Server on Pi 🔧

### Step 1: Install Node.js on Pi

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Copy Project to Pi

```powershell
# From Windows PC, copy entire project
scp -r "C:\Users\Guy\TNT App\data\TNT React" pi@RASPBERRY_PI_IP:/home/pi/tnt-app
```

### Step 3: Install & Run on Pi

```bash
# SSH into Pi
cd /home/pi/tnt-app

# Install dependencies
npm install

# Build for production
npm run build

# Install serve to host the built app
npm install -g serve

# Run the app
serve -s dist -l 80
```

### Step 4: Auto-start on Boot

Create a systemd service:
```bash
sudo nano /etc/systemd/system/tnt-app.service
```

Add this content:
```ini
[Unit]
Description=TNT Application Kiosk
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/tnt-app/dist
ExecStart=/usr/bin/serve -s /home/pi/tnt-app/dist -l 80
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable tnt-app
sudo systemctl start tnt-app
sudo systemctl status tnt-app
```

---

## Chromium Kiosk Mode Setup (All Methods) 🖥️

### Basic Kiosk Configuration

```bash
# Create autostart directory if it doesn't exist
mkdir -p ~/.config/lxsession/LXDE-pi

# Edit autostart
nano ~/.config/lxsession/LXDE-pi/autostart
```

Add these lines:
```bash
# Disable screen saver and power management
@xset s off
@xset -dpms
@xset s noblank

# Hide mouse cursor after inactivity
@unclutter -idle 0.1 -root

# Start Chromium in kiosk mode
@chromium-browser --kiosk --app=http://10.10.20.218:5173 \
  --start-fullscreen \
  --window-position=0,0 \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-features=TranslateUI \
  --no-first-run \
  --check-for-update-interval=31536000
```

### Advanced: Multi-Kiosk Setup

For multiple Pi devices, each as a different kiosk:

**Pi 1 - Standard Applications**:
```bash
@chromium-browser --kiosk --app=http://10.10.20.218:5173 \
  --user-data-dir=/home/pi/.config/chromium-kiosk1
```

**Pi 2 - Specialty Apps**:
```bash
@chromium-browser --kiosk --app=http://10.10.20.218:5173 \
  --user-data-dir=/home/pi/.config/chromium-kiosk2
```

**Pi 3 - Dry Fertilizer**:
```bash
@chromium-browser --kiosk --app=http://10.10.20.218:5173 \
  --user-data-dir=/home/pi/.config/chromium-kiosk3
```

---

## Troubleshooting 🔍

### Can't Access from Pi

1. **Check Windows Firewall**:
   ```powershell
   # Allow port 5173 through firewall
   New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
   ```

2. **Verify dev server is running**:
   ```powershell
   npm run dev
   ```
   Look for: `Network: http://10.10.20.218:5173`

3. **Test from another device**:
   - Open `http://10.10.20.218:5173` on your phone or another computer

### Pi Screen Goes Black

```bash
# Disable screen blanking
sudo nano /etc/lightdm/lightdm.conf

# Add under [Seat:*]:
xserver-command=X -s 0 -dpms
```

### Touch Screen Not Working

```bash
# Install touch screen drivers
sudo apt-get install xserver-xorg-input-evdev

# Reboot
sudo reboot
```

### Need to Exit Kiosk Mode

Press: `Alt + F4` or `Ctrl + Alt + F2` (switch to terminal), then login and kill chromium:
```bash
pkill chromium
```

---

## Quick Start Commands 🚀

### Windows PC:
```powershell
# Start dev server
npm run dev

# The server will show your IP: http://10.10.20.218:5173
```

### Raspberry Pi:
```bash
# Quick test in browser
chromium-browser --kiosk http://10.10.20.218:5173

# Or just open browser and go to:
# http://10.10.20.218:5173
```

---

## Recommended Setup for Your Use Case 💡

**For Development/Testing**: Use Method 1 (Network Access)
- Quick to set up
- Easy to update (just save files on PC)
- Changes reflect immediately

**For Production**: Use Method 2 (Deploy to Pi)
- Doesn't require PC to be running
- Faster performance
- More reliable
- Works if PC is offline

---

## Notes

- Each Raspberry Pi can be configured as a different kiosk type (Standard, Specialty, or Dry)
- The kiosk configuration is saved in browser localStorage
- First time setup: Login as admin and select kiosk type
- After configuration, the Pi will remember its kiosk type
