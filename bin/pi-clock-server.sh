#!/bin/sh

mkdir -p /var/www/html
cd /var/www/html

python3 -m http.server -b 0.0.0.0

