# Raspberry Pi Autostart Troubleshooting Guide

## If You Get "No such file or directory" Error

This means your Raspberry Pi might be using a different desktop environment. Let's find the right location.

---

## Step 1: Find Your Desktop Environment

On your Raspberry Pi terminal, type:

```bash
echo $DESKTOP_SESSION
```

**Common results:**
- `LXDE-pi` - Standard Raspberry Pi OS
- `LXDE` - Older Raspberry Pi OS
- `openbox` - Minimal installation
- `wayfire` - Newer Raspberry Pi OS (Wayland)

---

## Step 2: Use the Correct Path Based on Your Result

### If you got `LXDE-pi`:
```bash
mkdir -p ~/.config/lxsession/LXDE-pi
nano ~/.config/lxsession/LXDE-pi/autostart
```

### If you got `LXDE`:
```bash
mkdir -p ~/.config/lxsession/LXDE
nano ~/.config/lxsession/LXDE/autostart
```

### If you got `wayfire` (Raspberry Pi OS Bookworm or newer):
```bash
nano ~/.config/wayfire.ini
```

Then add at the bottom:
```ini
[autostart]
chromium = chromium-browser --kiosk --app=http://10.10.20.218:5173
```

### If you got `openbox`:
```bash
mkdir -p ~/.config/openbox
nano ~/.config/openbox/autostart
```

---

## Alternative Method: Use the Global Autostart (Works for All)

If the above doesn't work, use the system-wide autostart:

```bash
# Check if this directory exists
ls -la /etc/xdg/lxsession/

# You should see a folder name - use that!
# Then create your autostart file:
mkdir -p ~/.config/lxsession/[FOLDER_NAME_YOU_SAW]
nano ~/.config/lxsession/[FOLDER_NAME_YOU_SAW]/autostart
```

---

## Easiest Method: Create a Desktop Autostart Entry

This works on ALL Raspberry Pi versions:

```bash
# Create the autostart directory
mkdir -p ~/.config/autostart

# Create the autostart file
nano ~/.config/autostart/tnt-kiosk.desktop
```

Add this content:
```ini
[Desktop Entry]
Type=Application
Name=TNT Kiosk
Exec=chromium-browser --kiosk --app=http://10.10.20.218:5173 --start-fullscreen --disable-infobars --no-first-run
X-GNOME-Autostart-enabled=true
```

Save with `Ctrl + X`, then `Y`, then `Enter`.

Also disable screen blanking:
```bash
nano ~/.config/autostart/disable-screensaver.desktop
```

Add:
```ini
[Desktop Entry]
Type=Application
Name=Disable Screensaver
Exec=xset s off && xset -dpms && xset s noblank
X-GNOME-Autostart-enabled=true
```

---

## Check What You Actually Have

Run these commands to see what exists:

```bash
# Check your home directory structure
ls -la ~/

# Check config directory
ls -la ~/.config/

# Check if lxsession exists
ls -la ~/.config/lxsession/

# Check system-wide locations
ls -la /etc/xdg/lxsession/
```

---

## Super Simple Method (No Directory Creation Needed)

Just add the command to your bash profile:

```bash
nano ~/.bashrc
```

Add this line at the very bottom:
```bash
# Auto-start TNT kiosk on login
if [ -z "$SSH_CLIENT" ] && [ -z "$SSH_TTY" ]; then
  chromium-browser --kiosk --app=http://10.10.20.218:5173 &
fi
```

This will start the kiosk every time the Pi desktop loads!

---

## Test First Before Auto-Starting

Before setting up auto-start, test the command manually:

```bash
chromium-browser --kiosk --app=http://10.10.20.218:5173
```

If this works, THEN set up auto-start.

If it doesn't work, you might need to install Chromium:
```bash
sudo apt-get update
sudo apt-get install -y chromium-browser
```

---

## What Information Do I Need?

Reply with the output of these commands:

```bash
echo "Desktop Session:"
echo $DESKTOP_SESSION

echo -e "\nConfig Directory:"
ls -la ~/.config/

echo -e "\nSystem LXDE Sessions:"
ls -la /etc/xdg/lxsession/
```

Then I can give you the EXACT commands for your specific setup!

---

## Quick Copy-Paste Solution (Works on 95% of Raspberry Pis)

Try this all-in-one command:

```bash
mkdir -p ~/.config/autostart && cat > ~/.config/autostart/tnt-kiosk.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=TNT Kiosk
Exec=chromium-browser --kiosk --app=http://10.10.20.218:5173 --start-fullscreen --disable-infobars --no-first-run
X-GNOME-Autostart-enabled=true
EOF
```

Then reboot:
```bash
sudo reboot
```

This creates the autostart entry in one command - no nano needed!
