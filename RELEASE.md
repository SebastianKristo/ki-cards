# ki-cards 5.47.0

## family-status-card: menyen åpner på et vanlig trykk, og har fått nytt utseende

**Retting — du måtte holde fingeren på navnet.** Menyen åpnet seg i `pointerup`. Da ble laget som
lukker ved trykk utenfor tegnet rett under fingeren, og `click`-hendelsen som alltid kommer etter
`pointerup`, traff det laget og lukket menyen igjen med en gang. Et langt trykk sender ikke `click`
— derfor virket det bare når du holdt litt. Nå åpner menyen på `click`, og et langt trykk blir
merket så det ikke også teller som et trykk.

**Ny meny.** Et lite ark som folder seg ut fra navnet, med en spiss som peker opp mot det:

- overskriften «Bytt sted»
- én rad per sted med en farget ikonflis — Oslo grønn by, Strömstad blått fyrtårn, Toten gul
  traktor, samme farger som i hyttekortet
- «Du er her» som merkelapp på stedet du står på, pil på de andre
- radene kommer inn én og én, og trykkes ned når fingeren står på dem

Ikon og farge kan settes per sted:

```yaml
servere:
  - navn: Oslo
  - navn: Strömstad
    server: Strømstad
    ikon: mdi:sail-boat
    farge: var(--blue)
  - navn: Toten
```

Steder den ikke kjenner igjen, får et hus-ikon og en farge fra resten av paletten.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Trykkhåndteringen er
kjørt for seg: trykk (ned, opp, klikk) åpner menyen; langt trykk (ned, 500 ms, opp, klikk) åpner
den ikke og gjør i stedet det langt trykk alltid har gjort; med `server_plass: under` navigerer
et trykk på hilsenen som før. De tre stedene får fyrtårn, traktor og by-ikon uten oppsett.
