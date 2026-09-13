# ki-cards 3.44.0

## `ki-strompris-card`: bunnen av grafen var klippet

`.grafboks` fikk fast `height: <hoyde>px` fra konfigurasjonen, mens selve tegningen siden
3.40 kan bli opptil 1,9 ganger så høy på en bred skjerm. Med `overflow: hidden` på boksen
ble den nederste delen av kurven skåret bort.

Boksen bruker nå `min-height` og lar tegningen bestemme den faktiske høyden, og
`overflow: hidden` er borte. `hoyde` er dermed et gulv, ikke et tak.

## Kompakt editor for `ki-hjem-card`

Editoren var ett eneste `ha-form` med alt: faner, etasjer og hvert rom med åtte felt hver.
Med tjue rom ble det over hundre felt i én lang rulle.

Nå er skjemaet delt i sammenfoldbare seksjoner:

* Én per overskrift — Hjem, Aktuelt, Batterier, Etasjer.
* Én per etasje, med etasjens egne felt.
* Én per rom, rykket inn under sin etasje.

Alt er lukket bortsett fra «Generelt», så du åpner det du skal endre. Hvert rom viser et
sammendrag i overskriften — «skjult · stor · venstre» — så du ser hvilke som er justert
uten å åpne dem.

Hver seksjon har sitt eget `ha-form` med bare sine felt, men lagringen går gjennom samme
`_toConfig` som før: delen som endres slås sammen med resten av verdiene, så
konfigurasjonen blir den samme. Rom eller etasjer som forsvinner fra Home Assistant, får
seksjonen sin fjernet ved neste tegning.
