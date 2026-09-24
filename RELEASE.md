# ki-cards 5.65.0

## Nytt kort: `ki-veggpanel-card`

Hele veggpanelet for stua som ett kort, laget for iPad liggende og tegnet etter `DESIGN.md`. Det er
skissen fra lerretet, bygget som et eget kort i stedet for button-card-maler.

```yaml
type: custom:ki-veggpanel-card
topp: { stovsuger_trykk: "#rolf" }
prosa: { … }            # ki-prosa-card, montert slik det er
familie: { … }          # family-status-card
media: { … }            # ki-media-card
scener: [ { navn, ikon, tap_action, aktiv } ]
klima: [ climate.stue_oljefyr, climate.stue_panelovn ]
strom: { effekt: sensor.strommaler_effekt, trykk: "#strom" }
lys: { gruppe: light.stue, lamper: [ … ] }
dekker: [ { navn, ikon, hoved, deler: [ { navn, entity } ] } ]
```

- **Toppstripa:** klokke og dato, og piller for vær, hjemme, lås, alarm og støvsuger. Hver pille kan
  åpne en popup (`vaer_trykk`, `alarm_trykk` …) og åpner ellers mer-info.
- **Scener:** liggende fliser; `aktiv:` fyller flisen når entiteten er på. Et trykk blinker flisen,
  så du ser at det tok.
- **Termostater:** stort settpunkt med − og +. Trykkene samles i 0,8 s og sendes som ett kall, og tallet
  står på det du har trykket deg fram til imens. Ikonet blir oransje når ovnen faktisk varmer.
- **Strøm:** pris nå og effekt, og dagens priser som søyler — grønt billig, oransje middels, rødt dyrt,
  timen nå i aktivfargen. Dra fingeren over, så får du prisen og timen.
- **Lys:** bryter per lampe og en stolpe du drar for lysstyrke. Lamper uten dimming får bare bryteren.
- **Gardiner og markise:** en stolpe per side som dras, og 0–100 % som forhåndsvalg. Prosenten er «nede»,
  som i knappene dine (`invertert: false` snur det).
- **Langt trykk** åpner entiteten overalt. Alt som endres, vises med en gang og slippes når entiteten
  er enig. Haptikk på alle trykk.
- **Smalere skjerm:** tre kolonner på iPad liggende, to på høykant (media øverst), én på telefon.

### Kontrollert

Begge byggesjekkene kjørt: 115 kort leser styles. Kortet er i tillegg kjørt i en simulert DOM med stuas
oppsett: toppstripa med fem piller, scenene, prosa-, familie- og mediekortet montert, to termostater med
«22,0°» og oransje ikon på den som varmer, 24 prissøyler med timen nå markert, fingeren på kl. 18 som gir
«0,92 kr kl. 18–19», lys «1 av 2 på» med dra-stolpe bare på lampen som kan dimmes, markise «63 % nede».
To trykk på + viser 23,0° uten å sende noe før fristen, 100 % sender posisjon 0 til begge sidene, og
Filmkveld kaller `scene.turn_on`. Ingen `NaN` eller `undefined`.
