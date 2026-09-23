# ki-cards 5.58.0

## ki-basseng-card 1.12.0: nye faner og ny temperaturgraf

Sirkulasjon, spreder og innstillinger var lange lister med rader rett på bakgrunnen. Nå er de bygget av
**paneler** — én flate per tema, med farget ikonflis og overskrift — og nøkkeltallene er grafiske.

### Grafen på Oversikt

Timesøylene opp og ned fra en midtlinje sa riktig ting, men var tunge å lese. Nå er det en **myk kurve**
med toning under, og pumpeperiodene som **blå felt bak** — så du ser både hvor varmt vannet er og
hvorfor det steg.

- en stiplet linje for måltemperaturen, med merke i kanten
- et pulserende punkt for «nå», med temperaturen på en lapp
- tidsakse (klokkeslett for døgnet, ukedager for 3 og 7 døgn) og skala i kanten
- brikker under: temperatur nå, mål, endring i vinduet (▲/▼) og hvor lenge pumpa har gått

Målingene jevnes ut på 48 punkter over vinduet, så målestøy ikke blir fjell. Kurva og feltene ligger i en
strukket svg med `vector-effect: non-scaling-stroke`, så streken er like tykk overalt; tekst og punkt
ligger som HTML oppå og forvrenges ikke. Pumpefelt kortere enn to minutter regnes som blaff.

### Sirkulasjon

- **Omsetninger i dag** som en ring mot målet, med pumpetid, neste start og hvor lenge én omsetning tar
  ved siden av — og et tips når vanntemperaturen tilsier et annet mål
- **Temperatur og sirkulasjon** med den nye grafen og vindusvalget i panelhodet
- **Planen** for i dag og i morgen, med snittprisen i overskriften
- **Innstillinger** samlet i ett panel

### Spreder

- scenen og start/stopp-knappen i samme panel, med status og tid igjen
- **I dag** som en ring for brukt tid mot døgntaket, med varighet, intervall og om programmet er på
- **Program** med alle valgene og frostvakt samlet

### Innstillinger

Delt i **Pumpe**, **Varme** og **Tellere**. Tellerne er fire fliser — pumpet i dag, pumpet totalt,
energi og kostnad — som åpner historikken når du trykker.

Start, stopp og nullstill gir haptikk i appen. Valgene bruker fortsatt telefonens egen hjulvelger.

### Kontrollert

Begge byggesjekkene kjørt: 114 kort leser styles, 62 kort bygges med hass. Kortet er i tillegg tegnet
med et døgn oppdiktet historikk: kurva som bezier-bane, seks pumpefelt, mållinjen, nå-punktet, fire
brikker og tidsaksen «16:00 22:00 04:00 10:00 nå». Sirkulasjon gir fire paneler med ring og tre
nøkkeltall, spreder tre paneler med ring, innstillinger tre paneler med fire tellerfliser — ingen `NaN`
eller `undefined` noe sted.
