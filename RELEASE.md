# ki-cards 9.8.0

Bygget oppå 9.7.0 fra GitHub.

## Nytt kort: `ki-post-bursdag-card` — «Bursdager og post»

Etter designet «Bursdager og post», til fanen med gaven i kalenderpopupen.

- **To store kort øverst:** *Neste post* (ukedag og dato) og *neste bursdag* i rosa («Mormor fyller 85 · 8 dager»).
  Trykk — eller prikkene under — velger hva som vises nedenfor.
- **Post:** postdagene de neste 14 dagene (rød med konvolutt; helg dempet), og pakkene på vei fra Norwegian Parcel
  Tracker med fire steg (registrert, under transport, til hentested, levert), forventet dag og status. Trykk åpner
  pakken.
- **Bursdager:** de neste bursdagene med forbokstav, alder og dato — de innen 60 dager i rosa — og **Legg til
  bursdag** (navn og fødselsdato). Nye bursdager lagres i kalenderen som årlig gjentatte heldagshendelser med
  fødselsåret i tittelen («Tante Kari (1975)»), så alderen regnes ut; støtter ikke kalenderen gjentakelse, legges
  ti år inn.
- **Kalender:** knappen ved overskriften bytter til en månedskalender med prikker for bursdag, post og pakke, og
  hva som skjer den dagen du trykker på. Trykk på måneden går tilbake til i dag.

**Data:** bursdagene fra `kalender:` (samme som ki-bursdag-pro-card), neste levering fra `post:` (Når kommer posten).
Postdagene er faste ukedager med `dager:`, ellers datolista i sensoren om den har en, ellers annenhver hverdag regnet
fra neste levering — slik Posten leverer nå.

`examples/post-bursdag-fane.yaml` er fanen i kalenderpopupen.

### Kontrollert

Begge byggesjekkene kjørt (68 kort). Kortet er kjørt med fire bursdager fra kalenderen, neste postlevering og en pakke
klar til henting: toppkortene, «Posten · 0379 Oslo» med postdagene og pakken «Til hentested · Coop Extra», bursdagslista
med alder, «Legg til bursdag» som lagrer `Tante Kari (1975)` årlig med `calendar.create_event`, og kalenderen med 42
dager og dagens hendelser. Ingen `NaN` eller `undefined`.
