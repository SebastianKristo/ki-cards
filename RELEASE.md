# ki-cards 4.34.0

## Dra virket ikke i etasjevelgeren

Opptaket viste det tydelig: pilla **hoppet** mellom fanene og var aldri midt imellom, og
den lot seg ikke dra.

`KI.pillefaner` ble koblet på **én gang** for `simple-tabs`, fra `injectTabsStyle`. Men
simple-tabs er Lit-basert og tegner fanerada på nytt ved hver oppdatering — og da var
både pilla og pekerlytterne våre borte. Ingen satte dem tilbake.

Pilla vi så etterpå var en rest fra første tegning, ikke noe som fulgte med.

### En vakt som kobler på igjen

Hjelperen ser nå på hele shadowRoot og setter pilla inn på nytt så snart den mangler.
Lytterne følger med, så dra virker også etter en ombygging.

Det er en generell rettelse: alle kort som tegner fanerada på nytt får den, ikke bare
simple-tabs. Kort som beholder rada merker ingenting — vakta spør bare om pilla er der.

### Kontrollert

Første kall setter inn pilla og oppretter vakta på shadowRoot. Etter at rada er byttet ut
er pilla borte, og vakta setter den inn igjen på riktig fane, 104 px for fane to.

---

# ki-cards 4.33.1

Pilla hoppet i stedet for å gli i kort som tegner på nytt: sluttposisjonen ble satt med
overgangen av.
