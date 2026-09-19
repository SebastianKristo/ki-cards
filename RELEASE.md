# ki-cards 4.36.0

## Ett kort per fane, redigert med Home Assistants egen editor

«+ Legg til kort» legger nå inn et **vertical-stack**, og du redigerer det som et hvilket
som helst kort i HA.

Editoren hadde en egen kortliste med opp, ned, blyant og slett. Det var å bygge om igjen
noe HA gjør bedre: med et vertical-stack i fanen får du HAs kortvelger, dra-og-slipp,
forhåndsvisning og alle korttyper — også de du installerer senere.

Rundt hundre linjer egen kode er borte: kortlista, flytting, sletting og navnetolkningen
`custom:ki-varsling-card` → «Ki varsling card».

### Gamle oppsett virker som før

Kortet leser fortsatt `cards:` som liste i YAML, og den tegnes uendret. Åpner du en slik
fane i editoren, vises kortene som ett vertical-stack, med en merknad om at de lagres
slik når du endrer noe.

Har fanen nøyaktig ett kort, brukes det direkte uten innpakning.

### Kontrollert

Tom fane gir «+ Legg til kort», som skriver
`card: {type: vertical-stack, cards: []}`. En fane med et vertical-stack gir HAs editor
og en fjern-knapp. En gammel `cards:`-liste med to kort gir merknaden og sendes til
editoren som ett vertical-stack.

---

# ki-cards 4.35.0

Dra i etasjevelgeren: rada er rullbar sidelengs, så nettleseren tok gesten.
`touch-action: none` på knappene, pekerfangst ved trykk, og lyttere der pekeren fanges.
