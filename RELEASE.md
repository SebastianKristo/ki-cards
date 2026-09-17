# ki-cards 3.80.0

## Nytt kort: `ki-nedlasting-card`

qBittorrent i KI-formspråket, med animert overføring og historikk.

```yaml
type: custom:ki-nedlasting-card
prefiks: sensor.qbittorrent_
bryter: switch.qbittorrent_alternative_speed
container: switch.d_day_darling_container_binhex_qbittorrentvpn
oppdatering: update.d_day_darling_container_binhex_qbittorrentvpn_update
historikk_dager: 30
```

**Heroen** viser tilstanden i klartekst — «Laster ned», «Deler», «Laster og deler»,
«Hviler» — med ned- og oppfart side om side. Nederst går data gjennom et rør: pakkene
renner mot høyre når den laster ned, mot venstre når den deler, og **farten på
animasjonen følger den faktiske farten**. `maks_fart` er MB/s som gir full hastighet.
Hviler den, står røret stille og dempet.

**Tilkoblingen** har sin egen brikke. «Bak brannmur» blir oransje og «Frakoblet» rød —
uten åpen port får du nesten ingen fart, og det er ikke synlig noe annet sted i
dashbordet.

**Køen** står som fliser: aktive, pauset, uten trafikk, feilet og totalt. Feilede
torrenter får rød flis når tallet er over null.

**Totalene** viser ned og opp som et delt bånd med forholdet mellom dem. Integrasjonen
oppgir TiB, og «0,004 TiB» sier ingenting — kortet regner om til MiB, GiB eller TiB
etter hva som er lesbart.

**Historikken** er et søylediagram per døgn, hentet fra statistikken. «All-time download»
er `total_increasing`, så Home Assistant har ferdig utregnet endring per døgn; mangler
`change`-feltet, regnes differansen mellom døgnsummene. Tre tomme tilstander er dekket med
forklaring i stedet for et tomt felt.

Nederst knapper for sparefart og containeren. Er containeren stoppet, blir knappen rød og
sier det. Finnes en ny versjon, dukker det opp en knapp til.

## `examples/server-nedlasting-fane.yaml`

Nedlasting-fane til server-popupen, klar til å limes inn i `tabs:` på øverste nivå. Med
kortet, et varsel når VPN-porten ikke er åpen, og containerne i nedlastingskjeden i
rekkefølgen de brukes: Prowlarr, Flaresolverr, Sonarr, Radarr, Readarr, Bazarr, Seerr,
qBittorrent.
