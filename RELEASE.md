# ki-cards 5.88.0

Bygget oppå 5.86.0 fra GitHub.

## Nytt kort: `ki-entur-card` — bussen begge veier

Avgangene fra Entur-sensorene, delt i retninger — «Til Majorstuen» fra Amagerveien og «Til Amagerveien» fra
Majorstuen.

- **Neste avgang stort:** minutter igjen (telles ned i kortet mellom sensoroppdateringene, rundet opp som hos
  Entur), klokkeslettet, og om den er **i rute**, **N min forsinket** eller bare **rutetid** (ikke sanntid).
- **De neste etter:** «Så 14:39 (16 min)».
- **Gangtid** (`gange:`): «Gå om 3 min», «Gå nå!» (blinker) eller «Rekker ikke».
- Leser to avganger per sensor (`route`/`due_at` og `next_route`/`next_due_at`), filtrert på retningen med
  `mot:` og uten dubletter når flere sensorer viser samme buss.
- Linjenummeret i Ruter-rødt; trykk åpner sensoren. Finnes ikke en sensor, sier kortet hvilken.

I veggpanelet ligger det under varmen med `buss: { retninger: … }`. `examples/entur-buss.yaml` har oppsettet
og hvordan Majorstuen legges til i Entur-integrasjonen.

## Nytt kort: `ki-kart-card` — hvor er alle

Til en egen kart-popup (`#kart`) fra sidemenyen på veggpanelet.

- **Kartet** er Home Assistants eget kartkort (mørkt), montert i kortet: sonene som sirkler, personene med
  bildet sitt, og bilen.
- **Hvor er alle:** én rad per person og bilen — bildet med en ring i sonefargen og et merke (hus, kartnål,
  gående), fornavnet, sonen eller «Borte» og hvor lenge («Toten · i 1 dag»), og avstanden fra hjemme. Bilen
  viser batteriet og hvor langt unna den står.
- **Soner:** én brikke per sone i sin farge, med hvem som er der; tomme soner står dempet.
- Trykk på en rad eller sone åpner den.

Bilen finnes av seg selv — en `device_tracker` med «tesla» i navnet og en posisjon (ruter og mål hoppes over)
— og batteriet likeså. `bil:` og `bil_batteri:` overstyrer.

`examples/kart-popup.yaml` er popupen i samme stil som de andre.

## Veggpanelet

- **Klokka** er en knapp: trykk går til `/config`, hold slår kioskmodus av og på (`klokke.tap_action` /
  `klokke.hold_action` overstyrer). Klikket etter et hold svelges.
- **Kart** i sidemenyen får grønn farge når popupen er åpen.

### Kontrollert

Begge byggesjekkene kjørt. Entur-kortet er kjørt med Amagerveien (plattform og hovedsensor) og Majorstuen:
«45 Til Majorstuen · 4 min · 3 min forsinket · Gå nå! · Så … (16 min)» uten dublett, «45 Til Amagerveien ·
7 min · i rute · Gå om 4 min» der 20 Skøyen er filtrert bort, og «Fant ikke …» for en sensor som mangler.
Kartkortet er kjørt med tre personer, tre soner og en Tesla med både posisjon og
rute: kartkortet får sju entiteter og posisjonssporeren (ikke ruten); radene «Sebastian – Hjemme · i 2 t»,
«Cybele – Borte · i 30 min [6,3 km]», «Rune – Toten · i 1 dag [84 km]», «Bilen – Hjemme [78 %]»; sonene
«Hjem: Sebastian, Bilen», «Toten: Rune» og «Skole» dempet. Klokka: trykk → `/config`, hold → kioskmodus.
Ingen `NaN` eller `undefined`.
