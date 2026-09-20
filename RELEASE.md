# ki-cards 5.28.0

## Strømregningen er ett kort med faner: Dag · Uke · Måned · År

`vis: regning` — det kortet som alt står øverst i strømpopupen — har fått fanerada på toppen, i
samme form som i lanseringskortet: fire piller i et fylt spor, med kalenderknappen som egen rund
knapp ytterst.

```yaml
type: custom:ki-strom-detaljer-card
vis: regning        # åpner på Måned
fane: uke           # eller åpne på en annen fane: dag | uke | maned | ar
faner: false        # eller dropp rada og vis bare måneden, som før
```

**Måneden er uendret.** Den leses fortsatt rett fra Strømkalkulator — estimatet, den stablede
stolpa, postene, Norgespris-linja og forbruket dag mot natt — og virker uten noe mer installert.

**Dag, uke og år er bygget i samme form:** tallet, den stablede stolpa, postene i to kolonner, og
under en søyle per døgn (per måned i År-fanen). Dag viser de siste to ukene som bakteppe, Uke går
fra mandag til i dag, År har de tolv månedene og forbruket i kWh summert. Trykk på en søyle, så
bytter hele blokka til det døgnet — også tallet øverst og postene; trykk igjen for å komme tilbake
til perioden.

**Kalenderknappen** viser månedskalenderen med kronene i hver rute. Fanen du kom fra blir stående
merket, så du havner samme sted når du lukker den.

Disse tre fanene og kalenderen kommer fra `ki_enhetsforbruk` 1.1.0. Er den ikke satt opp, sier
fanen fra i klartekst — Måned-fanen virker uansett. `vis: aar` er beholdt og er nå bare samme kort
åpnet på År.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 60 kort bygges med hass. Kortet er i tillegg
tegnet med oppdiktede tall, i alle fanene: riktig antall søyler (14 / 7 / 12), riktig tall øverst,
stablet stolpe og postliste i hver, forbruksdelen bare der kWh finnes, døgn- og månedsvalg som
bytter både overskrift og sum, kalender med 42 ruter — og samme kort uten integrasjonen, der
Måned-fanen står som før og de andre forklarer hva som mangler. Ingen `NaN` og ingen tomme beløp.

Inneholder også 5.26.0 og 5.27.0. Ingen andre kort er rørt.
