#!/bin/bash
# Bygger dist/ki-cards.js (ES-modul) av:
#   src/*.js        – ki-*-kortene (deler felles KI-hjelpere)
#   src/cards/*.js  – frittstående kort, tatt inn uendret men pakket i egne blokker
# Hvert kort registreres via KI.define, som hopper over elementer som allerede finnes
# (f.eks. ki-klima-pro-card installert fra ki-strom) i stedet for å kaste feil.
set -e
cd "$(dirname "$0")"
V=$(grep -o 'KI.VERSION = "[^"]*"' src/00-ki-base.js | cut -d'"' -f2)
OUT=dist/ki-cards.js
{
  echo "/* ki-cards v$V – https://github.com/SebastianKristo/ki-cards – bygget $(date +%F) */"
  echo 'window.KI = window.KI || {};'
  echo 'window.KI.define = (n, c) => { if (customElements.get(n)) console.warn("ki-cards: " + n + " er allerede definert – hopper over"); else customElements.define(n, c); };'
  # Kort som trenger LitElement henter den fra Home Assistant selv, slik at bundelen
  # ikke er avhengig av en ES-import fra unpkg (som velter hele fila hvis den feiler).
  cat <<'LIT'
window.KI.lit = (kjor) => {
  const kandidater = ["ha-panel-lovelace", "hui-view", "hui-masonry-view", "home-assistant", "ha-card"];
  const hent = () => {
    for (const navn of kandidater) {
      const el = customElements.get(navn);
      if (!el) continue;
      let p = Object.getPrototypeOf(el);
      for (let i = 0; i < 6 && p; i++) {
        if (p.prototype && p.prototype.html && p.prototype.css) return p;
        p = Object.getPrototypeOf(p);
      }
    }
    return null;
  };
  const start = () => {
    const L = hent();
    if (!L) return false;
    try { kjor(L, L.prototype.html, L.prototype.css); } catch (e) { console.error("ki-cards: kort feilet", e); }
    return true;
  };
  if (start()) return;
  let n = 0;
  const t = setInterval(() => { if (start() || ++n > 120) clearInterval(t); }, 100);
};
LIT
  for f in src/*.js src/cards/*.js; do
    n=$(basename "$f" .js)
    echo; echo "/* ===== $n ===== */"
    if grep -q "^import[ {]" "$f"; then
      # kortet bruker LitElement: kjøres først når HA har den klar
      echo "window.KI.lit((LitElement, html, css) => {"
      awk 'BEGIN{skip=0} /^import[ {]/{skip=1} { if(!skip) print; if(skip && /;$/) skip=0 }' "$f" \
        | sed 's/customElements\.define(/window.KI.define(/g'
      echo "});"
    else
      echo "try {"
      awk '{ print }' "$f" | sed 's/customElements\.define(/window.KI.define(/g'
      echo "} catch (e) { console.error(\"ki-cards: $n feilet\", e); }"
    fi
  done
} > "$OUT"
cp "$OUT" /tmp/sk-check.mjs && node --check /tmp/sk-check.mjs
echo "$OUT OK (v$V, $(du -k "$OUT" | cut -f1) kB)"
