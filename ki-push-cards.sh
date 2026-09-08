#!/bin/bash
# Bruk: bash ~/ki-push-cards.sh 1.1.0   (pakker ut ki-cards-<versjon>.zip fra ~/Downloads og pusher til GitHub)
set -e
V=$1
[ -z "$V" ] && { echo "Bruk: ki-push-cards.sh 1.1.0"; exit 1; }
REPO=~/Documents/HomeAssistant/ki-cards
cd ~/Downloads
rm -rf "ki-cards-$V" && unzip -oq "ki-cards-$V.zip" -d "ki-cards-$V"
# Første gang: klon repoet som allerede finnes på GitHub
[ -d "$REPO/.git" ] || git clone -q git@github.com:SebastianKristo/ki-cards.git "$REPO"
cp -r "ki-cards-$V/ki-cards/." "$REPO/"
cd "$REPO"
git add .
git commit -m "KI Cards v$V" || true
git tag -d "v$V" >/dev/null 2>&1 || true
git push origin ":v$V" >/dev/null 2>&1 || true
git push origin main
git tag "v$V"
git push origin "v$V"
echo "Ferdig. Lag release: https://github.com/SebastianKristo/ki-cards/releases/new?tag=v$V"
