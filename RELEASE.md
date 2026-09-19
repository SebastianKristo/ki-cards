# ki-cards 4.18.0

## `ki-hjem-card`: editoren slettet `hjem.stov`

Én endring i editoren, og hele `hjem`-blokka ble skrevet om — `stov` med kameraflisen og
gjøremålskortet forsvant.

Årsaken er «Vis Hjem-fanen». Den er en av/på-bryter på veien `hjem`, og når den sto **på**
skrev den `undefined` — som sletter veien. `hjem` er ikke et flagg, det er et objekt med
lås, alarm, kalender, rom og `stov`, så ett trykk tok alt sammen.

Nå røres et objekt aldri når bryteren står på: «på» er standarden, og da skal
konfigurasjonen stå som den er. Slår du den **av**, settes `false` med vilje — det er den
eneste gangen du faktisk har bedt om det.

Kontrollert: med bryteren på overlever `stov`, `las_path` og `rom` uendret. Slått av blir
`hjem: false`.

## Og bokstaven som forsvant i `las_path`

`#alarm::laser` ble lagret som `#alarm::lase`. Samme årsak som hakkingen i fanekortet:
editorens `set hass` fyres hver gang **én** tilstand i huset endrer seg, og den bygde hele
skjemaet på nytt hver gang. Et `ha-form`-felt ble byttet ut mens du skrev i det, og siste
tegn gikk tapt.

Nå bygges skjemaet bare første gang; etterpå sendes `hass` videre til de fem feltene, som
er det de trenger for entitetsvelgerne.

M�lt: 200 tilstandsbytter ga **200 ombygginger før, 0 nå**.

### Rekkefølgen i YAML-en

Legg merke til at `hjem` flyttet nederst i den lagrede YAML-en. Det er ufarlig —
nøkkelrekkefølge betyr ingenting — og skjer fordi editoren bygger objektet på nytt. Selve
innholdet er nå intakt.

---

# ki-cards 4.17.1

Backtick i en CSS-kommentar lukket mal-strengen i `ki-tabs-card`, og kalenderpopupen ble
tom. Nytt byggeskritt `verifiser-kort.js` setter opp hvert kort og gir det hass.
