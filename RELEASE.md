# ki-cards 3.64.0

## `ki-kamera-card` 1.11.0: rutenettet tilpasser seg bredden

Alle oppsettene var låst til to kolonner. På en bred skjerm ble hver celle over tusen
piksler bred med fast radhøyde, og bildet beskåret hardt — og med seks eller sju kameraer
ble radene så lave at det knapt var noe igjen å se.

**Rutenett-oppsettet regner nå ut kolonnetallet fra bredden.** Bredden deles på ønsket
minstebredde per celle, begrenset av hvor mange kameraer du har:

| Bredde | 5 kameraer | 7 kameraer |
| --- | --- | --- |
| 700 px | 1 | 1 |
| 1000 px | 2 | 2 |
| 1400 px | 3 | 3 |
| 1900 px | 4 | 4 |

To skruer: `min_bredde: 420` er minstebredden per celle, og `maks_kolonner: 4` taket.
Vil du ha fem kameraer i bredden på en stor skjerm, sett `min_bredde: 320` og
`maks_kolonner: 5`.

Kortet tegner om når kolonnetallet endrer seg, ikke bare når det krysser smal/bred-grensen
— før hang rutenettet igjen på gammelt antall til noe annet utløste en ny tegning.

**Lufta mellom cellene** sto fast på 1 px, som ble påfallende tett. Standarden er nå 6 px,
og `gap:` kan settes til et tall eller en CSS-verdi. `gap: 0` gir det gamle uttrykket.

De faste oppsettene — Mosaikk, Hovedkamera og Liste — er uendret. Vil du ha det adaptive,
velg **Rutenett**.
