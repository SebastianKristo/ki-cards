# ki-cards 5.39.0

## `ikon_naar`: en fane kan bytte ikon etter hvor du står

```yaml
- icon: mdi:gift-outline
  aria: Post og bursdager
  utenfor: true
  ikon_naar:
    Kalender: mdi:calendar-month
  cards: […]
```

Står du på Kalender-fanen, viser knappen utenfor rada et kalenderikon. På Hytta og Framover er
den gaven, som før. Nøkkelen er tittelen på den **valgte** fanen — uten hensyn til store
bokstaver — eller nummeret, om du heller vil peke på plassen. Nevn så mange faner du vil; er ingen
av dem valgt, brukes `icon`.

Det virker på alle fanene, ikke bare den utenfor, og også i nedtrekksmenyen. Rada tegnes ikke på
nytt ved fanebytte — bare klassene settes — så ikonene byttes for seg når du velger.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Fanerada er i tillegg
satt opp med akkurat ditt oppsett — Kalender / Hytta / Framover pluss gaveknappen utenfor — og
ikonet følger: `mdi:calendar-month` på Kalender, `mdi:gift-outline` på Hytta og Framover, tilbake
til kalender når du går tilbake, og gaven når du står på knappen selv.
