#!/bin/sh
#********************************************************************
# STARTDATEI FUER SMARTMIRROR MIT PITFT
# - FRAMEBUFFER=/dev/fb1 startx & muss nicht gerufen werden, da
# in /usr/share/X11/xorg.conf.d/99-fbdev.conf boot konfiguriert ist.
# Siehe https://www.raspberrypi.org/forums/viewtopic.php?t=66184
# Nicht vergessen, in der raspi-config auf boot to deskop zu stellen!
# - Fuer Node muss der Compiler bei Wheezy geaendert werden
# Siehe https://alexbloggt.com/homebridge-installieren/
# - Adafruit PiTFT 3.5 Installation:
# https://learn.adafruit.com/adafruit-pitft-3-dot-5-touch-screen-for-raspberry-pi/detailed-install
# - Fuer Chromium muss ein Symlink auf die NSS-Library gemacht werden:
# https://raspberrypi.stackexchange.com/questions/11956/launching-chromium-browser-via-terminal-throws-errors
# (sudo ln -s /usr/lib/arm-linux-gnueabihf/nss/ /usr/lib/nss)
#********************************************************************

# xset sagen, welcher Display verwendet werden soll
export DISPLAY=:0
# Quelle: https://www.danpurdy.co.uk/web-development/raspberry-pi-kiosk-screen-tutorial/
#         https://maker-tutorials.com/autostart-midori-browser-vollbild-kiosk-mode-via-konsole-ohne-desktop/
xset s off      # disable screen saver
xset -dpms      # disable DPMS (Energy Star) features.
xset s noblank  # don't blank the video device
sed -i 's/"exited_cleanly": false/"exited_cleanly": true/' ~/.config/chromium/Default/Preferences
# Hide the mouse from the display
unclutter &
echo "Grundeinstellung geladen"

# start Node-Server
node ~/SmartMirrorRPiTFT/server.js &
# kurz warten
echo "Warte auf Server..."
sleep 10

# start Chromium
chromium --noerrdialogs --kiosk http://localhost:8081/index.html --incognito &
echo "Chromium gestartet - System laeuft"