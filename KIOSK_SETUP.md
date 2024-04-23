# How to setup a RPI as a Kiosk

> From https://area-51.blog/2022/11/10/using-a-raspberry-pi-as-a-kiosk-for-home-assistant-or-grafana/

Using a Raspberry PI as a Kiosk for Home Assistant or Grafana
At the start of this year I bought the house I had been renting for the previous 14 years and since then I've been busy doing things like renovating and automating it.

How I've done that will be in a separate series of blog entries, however at it's heart is a Raspberry PI 4B with the official touch screen mounted at the top of a wall in the Kitchen running Home Assistant.

I also have a larger monitor mounted on a wall in my home office which has a Raspberry PI 2B which shows a Grafana dashboard for monitoring my home systems.

In both instances they are running as a kiosk so that when they boot up they automatically open a browser on a fixed page.

This guide covers how to setup a PI from scratch into a simple kiosk.

I use the vi editor here but you can substitute pico if you prefer that editor.

Initial Install
This guide is for a completely fresh install. If you don't want to wipe your Pi you can skip this section.

First, download the latest Raspberry Pi OS Lite image from the Raspberry PI site. We'll use this image as it means we have a lean system without anything we do not need. Once you have that, copy that to an SD card. They have the instructions on how to do this on their site.

Insert it into your PI with it connected to a monitor and keyboard and power it on.

When it boots it will show some menus on setting it up, primarily creating an account and it's password. Do that and you will get a login prompt.

Login with the user you just created and run raspi-config with sudo raspi-config and under Interface Options select SSH and enable it so you can log into it remotely. Once you have done that, exit raspi-config. If it asks you to reboot accept that and login again once it's back.

If you want to know what the IP address of your kiosk is, you can either look at your router/dhcp server or run the following line on the PI:

ip addr show eth0
You should see something like inet 192.168.0.42/22 so 192.168.0.42 will be your PI's address. With this you can then ssh into the pi remotely.

Now we need do an update to ensure we have all the latest updates:

sudo apt update
sudo apt upgrade -y
Finally we want to setup a minimal desktop environment. Run the following. Note, this is a single line. It will take some time so have a cup of coffee…

sudo apt install -y xserver-xorg raspberrypi-ui-mods lightdm chromium-browser
Configuring kiosk mode
Once this completes we need to make a couple of modifications, remove the screensaver and the mouse cursor as they get in the way.

Removing the screensaver is simply this line:

sudo apt remove xscreensaver xscreensaver-data
To remove the mouse cursor type sudo vi /etc/lightdm/lightdm.conf and find the following line:

#xserver-command=X
Replace that line with this:

xserver-command=X -nocursor
You might have seen some other guides say to install unclutter. This isn't necessary as adding -nocursor to the X server itself disables the cursor entirely.

Next we need to setup a service to start the browser in kiosk mode. Type sudo vi /usr/local/bin/kiosk.sh and enter the following script:

#!/bin/sh

xset s noblank
xset s off
xset -dpms

/usr/bin/chromium-browser --app="https://example.com/some-page.html" \
  --kiosk \
  --noerrdialogs \
  --disable-session-crashed-bubble \
  --disable-infobars \
  --check-for-update-interval=604800 \
  --disable-pinch \
  --force-device-scale-factor=0.79 \
  --disable-gpu
the --app= argument should point to the webpage you want the kiosk to open when it starts.

the --force-device-scale-factor=0.79 parameter is optional but I find that scaling the page by 79% on the official Raspberry PI touch screen works well for Home Assistant. For Grafana it doesn't hurt either.

Save that and make it executable with sudo chmod +x /usr/local/bin/kiosk.sh

Next we need to create a service so that the kiosk starts on boot.

Type sudo vi /etc/systemd/system/kiosk.service and enter the following:

[Unit]
Description=Chromium Kiosk
Wants=graphical.target
After=graphical.target 

[Service]
Environment=DISPLAY=:0.0
Environment=XAUTHORITY=/home/pi/.Xauthority
Type=simple
ExecStart=/bin/bash /usr/local/bin/kiosk.sh
Restart=on-abort
User=pi
Group=pi

[Install]
WantedBy=graphical.target
Change the User= and Group= lines from pi the username you created and are logged in as.

Save that and then run sudo systemctl enable kiosk

What that does is tells the PI to start the kiosk service on boot.

Finally we want the PI to boot into the desktop environment when it starts, so run sudo raspi-config again and in System Options -> Boot / Auto Login select Desktop Autologin (the bottom option) and exit raspi-config.

If it hasn't prompted you to reboot, then do so with sudo reboot

You should now have a working kiosk.

If you are using the touch screen display then that should be working and the kiosk should be interactive. If not and it's a static display like Grafana then you don't need the keyboard connected.

Home Assistant
In my setup I have Home Assistant, Zigbee2MQTT and RabbitMQ running on a Raspberry PI 4B. As it has the official 7-inch touch screen installed it also has the kiosk set.

So in /usr/local/bin/kiosk.sh I have the -app parameter set to --app=http://127.0.0.1:8123 where 127.0.0.1 is the local host, hence direct into Home Assistant.

I do have HA configured with a separate user which does not have admin access configured, but you simply log it in on the first attempt and remember to save password so that on future boots it starts up.

Grafana dashboards
Grafana has a kiosk mode which means that the title and side bars are not visible when the dashboard is in use. To enable this you can simply append &kiosk to the dashboard URL you are using.

For example, in /usr/local/bin/kiosk.sh and you have the -app parameter set to --app="https://grafana.example.com/d/hYdg83jksd/overview?orgId=1" then just append it to there so it looks like --app="https://grafana.example.com/d/hYdg83jksd/overview?orgId=1&kiosk"

Similarly you can override the refresh time by appending &refresh=30s to the url. I find either 10s or 30s is fine for most cases.

Grafana also has a feature called Playlist which allows a sequence of dashboards to be displayed in a repeating sequence which you might want to read up on as an additional exercise.

The kiosk doesn't start, I just get a desktop
If this happens, check that:

You have made /usr/local/bin/kiosk.sh executable with sudo chmod +x /usr/local/bin/kiosk.sh
You enabled the kiosk service with sudo systemctl enable kiosk
You did change the user/group entries in /etc/systemctl/system/kiosk.service to the account you created. Both are the same name but must match the user you are logged in as.
Stop, Start and Restart the kiosk
To restart the kiosk you can simply SSH into the PI and run the following:

sudo systemctl restart kiosk
The kiosk will then restart and open the initial start page.

If you ever needed to stop it for some reason, then replace restart with stop, and to start it again afterwards then replace restart with start.

## Notes

- Clear/comment out `/etc/xdg/lxsession/LXDE-pi/autostart`, add:
  ```
  @xset s noblank
  @xset s off
  @xset -dpms
  ```
- `/boot/config.txt`
  - `force_turbo=45`
  - `disable_splash=1`
- `/boot/cmdline.txt`
  - `silent loglevel=0 logo.nologo`
- `systemd-analyze [blame] [critical-chain]`
- uninstall cups: `sudo apt-get remove --purge cups*`
