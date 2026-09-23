# ki-cards 5.62.0

## Bassengkortet: langt trykk, brytere som svarer med en gang, og startknappen inne i kortet

`ki-basseng-card` 1.16.0.

**Langt trykk åpner entiteten.** Hold på en av knappene på Oversikt (Varm nå, Boost, Spreder,
Automatikk, Prisstyring, Varmeprioritet), på en bryterrad eller på navnet til en innstilling, så
åpner mer-info for det du holder på — med haptikk. Et vanlig trykk gjør det samme som før, og et hold
svelger klikket som ellers ville fulgt.

**Bryterne viser valget med en gang.** Et trykk på «Program på» sendte tjenestekallet, men flisen sto
i gammel tilstand til integrasjonen hadde skrevet den nye og Home Assistant hadde sendt den tilbake —
gjerne et par sekunder. Det leses som at trykket ikke tok, og man trykker igjen. Nå vises valget med
en gang, og slippes så snart entiteten er enig. Svarer den ikke innen fem sekunder, går flisen tilbake
til sannheten. Gjelder alle bryterne i kortet.

**Startknappen gikk ut av sprederkortet.** Knappen var 100 % bred *pluss* 12 px marg på hver side, og
stakk ut til høyre. Bredden tar nå hensyn til margen.

Alle tjenestekall gir dessuten haptikk som virker på iPhone (før bare `navigator.vibrate`).

### Kontrollert

Begge byggesjekkene kjørt: 114 kort leser styles, 62 kort bygges med hass. Den optimistiske
bryteren er kjørt for seg: viser «på» rett etter trykket mens entiteten fortsatt sier «av», slipper
når entiteten er enig, og faller tilbake etter fem sekunder uten svar.
