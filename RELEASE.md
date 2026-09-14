# ki-cards 3.50.0

## Loggen viste bare det første døgnet av perioden

Diagnoselinja avgjorde det: «alarm: 0 · dorlas_blatann: 8 · ansikt: 0», med alle åtte
låseradene seks dager gamle — i et vindu på sju dager.

Loggbokens REST-endepunkt returnerer **ett døgn** fra tidspunktet du oppgir hvis du ikke
sier noe annet. `logbook/<sju dager siden>` ga altså døgnet som begynte for sju dager
siden, og ingenting etter det. Låsen hadde tilfeldigvis aktivitet nettopp det døgnet, mens
alarmen og ansiktssensoren ikke hadde det — derfor åtte rader fra den ene og null fra de
to andre.

`end_time` settes nå til nå, så hele perioden kommer med.

Testet med hendelser spredt over sju dager: både det som skjedde for et kvarter siden og
det som skjedde for seks dager siden kommer med, sortert riktig.

Det var tre feil på rad i samme spørring — `minimal_response` som kuttet svaret, feil sti,
og manglende `end_time`. Diagnoselinja fra 3.48 er grunnen til at den siste ble funnet på
ett forsøk i stedet for fire; behold `diagnose: true` til du ser tall du kjenner igjen.
