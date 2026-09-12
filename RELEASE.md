## Rettet

**ki-media-card 1.9.0**
- Volumsporet er ikke lenger et stylet `input[type=range]`. Nettleserne tegner det ulikt, og i WebKit – altså Safari og companion-appen – forsvant fargen uansett hvordan gradienten ble skrevet. Nå er spor, fyll og knott vanlige elementer, med et usynlig range-felt oppå for berøring, drag og tastatur
- Samme mål som før: 8 px spor i `--gray100`, fyll i `--active-big`, hvit knott på 18 px
