# ki-cards 8.99.5

Bygget oppå 8.99.4 fra GitHub (ki-basseng-card 3.5 er med uendret).

## ki-vanning-card 4.3.0

- **«Vanner nå»-kortet er tatt ut av Nå-fanen.** Hagescenen øverst viser det samme.
- **Ikke lenger til toppen.** Et trykk på en sone langt nede i Soner sendte deg opp til fanerada. Kortet rullet
  den valgte fanen inn i bildet ved hver tegning — og `scrollIntoView` rullet hele popupen, ikke bare fanerada. Nå
  rulles bare fanerada, sidelengs, og bare når den er bredere enn skjermen.
- **Soner startes gjennom KI Vanning** også med OpenSprinkler, når integrasjonen finnes. Da åpner KI Vanning
  hovedventilen *før* sonen startes, i stedet for å vente på at OpenSprinkler melder at sonen går.
- **Hovedventilen stengt mens en sone går?** Da står et oransje kort øverst i Nå: «Hovedventilen er stengt», med
  hvorfor (ikke forsøkt, feil fra tjenesten, utilgjengelig, eller åpnet men stengt igjen) og en **Åpne**-knapp.
  Krever KI Vanning 3.3.2.

### Kontrollert

Begge byggesjekkene kjørt. Nå-fanen uten «Vanner nå»-kortet; med hovedventilen stengt mens S01 går står varselet
med grunnen, **Åpne** kaller `ki_vanning.apne_hovedventil`, og en sone startet fra kortet kaller `ki_vanning.kjor`.
Ingen `NaN` eller `undefined`.
