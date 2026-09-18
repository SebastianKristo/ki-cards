# ki-cards 4.7.0

## Nytt kort: `ki-homelab-card`

Lagt inn i bundelen som `src/82-ki-homelab-card.js`, uendret fra fila du sendte.

Kortet finner alt selv gjennom entitetsregisteret, gruppert per integrasjon og enhet:

* **proxmox_sensors** — node, containere, VM-er, lagring og varsler
* **unifi** — ruter, switcher, aksesspunkt, Wi-Fi med QR-kode, porter, LED og restart
* **unraid** — CPU, RAM, array, disker, Docker-containere og VM-er
* **qbittorrent** — ned- og oppfart, status, torrenter, alternativ hastighet
* **speedtestdotnet** — ned, opp og ping, om den finnes

Fire visninger: `scene` (standard), `gjester`, `nettverk` og `lagring`. `skjul:` tar bort
rader som inneholder en tekst, og `navn_map:` gir pene navn per vmid eller nøkkel.

Fila er frittstående og krever ikke bundelen, men i bundelen registreres den gjennom
`KI.define` som de andre — så en kopi lastet fra en egen ressurs vinner ikke i stillhet.
Har du den som egen Lovelace-ressurs fra før, fjern den, ellers får du to kopier og den
gamle vinner.

Merkeikon lagt til i `brand/` og rad i README-tabellen.

### Kontrollert

Registreres fra bundelen, dukker opp i kortlista, og alle fire visningene tegner mot et
sett med Proxmox-, Unraid-, qBittorrent- og UniFi-entiteter uten å kaste. Byggeskrittet
leser `styles` på alle 100 kort.
