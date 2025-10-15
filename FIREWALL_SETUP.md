# Windows Firewall Setup for Raspberry Pi Access

## Quick Manual Setup (Recommended)

1. **Open Windows Defender Firewall**:
   - Press `Win + R`
   - Type: `wf.msc`
   - Press Enter

2. **Create Inbound Rule**:
   - Click "Inbound Rules" (left sidebar)
   - Click "New Rule..." (right sidebar)
   - Select "Port" → Click Next
   - Select "TCP" and enter port: `5173`
   - Click Next
   - Select "Allow the connection"
   - Click Next
   - Check all boxes (Domain, Private, Public)
   - Click Next
   - Name: `Vite Dev Server - TNT App`
   - Click Finish

## Or Use This PowerShell Command (Run as Administrator)

```powershell
# Right-click PowerShell → "Run as Administrator"
New-NetFirewallRule -DisplayName "Vite Dev Server - TNT App" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

## Verify It's Working

1. **Start the dev server**:
   ```powershell
   npm run dev
   ```

2. **Look for this line in the output**:
   ```
   Network: http://10.10.20.218:5173
   ```

3. **Test from another device**:
   - On your phone or another computer
   - Open browser and go to: `http://10.10.20.218:5173`
   - You should see the TNT app!

## Your Network Details

- **PC IP Address**: `10.10.20.218`
- **Dev Server URL**: `http://10.10.20.218:5173`
- **Port**: `5173`

## Next Steps

Once firewall is configured:
1. Start dev server on Windows PC: `npm run dev`
2. On Raspberry Pi, open Chromium browser
3. Navigate to: `http://10.10.20.218:5173`
4. Log in as admin and configure kiosk type
5. See full setup instructions in `RASPBERRY_PI_SETUP.md`
