#!/bin/sh

mkdir -p /var/www/html
cd /var/www/html
python3 -m http.server

