# ki-cards 5.18.0

## Kortdialogen er ute. Redigereren brettes ut i stedet.

Jeg forsøkte `hui-dialog-edit-card` i tre utgaver. Dialogen åpnet seg hver gang, men det
den sendte tilbake ved lagring kom aldri fram til fanen.

API-et er internt i Home Assistants frontend og har byttet form mellom versjoner. Jeg
klarte ikke å treffe det uten å gjette, og tre runder med gjetting er nok.

Blyanten bretter nå ut **`hui-card-element-editor`** under rada — den samme redigereren
HA bruker inne i sine egne stabel-editorer. Den sender `config-changed` rett til oss,
uten mellomledd som kan endre seg.

Den er mindre pen enn en fullskjermdialog med forhåndsvisning ved siden av. Men den
lagrer, og det er det du ba om.

Trykk blyanten igjen for å lukke.

### Editoren byttes ikke ut mens du holder på

Vi lagrer ved hver endring, men tegner ikke om. Gjorde vi det, ville redigereren blitt
erstattet midt i arbeidet, og markøren og åpne seksjoner gått tapt.

### Kontrollert

Blyanten åpner redigereren med riktig kort. En endring der lagres i fanen. Redigereren
blir stående etter lagring, og et nytt klikk lukker den.

Koden for dialoguthentingen er slettet — rundt 40 linjer som ikke lenger har noen
oppgave.

---

# ki-cards 5.17.1

Tredje forsøk på å hente kortet ut av det dialogen sendte tilbake.
