# ki-cards 3.79.1

## Etasjenedtrekket per rom var tomt

Feltet i 3.79.0 viste bare «Som i Home Assistant» — ingen etasjer å velge.

Valgene ble bygget ved å lese `etasje_id` fra rommene på nytt, på egen hånd. Det gir
samme liste som gruppene når attributtene er som forventet, men det er et **annet
kodeløp** enn grupperingen editoren viser. Er lista tom mens gruppene finnes, har du
ingen måte å se hvorfor — og jeg klarte ikke å gjenskape det her.

Valgene bygges nå fra `_floors()`, altså nøyaktig de gruppene editoren alt viser, pluss
nøklene i `etasje_innstillinger`. Da kan nedtrekket ikke være tommere enn gruppene du
ser på skjermen. En etasje du har gitt navn eller rekkefølge er med selv om ingen rom står
i den akkurat nå — nyttig nettopp når du skal flytte det første rommet dit.

To ting til, som testene viste:

* En etasje uten navn het før nøkkelen sin. «forste_etasje» vises nå som «Forste etasje».
* «Uten etasje» arvet navnet til det første rommet uten etasje, så gruppa kunne hete
  «Kjeller». Den heter nå alltid «Uten etasje».

Tre oppsett er kontrollert: ditt med navngitte etasjer, et der Home Assistant ikke har
etasjer i det hele tatt, og et uten `etasje_innstillinger`.
