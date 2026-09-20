# ki-cards 5.37.0

## Nytt kort: `ki-kalender-card`

En månedskalender med hendelsene fra kalenderne dine — ment for Kalender-fanen i
`#kalender`-popupen, i stedet for stabelen av `button-card` mot `sensor.alle_kalendere`.

```yaml
type: custom:ki-kalender-card
kalendere:
  - entity: calendar.sebastian_kristo_no
    navn: Sebastian
    farge: var(--active-big)
  - entity: calendar.helge_hus
    navn: Helge hus
    farge: var(--blue)
```

Hele oppsettet for kalenderne dine ligger i `examples/kalender-popup.yaml`, ferdig med farger.
Utelater du `kalendere:`, tas alle `calendar.*` som finnes, og `ekskluder:` tar bort enkelte.

- **Rutenettet** viser en prikk per hendelse i fargen til kalenderen, `+3` når det blir flere enn
  det er plass til. I dag har ring, valgt dag har fylt pille, helgedager er røde og dager fra
  nabomåneden er dempet — trykker du på en av dem, blar kalenderen dit.
- **Filterpillene** slår kalendere av og på, samme pilleform som ellers i pakka.
- **Under** ligger hendelsene for dagen du trykket på: tid, tittel og sted, med fargestrek for
  kalenderen. `dager_i_liste: 7` gjør den om til en agenda framover som hopper over tomme dager.
  Trykk på en hendelse åpner kalenderen den hører til.
- Pilene blar måned for måned, og **I dag** dukker opp så snart du har beveget deg bort.

Hendelsene hentes fra kalender-API-et, samme kilde som HAs egen kalendervisning — ikke fra
`events[0..6]` på en sensor, så det er ingen grense på hvor mange som vises. Hver måned hentes én
gang og beholdes til du bytter måned igjen, og alt hentes på nytt hvert femte minutt.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass — ett mer enn før.
Kortet er i tillegg kjørt mot et oppdiktet kalender-API: 35 ruter for september 2026, riktig
antall prikker, i dag merket, og hendelsene for dagen i lista med «Hele dagen» og «09:00 – 10:00».
En heldagshendelse fra fredag til mandag legger seg på fredag, lørdag og søndag — ikke på mandag,
siden heldagshendelser slutter ved midnatt dagen etter siste dag. Filter av fjerner prikkene til
den kalenderen, og bla fram gir oktober med «I dag»-knappen.

Kortet har ikon i `brand/` og en rad i kort-tabellen i README.
