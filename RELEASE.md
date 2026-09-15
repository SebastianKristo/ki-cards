# ki-cards 3.59.0

## Nytt kort: `ki-avfall-card`

Alle avfallsfraksjonene i ett kort, laget for sensorer med `days_to_pickup` og `raw_date`
slik de norske renovasjonsintegrasjonene lager dem.

```yaml
type: custom:ki-avfall-card
monster: "sensor\\.(glass_og_metallemballasje|plastemballasje|papir_og_papp|restavfall)"
```

Kortet finner sensorene selv ut fra mønsteret — eller du lister dem i `entities:` — og
sorterer etter hvor nær tømmingen er. Den nærmeste får heroen med dager i 52 px,
fraksjonsnavnet til høyre og hele datoen under: «Tirsdag 15. september». De øvrige står
som fliser i samme form som resten av dashbordet.

**Fargene kjennes igjen på navnet** og følger de norske sorteringsfargene: papir blått,
plast lilla, glass og metall grønt, matavfall oransje, restavfall grått. Treffer navnet
ingenting, blir det grått med en vanlig søppelbøtte.

**På tømmedagen** skifter heroen til fraksjonens farge, tallet blir «I dag» og pulserer,
bøtta rister, og søppelbilen kjører over nederst med hjul som ruller. To dager før eller
mindre får heroen en dempet versjon av fargen. Dagen én dag unna sier «I morgen» i stedet
for «1 dag».

Trykk på heroen eller en flis åpner more-info, eller `path` hvis du har satt den.
`prefers-reduced-motion` slår av all animasjon.

## `examples/soppel-popup.yaml`

Søppel-popupen bygget om: ett kort i stedet for `auto-entities` med en button-card-mal og
tre nøstede templatelag. Datolista framover ligger under som en `entities`-liste med
card-mod, hvis du vil ha begge.

Det gamle oppsettet regnet ut «I dag» og datoformatet i JavaScript inni YAML, én gang per
sensor. Nå gjør kortet det, og du ser resultatet i editoren i stedet for å måtte lagre og
lukke for å sjekke.
