# ki-cards 3.49.1

## Loggbok-stien var feil

`logbook/period/<tid>` finnes ikke. Historikk-API-et heter `history/period/<tid>`, men
loggboken heter bare **`logbook/<tid>`** — uten `period`. Jeg antok at de var bygget likt,
og kallet traff dermed ingenting.

Riktig sti brukes nå, med den gamle skrivemåten som reserve i fall en HA-versjon vil ha
den.

## «loggbok feilet: [object Object]»

Diagnoselinja skrev `e.message` rett ut, men Home Assistant kaster et objekt og ikke en
`Error` — så du fikk `[object Object]` i stedet for årsaken. Feilteksten plukker nå
`message`, `body.message`, `status`/`code`, og faller til slutt tilbake på en kort JSON.
Den samme linja viser nå «alarm: 2 · dorlas_blatann: 4 · ansikt: 2» når det går bra, og
«alarm: HTTP 404» når det ikke gjør det.

Det var den meldingen som til slutt pekte på selve feilen, så den var verdt å ha — den
skulle bare vært lesbar fra starten.
