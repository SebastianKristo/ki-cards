# ki-cards 3.51.0

## Flisene i Hjem-fanen kan redigeres i editoren

Flisene i `hjem.stov` — gjøremål, transport, veikamera, drivstoffpris og hva du ellers
legger der — fantes bare i YAML. Nå ligger de i en egen seksjon nederst i editoren,
«Fliser i Hjem-fanen», med antallet i overskriften.

Hver flis har en rad med navn og tre knapper: opp, ned og fjern. Under raden står flisens
egne felt, og feltene følger typen:

* **Fri flis** (`navigate`) — tittel, undertekst, valgfri entitet, ikon, farge og
  popup-hash. Det er den du bruker for transport, veikamera og drivstoffpris.
* **Gjøremål, kalender, dørlås, garasjeport, alarm** — entitetsvelger begrenset til riktig
  domene, pluss undertekst.
* **Rom** — romnøkkel og størrelse.

Alle typer har ikon, farge og popup-hash.

«+ Legg til flis» legger en fri flis nederst, klar til å fylles ut. Tomme felt fjernes fra
konfigurasjonen i stedet for å bli liggende som blanke strenger, og fjerner du den siste
flisa, forsvinner `stov`-nøkkelen helt.
