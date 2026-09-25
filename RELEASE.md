
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
