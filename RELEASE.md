# ki-cards 4.8.0

## `ki-hytte-card` 2.5.0

### Tastaturet falt tilbake til bokstaver etter hvert tall

Skrev du «12.7» på mobil, måtte du inn i talltastaturet igjen for hvert eneste tegn.

Årsaken: jeg tegnet om hele panelet ved hvert tastetrykk. Da byttes input-elementet ut
med et **nytt element**, og et nytt felt får nytt tastatur — mobilen begynner på
bokstaver igjen. Fokus og markør ble satt tilbake, så det så nesten riktig ut, men
tastaturmodusen kunne ikke reddes.

Nå røres bare svarboksen ved tasting. Input-feltet står urørt fra det opprettes til du
lukker søket, og tastaturet blir stående der du satte det.

Feltet har også fått `autocomplete="off"`, `autocapitalize="off"` og `spellcheck="false"`
— ingen stor sak hver for seg, men til sammen slutter mobilen å foreslå og rette midt i
en dato.

### Søket ligger bak et forstørrelsesglass

Knappen står til høyre for fanerada, i samme form som tannhjulet i bassengkortet: rund,
38 px, og den lyser i `--active-big` når søket er åpent. Lukket tar feltet ingen plass.

Åpner du søket fra en annen fane, hopper kortet til Kalender, siden det er der svaret
hører hjemme. Lukkeknappen tømmer søket og lukker feltet i én bevegelse.

Feltet er høyere enn før — 46 px mot 40 — med større tekst, og glir ned i stedet for å
dukke opp.

### Kontrollert

Lukket søk gir ingen markup i det hele tatt. Ved tasting kjøres bare `.soksvar`, aldri
`_tegn()` eller `_oppdaterPaneler()`. Svaret følger teksten tegn for tegn: «uke 2» gir uke
2 og «uke 28» gir uke 28, og fire ulike datoer gir fire ulike svar.
