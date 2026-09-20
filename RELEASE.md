# ki-cards 5.43.0

## Retting: velgerknappen gjorde ingenting, og dagen i dag ble en oval

**Knappen for å velge kalendere virket ikke.** Kortet leter etter knappen som ble trykket ved å
gå gjennom `data-`-feltene i klikkbanen — og `data-velger` og `data-alle` sto ikke i den lista.
Knappen fantes, men trykket traff ingenting. Nå er alle knappene med, og velgeren åpner, huker av
og lukker som den skal, inkludert «Vis alle» / «Skjul alle».

**Dagen i dag var en oval.** Et rutenett strekker elementene til radhøyden som standard, og da
overstyres `aspect-ratio` — sirkelen ble bredere enn høy. Dagene sentreres nå i raden
(`align-self: center`) i stedet for å strekkes, så alle er nøyaktig like runde uansett hva raden
måtte være.

Valgt dag har heller ingen ring lenger: den er den samme sirkelen som de andre, bare i
aktivfargen — akkurat som du ba om.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Velgeren er i tillegg
kjørt med ekte klikk-hendelser: knappen åpner lista, et trykk på en rad huker den av og telleren
går fra «2 av 2 vises» til «1 av 2 vises», «Vis alle» setter den tilbake, og et nytt trykk på
knappen lukker lista.
