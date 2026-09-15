# ki-cards 3.61.0

## `ki-avfall-card` plukket opp sensorer som ikke er avfall

Kortet viste «Neste tømming: I dag — Data energy yearly» og «Deretter sun solhøyde om
-14 dager».

Årsaken var min egen reserveløsning: når dager-attributtet manglet, leste kortet dagene
fra sensorens tilstand i stedet. Da blir hvilken som helst tallsensor en gyldig
avfallsfraksjon, og solhøyden på −14 sorterte seg naturlig nok først.

Tre ting er rettet:

**Dager-attributtet kreves** når kortet leter etter mønster. En sensor uten
`days_to_pickup` er ikke en avfallssensor, uansett hva den heter. Oppgir du `entities:`
selv, stoler kortet på deg som før.

**Mønsteret ankres** med `^` og `$` om det ikke er ankret selv, så det må treffe hele
entitets-id-en. Før kunne «rest» treffe `sensor.data_energy_yearly` midt i navnet.

**Urimelige verdier forkastes.** Negative dager eller mer enn to år fram betyr at
sensoren ikke handler om tømming, eller at datoen er utdatert.

Etter dette gir selv `monster: "sensor\\..*"` — som treffer alt — riktig resultat.

## Eksempelet bruker `entities:` i stedet for `monster:`

Bakstrekene i et regexuttrykk overlever ikke alltid en runde i YAML-editoren, og et
mønster som havarerer er vanskelig å skille fra et som treffer for bredt. En liste med
fire sensornavn er kjedeligere og alltid riktig. `monster:` finnes fortsatt for den som
vil.
