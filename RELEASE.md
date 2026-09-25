# ki-cards 5.86.0

Bygget oppå 5.85.0 fra GitHub.

## Veggpanelet: roligere meny, ikoner på lysene

**Sidemenyen:** fargene vises nå bare på siden som er åpen — den fylles i sin farge og gløder. De andre
ikonene står rolige som før. **Innstillinger nederst** beholder den blå fargen hele tiden. Punkter med
`nederst: true` har alltid fargen sin; `alltid_farge: true | false` på et punkt overstyrer.

**Lysene har fått ikoner**, ut fra navnet på lampa:

| Navn | Ikon |
|---|---|
| Stålampe, gulvlampe | stålampe |
| Taklampe | taklampe |
| Spisebord, pendel | pendel med flere lys |
| Sofabord, bordlampe, nattbord | bordlampe |
| Skjenk, kommode, hylle | bordlampe (kontur) |
| Taklist, LED | LED-list |
| Peis | peis |
| Spot, vindu, ute | spot, vindu, utelampe |

Andre lamper får en lyspære. `ikon:` på en lampe overstyrer. Ikonet lyser i lampas farge når den er på.

### Kontrollert

Begge byggesjekkene kjørt. Menyen er kjørt med dine punkter og `#strom` åpen: bare Strøm (gul, aktiv) og
Innstillinger (blå, alltid) er farget, de sju andre rolige. Lysene: Sofabord → bordlampe, Stålampe Hjørne →
stålampe, Peislampe → peis, Spisebord → pendel, Taklist → LED-list, Skjenklampe → bordlampe (kontur), en ukjent
lampe → lyspære.
