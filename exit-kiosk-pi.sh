#!/bin/bash
# Simple Kiosk Exit Script for Raspberry Pi (Wayland)
# This script provides a simple HTTP endpoint to exit kiosk mode
# 
# Usage on Pi:
# 1. Copy this file to /home/tnt/exit-kiosk.sh
# 2. Make it executable: chmod +x /home/tnt/exit-kiosk.sh
# 3. Run it in background: /home/tnt/exit-kiosk.sh &
# 4. Add to autostart before launching Chromium
#
# From the React app, make a fetch request to http://localhost:8888/exit

PORT=8888

echo "Starting kiosk exit listener on port $PORT..."

# Simple HTTP server that exits Chromium when accessed
while true; do
    RESPONSE="HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<h1>Exiting Kiosk...</h1>"
    
    # Listen for connection
    echo -e "$RESPONSE" | nc -l -p $PORT -q 1 > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "Exit request received - closing Chromium"
        pkill chromium
        exit 0
    fi
    
    sleep 0.1
done
