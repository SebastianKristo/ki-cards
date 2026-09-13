# ki-cards 3.19.0

## Nytt kort: `ki-sensor-liste-card`

Sensorer som brede piller, én per rad — sirkelmerke med ikon til venstre, navn, og
tilstand med batteriprosent under. Laget for å ligge inne i et expander-kort.

```yaml
type: custom:ki-sensor-liste-card
kolonner: 1            # 2 gir to i bredden
batteri: true          # prosent bak tilstanden
bare_aktive: false     # bare det som er åpent, ulåst eller i bevegelse
zones: …               # samme struktur som i alarmkortet
```

Kan også ta en enkel liste i stedet for soner:

```yaml
type: custom:ki-sensor-liste-card
tittel: Dører
kind: opening
items:
  - entity: binary_sensor.verandador
    name: Verandadør
    battery: sensor.verandador_battery
```

Pilla farges av sonens `color:` når sensoren er aktiv, ikonet puster rolig, og ikonet
byttes etter tilstand — åpen dør, lukket dør, åpen hengelås, lukket hengelås. Sensorer
uten svar vises gjennomstreket og nedtonet. `bare_aktive: true` gir en kort liste som
står tom med «Alt er lukket og låst» når ingenting er åpent.

## `ki-sikkerhet-card` og `ki-alarm-card`

Nytt valg `soner: false` på begge. Sikkerhetskortet slutter da etter
Av/Hjemme/Borte/Natt, og sonelistene legges i egne kort lenger ned — se
`examples/sikkerhet-popup.yaml`, der sonene defineres én gang med YAML-ankre og
gjenbrukes av hvert expander-kort.

Kortets minimumshøyde er justert tilsvarende, så det ikke reserverer plass til soner
som ikke tegnes.
