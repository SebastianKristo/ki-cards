# ki-cards 5.41.0

## Retting: knappen viste post og bursdager når du trykket på den fra Kalender

Ikonet ble til en kalender på Kalender-fanen, men trykket du på det, kom post og bursdager opp —
akkurat det du skulle bort fra.

Årsaken: `ikon_naar` og `kort_naar` slo opp mot fanen som er valgt. I det du trykker på knappen,
er det **den** som er valgt — og oppslaget så da på seg selv, fant ingen treff, og falt tilbake på
standardinnholdet.

Nå gjelder fanen du kom fra, så lenge du står inne i en fane som selv bytter innhold:

- står du på Kalender → kalenderikon, og knappen åpner månedskalenderen
- går du inn i den fra Kalender → fortsatt kalender, både ikon og innhold
- fra Hytta eller Framover → gaveikon, og post og bursdager, som før

Panelet bygges fortsatt bare om når nøkkelen faktisk endrer seg, så kalenderen henter ikke alt på
nytt hver gang du hopper fram og tilbake.

Samtidig rettet: den usynlige måleraden — den kortet bruker til å regne ut om fanene får plass —
slo opp ikonet med en variabel som ikke finnes der. Den bruker fanens eget `icon` igjen; raden
vises ikke, og ikonet der har bare betydning for bredden.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Fanerada er kjørt
gjennom hele veien: stå på Kalender, trykk på knappen, og både ikonet og panelet blir stående på
kalenderen; gå via Hytta og trykk på knappen, og det er gaven og post/bursdager.
