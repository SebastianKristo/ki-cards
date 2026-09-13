# ki-cards 3.16.0

## Nytt kort: `ki-sikkerhet-card`

Animert hero for sikkerhetspopupen. Et hus i SVG som reagerer på det som faktisk skjer:

* Skjoldet øverst pulserer når alarmen er på, nikker mens den kobler på, og blir rødt
  med sirenebuer på begge sider når alarmen har gått.
* Vinduene i huset lyser oransje – ett lys per åpne dør eller vindu, opptil fire.
* Døren lyser rødt når en lås står ulåst, eller når noe med «dør», «inngang» eller
  «veranda» i navnet er åpent.
* En radarvifte sveiper over huset når en bevegelsessensor slår ut.
* Pipa ryker bare når alt er lukket og låst.
* Nedtellingsring rundt taket ved på- og avkobling.

Under huset en rad med brikker: åpne, bevegelse, låser, lavt batteri og «uten svar».
Trykk på en brikke for å folde ut hvilke sensorer det gjelder; trykk på en rad for
more-info. Brikkene farges bare når det er noe å si fra om.

Kortet leser **samme `zones:`-struktur som `ki-alarm-card`**, så sonene settes opp én
gang. I YAML kan du feste lista med et anker (`&soner`) og gjenbruke den i begge
kortene, slik eksempelet i `examples/` viser.

```yaml
type: custom:ki-sikkerhet-card
entity: alarm_control_panel.alarm
navn: Hjemme
batteri_grense: 20      # brikke når noe er under denne prosenten (0 = av)
kompakt: false          # lavere hus, for smale popuper
zones: …                # som i ki-alarm-card
```

Alle animasjoner er slått av under `prefers-reduced-motion`.
