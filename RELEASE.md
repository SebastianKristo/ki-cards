# ki-cards 5.40.0

## `kort_naar`: knappen utenfor rada viser kalenderen når du står på Kalender

`ikon_naar` fra 5.39.0 byttet ikonet. Nå kan fanen bytte **innholdet** på samme måte:

```yaml
- icon: mdi:gift-outline
  aria: Post og bursdager
  utenfor: true
  ikon_naar:
    Kalender: mdi:calendar-month
  kort_naar:
    Kalender:
      - type: custom:ki-kalender-card
        # … kalenderne dine
  cards:
    - type: custom:ki-post-card
    - type: custom:ki-bursdag-pro-card
```

Står du på Kalender, er knappen et kalenderikon og åpner månedskalenderen. På Hytta og Framover er
den gaven, med post og bursdager som før. Nøklene er de samme som i `ikon_naar`: tittelen på den
valgte fanen, uten hensyn til store bokstaver, eller nummeret.

Panelet bygges bare om når nøkkelen faktisk endrer seg. Ellers ville hvert fanebytte kastet
kortene og laget dem på nytt — og et kort som henter noe, som kalenderen, hadde hentet alt om
igjen hver gang.

Hele popupen din ligger ferdig i `examples/kalender-popup.yaml`.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Fanerada er i tillegg
kjørt med akkurat dette oppsettet: på Kalender viser knappen `mdi:calendar-month` og panelet
kalenderkortet, på Hytta `mdi:gift-outline` og post/bursdager, tilbake på Kalender igjen
kalenderen — og et nytt trykk på samme fane bygger ikke panelet om på nytt.
