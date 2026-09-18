# ki-cards 3.93.0

## Nytt kort: `ki-tall-card` — tett rutenett av tall

Enhetskortene tok en halv skjerm for å vise tre tall. Her får åtte tall plass i samme
høyde: liten etikett, verdien, og en tynn stolpe når det finnes en skala.

```yaml
type: custom:ki-tall-card
tittel: Noden
kolonner: 4
tall:
  - { navn: CPU, entity: sensor.x_cpu, enhet: '%', maks: 100, gul: 70, rod: 88 }
  - { navn: Oppe, entity: sensor.x_uptime, tid: true }
  - { navn: PVE, entity: sensor.x_pve_version }
```

* `maks` gir stolpe, `gul` og `rod` farger den og hele flisen når verdien passerer.
* `tid: true` gjør et tidsstempel eller sekunder til «5 døgn» — UniFi og Proxmox oppgir
  oppetid som tidsstempel, og en ISO-streng er ikke noe man leser.
* Tekstverdier vises som de er, forkortet med ellipse. Hele strengen må være et tall for
  å bli behandlet som ett: `parseFloat` godtar alt som *begynner* med et, og
  «6.12.4-pve» ble ellers vist som 6,1.
* Uten svar blir dempet med «–», og overskriften teller hvor mange.
* Tre kolonner under 420 px, fire over.

En kollisjon underveis: flisene het `.t`, det samme som titteltesten, så tittelen fikk
flisenes bakgrunn og padding. Og en kommentar med backticks inne i CSS-en — som er en
template-streng — avsluttet strengen midt i. `node --check` fanget ingen av dem, siden
resultatet er gyldig JavaScript; det var DOM-testen som viste det.

## Server-popupen bygget om igjen

De store enhetskortene er borte fra alle fire faner. Hver fane: statuskort øverst, så to
til tre tallrutenett, så listene og handlingene.

**76 tall i rutenett** der det før var enhetskort med tre målinger hver. Ny informasjon
som ikke var synlig før: swap og rot-FS på Proxmox, node score, KSM delt minne, kernel-
og PVE-versjon, IO wait og idle, br0-trafikk og IP-adresse, docker-RAM, paritetsfart og
framdrift, latens mot alle tre målene, klienter og oppetid per switch og aksesspunkt, og
hele qBittorrent-køen med totaler.

Handlingene har fått egne rader: restart av ruter og switch med bekreftelse, LED-brytere,
og node-restart og avstenging i rødt og oransje.
