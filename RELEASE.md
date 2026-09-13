# ki-cards 3.38.0

## `ki-strompris-card` på brede skjermer

**Innholdet fylte ikke kortet.** `maks_bredde` sto på 620 px som standard, og innholdet ble
sentrert innenfor den grensen. På et vanlig mobilkort merkes det ikke, men på en utbrettet
Pixel Fold — eller et bredt dashbord — ble kortet liggende med tomme marger på begge sider.

Standarden er nå 100 %, altså full bredde av kortet. Vil du fortsatt holde innholdet samlet
på veldig brede flater, sett `maks_bredde: 620px` selv.

**Grafen ble strukket.** SVG-en hadde fast høyde i piksler mens bredden vokste fritt, med
`preserveAspectRatio="none"`. Jo bredere skjerm, jo flatere kurve — prisforskjellene ble
visuelt borte nettopp der det er mest plass til å vise dem.

Høyden følger nå bredden gjennom `aspect-ratio`, med `hoyde` som minimum og 1,9 ganger
det som tak. Forholdet styres med `graf_forhold: 2.6` (bredde delt på høyde) — lavere tall
gir høyere graf.

Begge deler er rene standardendringer: har du satt `maks_bredde` eller `hoyde` selv,
gjelder dine verdier som før.
