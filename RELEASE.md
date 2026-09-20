# ki-cards 5.32.0

## Flata bak fanerada kan males over

Rada over strømregningen har ingen egen bakgrunn. Den du ser bak den, kommer fra dashbordet:
noe legger en flate bak **hele** kortet — temaet, popupen eller en card-mod-regel — og rada er
smalere enn kortet, så flata blir synlig i stripa rundt den. Den ligger utenfor kortet, og kan
derfor ikke fjernes inne fra kortet.

Tre måter ut, alt etter hva du vil se:

```yaml
faner_bakgrunn: var(--gray000)   # mal stripa i popupens egen farge, så flata forsvinner
faner: i                         # legg rada på kortflaten; da er det kortet som ligger bak
faner: over                      # standard: rada for seg selv, med det som nå er bak
```

`faner_bakgrunn` tar hvilken som helst CSS-farge eller variabel. Stripa får samme
`--ha-card-border-radius` i toppen som et kort, slik at den runder av likt der flata bak gjorde
det. Verdien vaskes for anførselstegn og vinkelparenteser før den settes, siden den går rett inn
i et `style`-attributt.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 60 kort bygges med hass. Med `faner_bakgrunn`
satt får rada klassen `malt` og `style="background:var(--gray000)"`; uten den står den helt uten
`style`, som før. `faner: i` legger fortsatt rada inne i kortflaten, `faner: false` gir bare
måneden.

Inneholder også 5.26.0 til 5.31.0.
