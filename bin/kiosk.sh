#!/bin/sh

xset s noblank
xset s off
xset -dpms

/usr/bin/chromium-browser --app="http://localhost:8000" \
  --kiosk \
  --noerrdialogs \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --check-for-update-interval=604800 \
  --disable-pinch \
  --force-device-scale-factor=0.79 \
  --disable-gpu
