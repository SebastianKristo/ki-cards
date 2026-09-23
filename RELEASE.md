# ki-cards 5.49.0

## ki-lansering-card kjenner igjen det Plex alt har

```yaml
type: custom:ki-lansering-card
serier: sensor.sonarr_sonarr_upcoming_media
filmer: sensor.radarr_radarr_upcoming_media
plex_serier: sensor.d_day_darling_plex_recently_added_show
plex_filmer: sensor.d_day_darling_plex_recently_added_movie
antall: 6
plakater: true
```

**Hake på det som ligger i Plex.** En episode eller film som er kommet inn, får en grønn hake i
lista og merket «I Plex» i heroen. Episoder kjennes igjen på tittel **og** nummer (S05E03), filmer
på tittel alene; tegnsetting, store bokstaver og årstall i parentes strippes bort først, siden
Sonarr, Radarr og Plex skriver titlene litt ulikt.

**Ny fane «Plex»** med det som nettopp er lagt til, nyeste først — samme hero og liste som ellers.
Datoene bakover leses nå riktig: «i går», «4 d siden», og eldre med dato. Før ble «i forgårs» til
ukedagen, som ser ut som noe som kommer.

Én sensor holder også, om den blander serier og filmer: `plex: sensor.d_day_darling_plex_recently_added`
(eller en liste). Typen avgjøres da per element — har det episodenummer, er det en serie.
Musikksensoren hoppes over automatisk.

**Verdt å vite:** Plex-sensorene holder bare de siste tilleggene. En hake betyr derfor «lagt til
nylig», og at den mangler betyr *ikke* at du ikke har den fra før. Derfor er det bare hake for det
som finnes — aldri et kryss for det som ikke gjør det.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Kortet er i tillegg kjørt
med oppdiktede sensorer: «slow horses / s05e03» i Plex treffer «Slow Horses / S05E03» fra Sonarr, og
«Dune: Part Three (2026)» treffer «Dune: Part Three» fra Radarr, mens The Last of Us står uten hake.
Heroen viser «I Plex», lista én hake, musikksensoren er utelatt, Plex-fanen står nyeste først med
«4 d siden», og uten `plex_*` i oppsettet er kortet nøyaktig som før — ingen hake og ingen Plex-fane.
