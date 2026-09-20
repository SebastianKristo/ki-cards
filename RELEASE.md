# ki-cards 5.31.0

## Dra-effekten fra fanerada, og et valg for stripa bak

**Sprett i `KI.pillefaner`.** Klem, strekk og landing ligger nå i basen, som et valg:

```js
KI.pillefaner(this, { rad: ".skinne", knapp: ".skinne .fane", aktiv: "valgt", sprett: true });
```

Fingeren ned: pilla klemmes flat. Dra: den strekker seg i fartsretningen, mest når du drar langt.
Landing: den spretter på plass — men bare når den faktisk bytter fane, ikke på de stille
breddekorreksjonene som retter seg når skrifta er ferdig lastet.

Formen ligger på `::before`, aldri på pilla selv: pilla eier `translateX(var(--x))` til
plasseringen, og en skalering på samme element ville overskrevet den og dratt pilla til venstre
kant midt i glidningen. Fargen har reserve i basen nå (`var(--active-big, #ee95ff)`), så en rad i
et dashbord der variabelen ikke når inn får en fylt pille i stedet for bare skyggen.

Valget er av som standard, så de sju andre faneradene i pakka er uendret. Strømregningen slår det
på.

**Stripa bak rada.** Rada ligger som et eget element over kortet, og da er det dashbordet ditt som
står bak den. Ligger det en flate bak hele kortet — en ramme fra temaet eller fra popupen — blir
den synlig som en bred stripe bak en rad som er smalere enn kortet. Det er den du ser, og den
kommer ikke fra kortet.

```yaml
faner: i        # legg rada på kortflaten i stedet, da er det kortet som ligger bak
faner: over     # standard: rada står for seg selv over kortet
faner: false    # ingen rad, bare måneden
```

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 60 kort bygges med hass — altså også de sju
andre faneradene, som ikke sender `sprett` og oppfører seg som før. Rada er i tillegg satt opp med
basen til stede: pilla får `sprett`-klassen, stilblokka legges inn i skyggeroten med `::before`-
regelen og fargereserven. `faner: i` legger rada inne i `.k` og ingenting utenfor; `faner: false`
gir fortsatt bare måneden.

Inneholder også 5.26.0 til 5.30.0.
