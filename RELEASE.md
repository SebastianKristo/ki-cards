# ki-cards 3.70.0

## `ki-avfall-card` 2.1.0: månedskalender

Ny kalendervisning, bygget etter samme mønster som kalenderen i `ki-lansering-card`:
månedsrutenett med mandag først, piler mellom månedene, dagen i dag markert, og en liste
under for dagen du trykker på. Fargeprikker på hver dag forteller hvilke fraksjoner som
tømmes — blå for papir, grønn for glass og metall, og så videre.

En knapperad øverst bytter mellom **Fraksjoner** og **Kalender**. `visning: kalender`
åpner rett i kalenderen.

**Om datoene, som er det ærlige forbeholdet.** Sensorene oppgir bare *neste* tømming per
fraksjon. En månedskalender trenger flere, og det finnes to kilder:

* `kalender_entitet: calendar.renovasjon` — har renovasjonsselskapet en kalender i Home
  Assistant, brukes den, og datoene er faktiske.
* `intervall_dager: 14` — ellers framskrives datoene fra neste tømming. De fleste
  fraksjoner går hver 14. eller 28. dag, så det treffer som regel. Men det er et anslag,
  og kortet skriver det i klartekst under kalenderen i stedet for å late som det er
  hentet fra kilden. `intervall` kan også settes per fraksjon.

## Søppelflisene ligger nå i kortet

`examples/soppel-popup.yaml` bruker ikke lenger `auto-entities` med
`template_sensor_big_alt`. Malen har stor skrift i ett felt, og «I morgen» ble klippet
uansett hvor mye jeg justerte størrelsen — det var å lappe på noe som ikke passet.

Fraksjonene ligger i stedet som rader i kortet, med ikonet i farget sirkel, navnet, datoen
med ukedag og nedtellingen hver på sin plass. Det gir samme formspråk som resten av
dashbordet, og ingenting klippes.
