# ki-cards 5.81.0

## Nytt kort: `ki-sikkerhetspanel-card`

Sikkerhetspopupen (`#alarm`) etter skissen «Sikkerhet v2», i dashbordets farger: oransje for det som krever
deg, blått for bevegelse, grønt for Hjemme.

- **Ringen:** én strek per sensor rundt modusen. Streken lyser oransje når en dør eller et vindu står åpent
  eller en lås er ulåst, og blått når en sensor ser bevegelse; ellers har den modusfargen (grå når alarmen er
  av). I midten modusen og når den ble slått på; trykk åpner alarmen.
- **Setningen under:** «1 dør står åpen, 1 vindu står åpent og 1 lås er ulåst» — eller «Alt er lukket og
  låst» — og hvor mange sensorer som ser bevegelse og hvor mange som er i ro. Skissen la setningen oppå
  linja under når den gikk over to linjer; her har den egen linjehøyde.
- **Modus: hold inne.** Av, Hjemme, Borte og Natt. Hold i 0,9 s — fyllet går over knappen mens du holder,
  og slipper du før, skjer ingenting. Krever alarmen kode (entitetens `code_format` og
  `code_arm_required`), kommer et tastatur opp nedenfra; koden sendes når alle sifrene er tastet, og feil
  kode rister prikkene.
- **Krever oppmerksomhet:** én rad per åpen dør, åpent vindu, ulåst lås og lavt batteri (`batteri_grense`).
  Ulåste låser har **Lås**, som låser; resten har **Vis**, som åpner sensoren.
- **Rom:** sensorene gruppert per rom (`rom:` på hvert punkt), med prikk i romfargen og en brikke per sensor
  — «Åpen», «Dørlås ulåst», «Bevegelse nå», «Boddør · 88 %». Trykk åpner sensoren.
- **Siste hendelser:** fra loggboka, siste døgn — modusbytter med hvem som gjorde det («Deg», eller navnet
  på personen), dører og vinduer som åpnes, låser og bevegelse. «Lukket» og «ingen bevegelse» er utelatt
  som støy.
- **Egen overskrift og X** som lukker popupen.

Leser samme `zones:` som `ki-sikkerhet-card`. `examples/sikkerhet-popup.yaml` er hele popupen med rommene
satt opp.

### Kontrollert

Begge byggesjekkene kjørt: 62 kort bygges. Kortet er kjørt med stuas sensorer: «Natt · Aktivert …», ni
streker der fire lyser, setningen «1 dør står åpen, 1 vindu står åpent og 1 lås er ulåst», fire varsler
(dør, vindu, lås og lavt batteri 12 %), rommene med riktige brikker, loggen med nyeste først og «Deg» på
modusbyttet. **Lås** kaller `lock.lock`; **Av** åpner tastaturet, og seks sifre sender `alarm_disarm` med
koden og lukker det. Ingen `NaN` eller `undefined`. Bygget oppå 5.80.0 fra GitHub.
