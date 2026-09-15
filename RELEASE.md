# ki-cards 3.55.1

## `ki-kamera-card`: tilbake til det gamle, med ny kildebryter

Redesignet i 3.55.0 gikk for langt. Overskriften og kameravelgeren er tilbake som de var:
38 px ikonfelt med `--gray200`, tittel i 22 px vekt 600, og kameravelgeren som løse
pilleknapper med 16 px hjørner som ruller sidelengs.

Det som beholdes er **kildebryteren mellom Frigate og Vanlig**, og den er nå den samme
brede bryteren som Vekking/Søvn i søvnpopupen: `--gray200` bak, 75 px hjørner, 4 px luft,
og den valgte halvdelen i `--active-small` med `--gray100`-tekst.

Den gamle kildebryteren hadde firkantede 16 px-hjørner og hvit tekst på `--active-big`.
`--active-small` er laget for nettopp denne bruken og gir riktig kontrast.

Bryteren bruker `grid-auto-columns: 1fr` i stedet for `1fr 1fr`, så den fordeler seg likt
uansett om det er to kilder eller flere.
