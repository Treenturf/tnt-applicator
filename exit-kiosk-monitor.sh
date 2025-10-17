#!/bin/bash
# Exit Kiosk Monitor Script
# This script monitors the Chromium window title for the exit signal
# Place in /home/tnt/exit-kiosk-monitor.sh and make executable

while true; do
    # Check if Chromium is showing the exit-kiosk page
    TITLE=$(xdotool search --name "Exit Kiosk" 2>/dev/null)
    
    if [ ! -z "$TITLE" ]; then
        echo "Exit signal detected - closing Chromium"
        pkill chromium
        break
    fi
    
    # Check every second
    sleep 1
done
