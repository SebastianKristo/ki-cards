# ki-cards 5.50.0

## Detaljene åpner der du er, ikke øverst i kortet

Detaljlaget lå over selve kortet (`position: absolute; inset: 0`). Hadde du bladd deg ned til rad
nummer tolv og trykket, åpnet det seg oppe ved kortets topp — utenfor skjermen — og du måtte rulle
opp for å se det du nettopp trykket på.

Nå åpner det midt i skjermen, som en dialog: dempet, uskarp bakgrunn bak, kortet fjærer inn, og det
er like langt unna uansett hvor i lista du står.

- **Trykk utenfor** lukker, i tillegg til X-knappen og «Tilbake».
- **Escape** lukker også.
- `detalj_plass: kort` gir den gamle plasseringen over kortet.

`position: fixed` regnes fra nærmeste forfar med `transform` eller `filter`, og enkelte popup-rammer
har nettopp det. Kortet måler derfor laget etter at det er tegnet, og ruller det inn i bildet hvis
det likevel skulle havne utenfor skjermen — i stedet for å bli stående usynlig.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Kortet er i tillegg kjørt
med tolv rader: å åpne rad ti gir laget med riktig tittel, bakgrunnslag og skjermplassering; trykk
utenfor og Escape lukker begge; og `detalj_plass: kort` gir laget uten bakgrunn, akkurat som før.
