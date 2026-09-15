# ki-cards 3.56.0

## `.switch` tåler mer enn to valg

Bryteren som brukes i `ki-energi-card`, `ki-sovn-pro-card` og de andre pro-kortene var
låst til `grid-template-columns: 1fr 1fr`. Med to valg gikk det fint, men et tredje ville
havnet på egen rad og tatt halve bredden.

Den bruker nå `grid-auto-flow: column` med `grid-auto-columns: 1fr`, så halvdelene
fordeler seg likt uansett antall. `white-space: nowrap` og `min-width: 0` er lagt til, så
en lang etikett ikke brekker midt i ordet eller presser bryteren bredere enn kortet.

Endringen ligger både i `KI.css` i basen og i `ki-energi-card`, som har sin egen kopi av
regelen. Selve utseendet er identisk med to valg — `--gray200` bak, 75 px hjørner, valgt
halvdel i `--active-small`.

`ki-kamera-card` fikk samme oppsett i 3.55.1, så alle tre bryterne er nå like i både
utseende og oppførsel.
