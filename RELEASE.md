# ki-cards 5.85.0

Bygget oppå 5.84.0 fra GitHub.

## Sidemenyen i farger — nå faktisk med

Fargene i sidemenyen på veggpanelet var beskrevet i 5.83.0, men kom aldri opp: det finnes to pakker med navnet
`ki-cards-5.83.0.zip`, og den som ble pushet, var den første — uten menyfargene. Derfor så du dem ikke. De er
lagt inn igjen her:

- hvert ikon i sin farge på en svak tone av samme farge — strøm gul, klima oransje, Tesla rød, media rosa,
  server blå, datamaskiner og støvsuger turkis, planter grønn, søvn lilla
- siden du står på, fylles helt i sin farge og gløder
- `farge:` på et menypunkt overstyrer; `levende: false` gir den rolige menyen

Fargene i varmen og lysene, nattkortet, «God morgen» og Plex (5.82.0) er med som før.

## ki-sikkerhetspanel-card 1.3.0: flere hendelser

- Hendelsene hentes for **de siste 7 dagene** (`dager:`), ikke bare det siste døgnet.
- **8 vises først** (`hendelser:`), og **Vis flere hendelser** henter 12 til hver gang, til alle er vist.
- **Dagsoverskrifter** — «I dag», «I går», så ukedag og dato — når lista går over flere dager.

### Kontrollert

Begge byggesjekkene kjørt; menyfargene er i `dist/ki-cards.js`. Sidemenyen er kjørt med dine menypunkter
(riktig farge per punkt, aktiv side markert). Sikkerhetspanelet er kjørt med 40 hendelser over fem dager:
hentet for 7 dager, 8 rader med «I dag» og «I går», 20 etter første «Vis flere», alle 40 til slutt og knappen
borte. Ansiktsgjenkjenningen og tastaturet som før. Ingen `NaN` eller `undefined`.
