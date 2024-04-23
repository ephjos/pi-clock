#!/bin/bash

rsync -avhH --delete dist/* pi-clock:/var/www/html
rsync -avhH --delete bin/* pi-clock:/usr/local/bin
rsync -avhH --delete services/* pi-clock:/etc/systemd/system

ssh pi-clock '\
  systemctl daemon-reload; \
  systemctl enable pi-clock-server.service; \
  systemctl enable kiosk.service; \
  systemctl restart pi-clock-server.service; \
  systemctl restart kiosk.service \
  '

