# ki-cards 4.9.1

## Søkefeltet kom ikke opp før du trykket i kalenderen

Kortet har **to tegneveier**: `_tegn()` bygger hele kortet, og `_oppdaterPaneler()`
bytter bare innholdet i fanene. Begge tegner kalenderpanelet, men jeg la søkefeltet
bare inn i den ene.

Trykk på søkeikonet kjørte den fulle `_tegn()`, som ikke kjente til feltet. Først når du
trykket på en dag i kalenderen — som kjører `_oppdaterPaneler()` — dukket det opp.

Feltet bygges nå i begge veiene.

Kontrollert ved å trykke på ikonet i en testrigg: feltet er borte før trykket, synlig
rett etter, knappen markeres som åpen, og lukkeknappen fjerner det igjen.

Dette er samme feilklasse som med enhetskortet tidligere i dag, der jeg endret
`.info`-grenen mens `.panel`-grenen var den som faktisk kjørte. Når et kort har to veier
til samme utsnitt, må endringen inn i begge — eller de to slås sammen.
