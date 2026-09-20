# ki-cards 5.42.0

## Kalenderen: like store dager, ny kalendervelger, og «I dag» på én linje

**Dagene er nøyaktig like store.** Valgt dag hadde `transform: scale(1.06)` og dagens dato en
`outline`, som tegnes *utenfor* sirkelen — to grunner til at én dag så annerledes ut enn naboene.
Nå ligger begge markeringene i farge og innvendig ring (`box-shadow: inset`), og hver dag har
`width: 100%` med fast forhold. Ingenting endrer størrelse når du trykker.

**Kalendervelgeren er en knapp.** Pillerada ble trang med ni kalendere: navnene ble klippet, og du
måtte dra i en rad som lett kolliderte med rullingen. Nå er det en knapp ved siden av pilene som
folder ut ei liste — én rad per kalender med farge, navn og avkryssing, «Vis alle» / «Skjul alle»
øverst, og en teller som sier hvor mange som vises. Knappen står fylt når noe er skjult.

```yaml
filtre: knapp      # standard
filtre: piller     # den gamle rada
filtre: false      # ingen velger
```

**«I dag» sto på to linjer** når månedsnavnet ble langt. Knappene har fått `white-space: nowrap`,
og toppen er en vanlig flex-rad der månedsnavnet tar plassen som blir til overs.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Kortet er i tillegg
kjørt mot et oppdiktet kalender-API: 35 ruter, fire dager med merke, riktige tall, og velgeren med
én rad per kalender — telleren går fra «3 av 3 vises» til «2 av 3 vises» når du huker av en, og
raden står dempet. Bla fram gir oktober, og «I dag»-knappen dukker opp.
