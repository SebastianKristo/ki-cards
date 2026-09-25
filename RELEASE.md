# ki-cards 8.99.3

Bygget oppå 8.99.2 fra GitHub.

## ki-basseng-card 3.5.0

- **Full editor i grensesnittet.** Alt kortet kan settes opp med, i fire utvidbare seksjoner:
  *Generelt* (hele kortet eller bare scenen, scenen av/på, tittel, prefiks), *Faner* (uten
  faner, eller hvilke og i hvilken rekkefølge), *Varmepumpe og knapper* (varmepumpe,
  stillemodus, hurtigknapper, navn under knappene) og *Utseende* (tekststørrelse i
  setningene, dashbordets fliser, grafen, egne temperaturknapper). Det som er lik
  standarden, skrives ikke til YAML-en, og navn og ikon på hurtigknappene fra YAML beholdes.
- **Større setninger** på Oversikt og Varme: 1,4em, som forsideteksten. Velg 1,2–1,8 i
  editoren eller med `prosa_storrelse:`.
- **«Manuell overstyring – automatikken venter»** står ikke lenger nederst på Oversikt.

---

# ki-cards 8.99.2

Bygget oppå 8.99.1 fra GitHub.

## ki-vanning-card 4.2.0: nedtelling når en sone startes med fast tid

Startet du en sone for en fast tid — S01 i 5 minutter — sto det ingen nedtelling. OpenSprinklers statussensor
melder ofte bare «running» eller «manual», uten hvor lenge det er igjen, og kortet hadde ingenting å telle ned fra.

Nå husker kortet når sonen skal være ferdig i det du starter den (med varighetsknappene eller spilleknappen), og
teller ned fra det — i hagescenen, i «Vanner nå»-kortet og i fyllet på sonen i Soner-fanen. Tiden lagres i
nettleseren, så nedtellingen står også etter at popupen er lukket og åpnet igjen. Stopper du sonen, eller den er
ferdig, glemmes den.

Rekkefølgen for hvor tiden hentes fra: tid igjen i statussensoren («4:12»), tid igjen eller sluttid i sensorens
attributter, og til slutt det kortet husket selv.

### Kontrollert

Begge byggesjekkene kjørt. S01 startet i 5 minutter med statusen «manual»: `opensprinkler.run_station` med 300
sekunder, «5:00» i scenen og i «Vanner nå», fortsatt «5:00» i et nytt kort (popupen åpnet på nytt), og glemt når
sonen stoppes.
