# ki-cards 8.99.4

Bygget oppå 8.99.3 fra GitHub.

## ki-basseng-card 3.5.0

- **Full editor i grensesnittet.** Alt kortet kan settes opp med, i fire utvidbare seksjoner:
  *Generelt* (hele kortet eller bare scenen, scenen av/på, tittel, prefiks), *Faner* (uten
  faner, eller hvilke og i hvilken rekkefølge), *Varmepumpe og knapper* (varmepumpe,
  stillemodus, hurtigknapper, navn under knappene) og *Utseende* (tekststørrelse i
  setningene, dashbordets fliser, grafen, egne temperaturknapper). Det som er lik
  standarden, skrives ikke til YAML-en, og navn og ikon på hurtigknappene fra YAML beholdes.
- **Større setninger** på Oversikt og Varme: 1,4em, som forsideteksten. Velg 1,2–1,8 i
  editoren eller med `prosa_storrelse:`.
- **«Manuell overstyring – automatikken venter»** står ikke lenger nederst på Oversikt.

---

# ki-cards 8.99.3

Bygget oppå 8.99.2 fra GitHub.

## ki-vanning-card 4.2.1: soneraden som vanner

- **Navnet:** nyere OpenSprinkler setter enhetsnavnet foran («OpenSprinkler S01 Garasje/Roser»), så raden sa
  «S01 OpenSprinkler S01 Garasje/Roser». Enhetsnavnet fjernes nå: «S01 Garasje/Roser».
- **Oppsettet:** navnet og statusen sto på én linje, fordi midtdelen manglet sin stil i sonelista. Nå står
  statusen under navnet: «Vanner · 4:12 igjen», med kortets egen nedtelling.
- **Animasjonen:** fyllet var en grå firkant bak ikonet uten overgang. Nå fyller det raden avrundet, i blått, og
  vokser jevnt mot høyre mens sonen vanner. Ikonet pulserer svakt.

### Kontrollert

Begge byggesjekkene kjørt. S01 med navnet «OpenSprinkler S01 Garasje/Roser Station Enabled» startet i 5 minutter:
raden viser «S01 Garasje/Roser» og «Vanner · 5:00 igjen», og fyllet starter fra venstre.
