# ki-cards 3.97.1

## `ki-basseng-card` 1.7.1: feilen forteller nå hva som er galt

«Custom element doesn't exist: ki-basseng-card» uten noe mer i konsollen.

Årsaken til tausheten: kortet registrerer seg ofte fra en `.then()`, fordi LitElement
ikke finnes i frontend ennå når fila lastes. Kaster `start()` der, fanges det **ikke** av
try/catch-en bundelen legger rundt hver fil — feilen forsvinner som en ubehandlet
promise-avvisning. Resultatet er et manglende kort uten et ord om hvorfor.

Registreringen har nå egen fangst, med tre utfall som alle sier hva de er:

* `ki-basseng-card: registreringen feilet (ved lasting|etter whenDefined)` med feilobjektet
* `ki-basseng-card: LitElement fra … mangler html/css. Frontend-versjonen kan ha endret
  seg.` — hvis HA har byttet baseklasse
* `ki-basseng-card: whenDefined feilet`

Dette gjør ikke kortet mer robust. Det gjør at neste gang står årsaken i konsollen i
stedet for at den må gjettes.

Jeg klarte ikke å gjenskape feilen: kortet registreres i testrigg både alene og fra den
bygde bundelen, med den samme konfigurasjonen. Derfor denne veien.
