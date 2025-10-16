# SSH Setup for Raspberry Pi - Windows to Pi Copy/Paste

## Enable SSH on Raspberry Pi (One Time Setup)

1. On the Pi, click **Raspberry Menu** (top-left)
2. **Preferences** → **Raspberry Pi Configuration**
3. Go to **Interfaces** tab
4. Enable **SSH**
5. Click **OK**

## Get Your Pi's IP Address

On the Pi terminal, type:
```bash
hostname -I
```

Example output: `10.10.20.150` ← This is your Pi's IP

## Connect from Windows PC

Open PowerShell on Windows:
```powershell
ssh pi@10.10.20.150
```
(Replace `10.10.20.150` with YOUR Pi's IP)

**Default password:** `raspberry`

## Now You Can Copy/Paste!

Once connected via SSH:
- **Copy on Windows:** Ctrl + C (normal)
- **Paste in SSH:** Right-click in the PowerShell window
- **Copy from SSH:** Just highlight text (auto-copies)

---

## Quick Setup Command (Copy This Entire Block)

Once connected via SSH, copy and paste this:

```bash
mkdir -p ~/.config/lxsession/LXDE-pi && cat > ~/.config/lxsession/LXDE-pi/autostart << 'EOF'
@xset s off
@xset -dpms
@xset s noblank
@chromium-browser --kiosk --app=http://10.10.20.218:5173
EOF
```

Press Enter, then verify it worked:

```bash
cat ~/.config/lxsession/LXDE-pi/autostart
```

You should see the 4 lines. Then reboot:

```bash
sudo reboot
```

---

## Alternative: VNC (Full Desktop Remote Control)

If you want to see the Pi desktop from Windows with mouse control:

### On Pi:
1. Raspberry Menu → Preferences → Raspberry Pi Configuration
2. Interfaces tab → Enable **VNC**
3. Click OK

### On Windows:
1. Download VNC Viewer: https://www.realvnc.com/en/connect/download/viewer/
2. Install and open
3. Connect to Pi's IP address
4. Full copy/paste works!

---

## The 4 Lines (Copy These if Typing Manually)

```
@xset s off
@xset -dpms  
@xset s noblank
@chromium-browser --kiosk --app=http://10.10.20.218:5173
```

Each line starts with `@` and has NO extra spaces!
