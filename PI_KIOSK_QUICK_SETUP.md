# Raspberry Pi Kiosk Mode - Step-by-Step Guide

## Method 1: Using Pi Desktop (Easiest for Beginners) 🖱️

### Step 1: Open Terminal on the Pi

1. **Boot up your Raspberry Pi** (connect monitor, keyboard, mouse)
2. **Click the terminal icon** in the top menu bar (looks like a black screen with `>_`)
   - Or press: `Ctrl + Alt + T`

### Step 2: Create/Edit the Autostart File

In the terminal, type this command and press Enter:

```bash
nano ~/.config/lxsession/LXDE-pi/autostart
```

**What this does:**
- `nano` = Simple text editor (like Notepad)
- `~/.config/lxsession/LXDE-pi/autostart` = File path that controls what starts when Pi boots

### Step 3: Add the Kiosk Configuration

The nano editor will open. Use arrow keys to move around. Add these lines:

```bash
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --app=http://10.10.20.218:5173
```

**What each line does:**
- `@xset s off` - Turns off screen saver
- `@xset -dpms` - Prevents monitor from going to sleep
- `@xset s noblank` - Prevents screen from blanking
- `@chromium-browser --kiosk --app=...` - Opens your TNT app in full-screen mode

### Step 4: Save and Exit

1. Press `Ctrl + X` to exit
2. Press `Y` to confirm save
3. Press `Enter` to confirm filename

### Step 5: Reboot the Pi

```bash
sudo reboot
```

**After reboot:**
- Pi will automatically open Chromium in full-screen kiosk mode
- Your TNT app will load at `http://10.10.20.218:5173`
- No desktop, just your app!

---

## Method 2: Using SSH from Your Windows PC 💻

### Step 1: Enable SSH on Raspberry Pi (One-Time Setup)

On the Pi desktop:
1. Click **Raspberry menu** (top-left)
2. Go to **Preferences** → **Raspberry Pi Configuration**
3. Click **Interfaces** tab
4. Enable **SSH**
5. Click **OK**

### Step 2: Find Your Pi's IP Address

On the Pi, open terminal and type:
```bash
hostname -I
```

Example output: `10.10.20.150` (this is your Pi's IP)

### Step 3: Connect from Windows PC

On your Windows PC, open PowerShell and type:

```powershell
ssh pi@10.10.20.150
```

Replace `10.10.20.150` with your Pi's actual IP address.

**Default password:** `raspberry`

### Step 4: Edit Autostart File via SSH

Once connected via SSH, type:

```bash
nano ~/.config/lxsession/LXDE-pi/autostart
```

Add the same lines as Method 1, then:
- `Ctrl + X` to exit
- `Y` to save
- `Enter` to confirm

### Step 5: Reboot

```bash
sudo reboot
```

---

## Method 3: Using File Manager (GUI Method) 📁

### Step 1: Show Hidden Files

1. Open **File Manager** (folder icon in top menu)
2. Click **View** menu → Check **Show Hidden**

### Step 2: Navigate to the Folder

1. Click **Home** in the left sidebar
2. Navigate to: `.config` → `lxsession` → `LXDE-pi`
3. Look for file named `autostart`

### Step 3: Edit with Text Editor

1. **Right-click** on `autostart`
2. Select **Text Editor** or **Open With** → **Text Editor**
3. Add the configuration lines
4. Click **File** → **Save**

---

## Troubleshooting 🔧

### "Directory doesn't exist"

If you get an error that the directory doesn't exist, create it:

```bash
mkdir -p ~/.config/lxsession/LXDE-pi
nano ~/.config/lxsession/LXDE-pi/autostart
```

### "Command not found: nano"

Try using a different editor:

```bash
# Using vi editor
vi ~/.config/lxsession/LXDE-pi/autostart

# Or using leafpad (GUI editor)
leafpad ~/.config/lxsession/LXDE-pi/autostart
```

### Can't Exit Kiosk Mode

If you get stuck in kiosk mode:

1. **Press:** `Alt + F4` to close browser
2. **Or press:** `Ctrl + Alt + F2` to switch to terminal
3. Login with username `pi` and your password
4. Type: `sudo reboot`

To prevent auto-start, edit the file before rebooting:
```bash
nano ~/.config/lxsession/LXDE-pi/autostart
```
Comment out the chromium line by adding `#` at the start:
```bash
# @chromium-browser --kiosk --app=http://10.10.20.218:5173
```

---

## Quick Reference 📋

### Nano Editor Keyboard Shortcuts

- `Ctrl + X` - Exit nano
- `Ctrl + O` - Save file (write Out)
- `Ctrl + K` - Cut line
- `Ctrl + U` - Paste line
- `Ctrl + W` - Search
- Arrow keys - Navigate

### Vi Editor (if you need it)

- Press `i` - Enter insert mode (to type)
- Press `Esc` - Exit insert mode
- Type `:wq` then Enter - Save and quit
- Type `:q!` then Enter - Quit without saving

---

## Complete Setup Checklist ✅

- [ ] Windows firewall configured (port 5173)
- [ ] Dev server running on PC (`npm run dev`)
- [ ] Pi connected to same network
- [ ] Tested `http://10.10.20.218:5173` in Pi browser
- [ ] Created/edited autostart file
- [ ] Rebooted Pi
- [ ] Kiosk mode working
- [ ] Logged in as admin on Pi
- [ ] Selected kiosk type (Standard/Specialty/Dry)

---

## Example: Complete autostart File

Here's what your final autostart file should look like:

```bash
@lxpanel --profile LXDE-pi
@pcmanfm --desktop --profile LXDE-pi
@xscreensaver -no-splash

# Disable power management and screen saver
@xset s off
@xset -dpms
@xset s noblank

# Hide mouse cursor when inactive
@unclutter -idle 0.1 -root

# Start TNT app in kiosk mode
@chromium-browser --kiosk --app=http://10.10.20.218:5173 \
  --start-fullscreen \
  --window-position=0,0 \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --no-first-run
```

**Note:** The first 3 lines (lxpanel, pcmanfm, xscreensaver) might already be in the file. Keep them! Just add your new lines after them.

---

## Advanced: Multiple Kiosks

If you have multiple Raspberry Pis, use different user data directories so each remembers its kiosk type:

**Pi #1:**
```bash
@chromium-browser --kiosk --app=http://10.10.20.218:5173 --user-data-dir=/home/pi/.config/chromium-kiosk1
```

**Pi #2:**
```bash
@chromium-browser --kiosk --app=http://10.10.20.218:5173 --user-data-dir=/home/pi/.config/chromium-kiosk2
```

**Pi #3:**
```bash
@chromium-browser --kiosk --app=http://10.10.20.218:5173 --user-data-dir=/home/pi/.config/chromium-kiosk3
```

---

## Need Help?

- **nano editor guide:** Type `nano` and press `Ctrl + G` for help
- **Test before auto-start:** Open terminal and type the chromium command manually first
- **View logs:** If something goes wrong, check logs with `cat ~/.xsession-errors`
