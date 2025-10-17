# Kiosk Exit Button Setup Guide

This guide explains how to set up the admin-only exit button for kiosk mode on the Raspberry Pi.

## What Was Added

1. **Exit Kiosk Button** - Visible only to admin users in the Dashboard
2. **Exit Endpoint Script** - Small HTTP server on the Pi that can close Chromium
3. **Fallback Page** - Static page shown if the endpoint isn't available

## Setup on Raspberry Pi

### Step 1: Copy the Exit Script to the Pi

From your Windows PC, copy the exit script to the Pi:

```bash
scp exit-kiosk-pi.sh tnt@10.10.20.219:/home/tnt/
```

### Step 2: Make the Script Executable

SSH into the Pi and make it executable:

```bash
ssh tnt@10.10.20.219
chmod +x /home/tnt/exit-kiosk-pi.sh
```

### Step 3: Update Autostart to Run the Exit Script

Edit the autostart file:

```bash
nano ~/.config/labwc/autostart
```

Update it to look like this:

```bash
# Rotate screen 90 degrees
wlr-randr --output HDMI-A-1 --transform 90 &

# Start the exit kiosk listener
/home/tnt/exit-kiosk-pi.sh &

# Wait for network and desktop to be ready, then start kiosk
sleep 30 && /usr/bin/chromium --kiosk --app=http://10.10.20.218:5173 --password-store=basic &
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

### Step 4: Test the Setup

1. Reboot the Pi:
   ```bash
   sudo reboot
   ```

2. After reboot, the kiosk should start automatically

3. Log in as an admin user (Guy's code)

4. You should see the "Exit Kiosk" button next to the Logout button

5. Click it - Chromium should close and return to desktop

## How It Works

1. When the Pi boots:
   - Screen rotates 90°
   - Exit listener script starts on port 8888
   - Chromium launches in kiosk mode after 30 seconds

2. When admin clicks "Exit Kiosk":
   - React app sends request to `http://localhost:8888/exit`
   - Exit script receives the request
   - Script runs `pkill chromium`
   - Chromium closes, returning to desktop

3. Fallback if script isn't running:
   - Browser navigates to `/exit-kiosk.html`
   - Page shows "Press Alt+F4 to exit" message

## Troubleshooting

### Button doesn't appear
- Make sure you're logged in as an admin user
- Check the browser console for errors

### Button appears but doesn't work
- Check if the exit script is running:
  ```bash
  ps aux | grep exit-kiosk
  ```
- Check if port 8888 is listening:
  ```bash
  netstat -tuln | grep 8888
  ```

### Exit script not starting on boot
- Check autostart file:
  ```bash
  cat ~/.config/labwc/autostart
  ```
- Check for errors:
  ```bash
  journalctl --user -u labwc
  ```

### Manual exit methods
- Alt+F4 (if keyboard connected)
- SSH into Pi and run: `pkill chromium`
- Restart the Pi: `sudo reboot`

## Production Deployment

For production on the Pi itself (not using the dev server):

1. Build the React app:
   ```bash
   npm run build
   ```

2. Copy the `dist` folder to the Pi:
   ```bash
   scp -r dist tnt@10.10.20.219:/home/tnt/tnt-app/
   ```

3. Install a simple web server on the Pi:
   ```bash
   ssh tnt@10.10.20.219
   sudo apt install python3 -y
   ```

4. Create a start script on the Pi:
   ```bash
   nano ~/start-web-server.sh
   ```

   Add:
   ```bash
   #!/bin/bash
   cd /home/tnt/tnt-app/dist
   python3 -m http.server 5173
   ```

   Make executable:
   ```bash
   chmod +x ~/start-web-server.sh
   ```

5. Update autostart to use localhost:
   ```bash
   nano ~/.config/labwc/autostart
   ```

   Change:
   ```bash
   # Rotate screen
   wlr-randr --output HDMI-A-1 --transform 90 &

   # Start web server
   /home/tnt/start-web-server.sh &

   # Start exit listener
   /home/tnt/exit-kiosk-pi.sh &

   # Start kiosk (now pointing to localhost)
   sleep 30 && /usr/bin/chromium --kiosk --app=http://localhost:5173 --password-store=basic &
   ```

This makes the kiosk fully self-contained and doesn't require the Windows PC to be running.
