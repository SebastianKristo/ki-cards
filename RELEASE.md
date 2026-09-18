# ki-cards 4.3.0

## `ki-server-card` 1.1.0: brede rader i stedet for rutefliser

Rutenettet med fire små fliser per rad var lånt fra et annet kort og hørte ikke hjemme
her. Ingenting annet i dashbordet ser slik ut.

Serverkortet bruker nå **samme form som bannerne og info-radene i bassengkortet**: én bred
flate per opplysning, rundt ikonfelt på 42 px til venstre, navnet i midten, verdien til
høyre. Stolpen ligger langs underkanten av raden i stedet for inne i en flis, så nivået
vises uten å ta en egen linje.

Hver rad har fått sitt eget ikon — CPU, minne, temperatur, oppetid, Docker, latens og
resten — så raden kan leses på ikonet før du leser teksten.

Tall som hører sammen deler én flate med et hårfint skille mellom, slik «i dag»-flaten i
bassengkortet gjør. «Ned totalt» og «Opp totalt» er første par; `par: true` på et tall
legger det sammen med det neste.

Fargene er uendret: raden blir gul over `gul`-terskelen og rød over `rod`. RAM på 88 % med
terskler 75 og 90 blir gul, ikke rød — kontrollert.

Heroene, faneprikkene, listene, søket, knappene og oppdagelsen er uendret.

### Testet

Unraid-fanen: 13 brede rader, 0 rutefliser, hver med ikon og riktig stolpelengde.
Nedlasting: 6 rader og én par-flate med «Ned totalt 1,73 TiB | Opp totalt 0,72 TiB».
Gul og rød terskel treffer de radene de skal.
