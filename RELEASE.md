# ki-cards 5.27.0

## Strømregningen har fått fanerad: Dag · Uke · Måned · År

`vis: aar` åpner nå på en fanerad i samme form som i lanseringskortet — fire piller i et fylt
spor, med kalenderknappen som egen rund knapp ytterst.

```yaml
type: custom:ki-strom-detaljer-card
vis: aar
```

Tallet øverst følger fanen: i dag, denne uken, måneden hittil (med anslaget for hele måneden ved
siden av) eller året hittil (med avviket mot i fjor som merke).

Under står søylene, og de betyr det samme i alle fanene — ett døgn per søyle, bortsett fra i
År-fanen, der det er én per måned:

- **Dag** viser de siste to ukene som bakteppe, med dagens poster under
- **Uke** viser mandag til i dag, med ukedagen under hver søyle
- **Måned** viser døgnene hittil i måneden, med datoen under hver femte
- **År** viser de tolv månedene, med den som går merket «(nå)»

Trykk på en søyle, så bytter postene under til akkurat det døgnet — strøm, nettleie, avgifter og
fradragene i grønt. Trykk en gang til, og du er tilbake på hele perioden. Kalenderknappen bytter
til månedskalenderen, der kronene står i hver rute og bakgrunnen blir sterkere jo dyrere døgnet
var; fanen du kom fra blir stående merket, så du havner samme sted når du lukker den igjen.

Kalenderknappen har egen klasse og er med vilje ikke en `.fane` — ellers hadde glidepilla fra
`KI.pillefaner` regnet den som en femte fane og glidd bort til den. Står kortet uten ki-cards-basen,
beholder fanen sin egen bakgrunn i stedet for pilla.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 60 kort bygges med hass. Alle fire fanene er i
tillegg tegnet med oppdiktede tall: riktig antall søyler i hver (14 / 7 / 20 / 12), riktig tall
øverst, fire postlinjer, døgnvalg som bytter både overskrift og sum, og kalenderen med 42 ruter —
ingen `NaN` og ingen tomme beløp noe sted.

Inneholder også 5.26.0, som la inn selve årsvisningen. Ingen andre kort er rørt.
