# ki-cards 3.65.0

## `ki-vanning-card` 3.6.0: historikkfane

Ny fane **Historikk** med døgn for døgn over de siste 30 dagene. Søylediagram, totalen
for perioden med kostnad, snittet per vanningsdag, og hvor mange av døgnene det faktisk
ble vannet.

Tallene hentes fra **statistikk-API-et**, ikke fra tilstandshistorikken. Vanningssensorene
er `total_increasing`, og Home Assistant fører ferdig utregnet endring per døgn på dem.
Tilstandshistorikken måtte vi ellers summert selv, og den nullstilles ved omstart av HA.

Finnes ikke `change`-feltet — det kom i en nyere HA-versjon — regnes differansen mellom
døgnsummene i stedet.

Tre tilstander er dekket med en forklaring i stedet for et tomt kort: statistikken finnes
ikke ennå (HA skriver døgnstatistikk én gang i timen, så første søyle tar et døgn),
spørringen feiler, eller sensoren mangler `state_class`.

`historikk_dager: 30` styrer perioden, og `historikk_entitet` peker på en annen sensor om
du vil. Fanen krever ikke vannmåler, bare integrasjonen.

## Fordelingen fulgte ikke perioden

I Forbruk-fanen leste fordelingen per sone alltid `i_dag`, uansett om du hadde valgt Uke,
M�ned eller År. Stolpene sto dermed stille når du byttet periode, og rekkefølgen — som
sorteres på verdien — kunne vise en annen «største sone» enn periodetallene tilsa.

Nå brukes tallet for perioden du har valgt, både til stolpene og til sorteringen. Oppgir
integrasjonen bare dagstall for en sone, står det i overskriften i stedet for at kortet
viser dagstall som om de var ukestall.
