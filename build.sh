#!/bin/bash
# Bygger dist/ki-cards.js (ES-modul) av:
#   src/*.js        – ki-*-kortene (deler felles SK-hjelpere)
#   src/cards/*.js  – frittstående kort, tatt inn uendret men pakket i egne blokker
# Hvert kort registreres via SK.define, som hopper over elementer som allerede finnes
# (f.eks. ki-klima-pro-card installert fra ki-strom) i stedet for å kaste feil.
set -e
cd "$(dirname "$0")"
V=$(grep -o 'SK.VERSION = "[^"]*"' src/00-ki-base.js | cut -d'"' -f2)
OUT=dist/ki-cards.js
{
  echo "/* ki-cards v$V – https://github.com/SebastianKristo/ki-cards – bygget $(date +%F) */"
  # ES-import må stå øverst i modulen: samle importlinjer fra alle kort (dedupliseres)
  for f in src/cards/*.js; do awk 'BEGIN{b=0} /^import[ {]/{b=1} { if(b){ line=line" "$0 } if(b && /;$/){ gsub(/[ \t]+/," ",line); print line; line=""; b=0 } }' "$f"; done | sed 's/^ //' | sort -u
  echo 'window.SK = window.SK || {};'
  echo 'window.SK.define = (n, c) => { if (customElements.get(n)) console.warn("ki-cards: " + n + " er allerede definert – hopper over"); else customElements.define(n, c); };'
  for f in src/*.js src/cards/*.js; do
    n=$(basename "$f" .js)
    echo; echo "/* ===== $n ===== */"
    echo "try {"
    # fjern import-blokk, erstatt define med guarded define
    awk 'BEGIN{skip=0} /^import[ {]/{skip=1} { if(!skip) print; if(skip && /;$/) skip=0 }' "$f" \
      | sed 's/customElements\.define(/window.SK.define(/g'
    echo "} catch (e) { console.error(\"ki-cards: $n feilet\", e); }"
  done
} > "$OUT"
cp "$OUT" /tmp/sk-check.mjs && node --check /tmp/sk-check.mjs
echo "$OUT OK (v$V, $(du -k "$OUT" | cut -f1) kB)"
