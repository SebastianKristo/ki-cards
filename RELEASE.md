# ki-cards 3.76.0

## «Ingen sensorer å vise» sa ikke hva som manglet

`ki-sensor-liste-card` dropper en rad når entiteten ikke finnes i Home Assistant. Var alle
borte, sto det bare «Ingen sensorer å vise» — teknisk sant, men ubrukelig når årsaken er
én skrivefeil eller en entitet som har byttet navn.

Nå navngis de:

> Fant ingen av disse entitetene i Home Assistant: binary_sensor.inngangsdor,
> binary_sensor.verandador. Sjekk om navnene stemmer.

Og finnes noen, men ikke alle, vises resten som før med en dempet linje under:

> Fant ikke entiteten: binary_sensor.skrivefeil

Det er den viktigste av de to. Én entitet som stille forsvinner fra en liste på tolv er
nesten umulig å oppdage.

De andre tomme tilstandene er også skilt fra hverandre: soner satt opp uten `items:` sier
det, og `bare_aktive` med alt lukket sier «Alt er lukket og låst» som før.

Kontrollert i DOM for alle fire tilfellene: alle mangler, én mangler, soner uten items, og
alt lukket.

## `ki-sikkerhet-card`

`hero: false` til det innebygde alarmkortet står nå sist i konfigurasjonen, så en
`hero`-nøkkel i `tastatur`-objektet ikke kan overstyre den.
