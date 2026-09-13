# ki-cards 3.23.0

## Huset viser tilstanden i `ki-sikkerhet-card`

Fire tydelig forskjellige tilstander, så du ser hva alarmen gjør uten å lese teksten.

**Utløst alarm.** To varsellys på mønet blinker i vekselvis rytme, et halvt sekund
forskjøvet, med et rødt glødekast rundt seg. Samtidig legger en rød vask seg over hele
fasaden på samme takt, og sirenebuene går som før. Huset blinker altså på ordentlig, ikke
bare i bakgrunnen.

**Armert.** En tynn strek i tonefargen sveiper nedover fasaden hvert femte sekund, som et
skann. Et lite skjold på veggen puster rolig. Vinduene kjøles ned til blått — huset sover,
lyset er ikke på innenfra.

**Avslått.** Vinduene lyser varmt oransje og pulserer svakt i forskjøvet takt, som lys i
et hus som er i bruk. Røyken stiger fra pipa.

**Kobler på.** Vegg og tak dempes i takt mens nedtellingsringen ruller rundt taket.

Røyken stiger nå både når alarmen er av og når den er armert — før var den bundet til at
ingenting var åpent, som ga et ganske tilfeldig signal.

## Huset tegnes ikke lenger om ved armering

Tidligere lå tilstanden inne i selve SVG-strengen — nedtellingsringen og sirenene ble lagt
til og fjernet, og modusklassen sto på `<svg>`. Ved armering endret strengen seg tre ganger
på under ett sekund, og huset ble bygget på nytt midt i animasjonene.

Alle lagene ligger nå permanent i tegningen og styres av en modusklasse på containeren.
SVG-en er dermed identisk gjennom hele `disarmed → arming → armed_away → triggered`, og
skrives bare om når geometrien faktisk endrer seg: et vindu åpnes, en dør låses opp, eller
en bevegelsessensor slår ut. Det er verifisert med en test.

Alle de nye animasjonene stopper under `prefers-reduced-motion`; da står varsellysene
tent og den røde vasken ligger svakt på, uten å blinke.
