# ki-cards 3.52.0

## Editoren for `ki-hjem-card` er skrevet om

Den gamle var skjemadrevet med flate feltnavn: `rom_<område>_farge`, `et_<etasje>_vis`.
Hvert felt måtte finnes på fire steder — skjemaet, `_data()`, `_toConfig()` og
etikettlista — og navnene ble tolket ved å splitte på understrek. Det er derfor
«Vis rom» og «Vis etasje» kolliderte, og derfor «!»-merket krevde et eget
`varselvis`-felt.

Nå eier hvert felt sin egen sti i konfigurasjonen, og leser og skriver rett på den:

```js
F.tekst('rom.stue.farge', 'Farge, f.eks. var(--green)')
F.valg('rom.stue.size', 'Størrelse', [...], 'big')
```

Et nytt felt legges til på ett sted. Felt med særegen lagring — alarmen som er streng
eller objekt, batterier som er `true` eller `{terskel}`, `skjul` som er snudd, `varsel`
som er `false` eller en entitet — oppgir sin egen `les` og `skriv` ved siden av.

## Konfigurasjonen bevares av seg selv

Dette er den viktigste endringen. Den gamle editoren bygget konfigurasjonen opp fra bunnen
ved hver tastetrykk, og måtte derfor liste opp alt den skulle ta med videre — `tabs`,
`monster`, `hopp_over`, rom som ikke lenger finnes i Home Assistant. Glemte man én, forsvant
den ved neste lagring.

Nå skrives endringen på en kopi av konfigurasjonen. Alt editoren ikke kjenner blir stående
uten at den vet om det. Verifisert med et oppsett som inneholder nøkler editoren aldri har
hørt om: de er uendret etter redigering.

Tomme felt fjerner nøkkelen i stedet for å skrive blank streng, og objekter som blir tomme
ryddes bort — så YAML-en holder seg like kort som om du skrev den for hånd.

## Oppsettet

Sammenfoldbare seksjoner som før: Hjem, Aktuelt, Batterier, Etasjer, én per etasje, én per
rom under sin etasje, og flislista nederst. Hvert rom viser sammendrag i overskriften.
Romplasseringen med piler og kolonnebytte er beholdt uendret øverst.

Nye felt som ikke fantes i editoren før: popup-hash for dørlås og garasje, og fanenavn og
rekkefølge per etasje.
