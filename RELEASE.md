# ki-cards 5.63.0

## family-status-card: servermenyen kommer med en gang igjen

Siden 5.52.0 venter et trykk på navnet 250 ms når dobbelttrykk har en handling — for å se om det
kommer et trykk til. Med kiosk-vekslingen på dobbelttrykk gjaldt det hvert trykk, også det som
åpner servermenyen. Det er de 250 millisekundene du har merket.

Menyen åpnes nå på første trykk, uten å vente. Ventingen finnes for å skille et trykk fra et
dobbelttrykk, men å åpne en meny er ufarlig å angre: kommer det et trykk til innen fristen, lukkes
menyen igjen og dobbelttrykket kjøres som før. Kiosk-vekslingen virker altså fortsatt, og menyen er
like rask som før 5.52.0.

Ligger menyen på en annen gest (`server_meny_med: hold`), er ingenting endret.

### Kontrollert

Begge byggesjekkene kjørt: 114 kort leser styles, 62 kort bygges med hass. Gestene er kjørt for seg:
første trykk åpner menyen uten å vente, et andre trykk innen fristen lukker den og veksler kiosk, og
ett trykk som får stå gir menyen uten kiosk-veksling.
